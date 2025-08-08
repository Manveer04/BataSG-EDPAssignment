using BataWebsite.Models;
using BataWebsite;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("[controller]")]
public class VoucherController : ControllerBase
{
    private readonly MyDbContext _context;

    public VoucherController(MyDbContext context)
    {
        _context = context;
    }


    // GET: /Voucher/{id}
    [HttpGet("{id}")]
    public IActionResult GetVoucher(int id)
    {
        var voucher = _context.Set<Voucher>().SingleOrDefault(v => v.VoucherId == id);

        if (voucher == null)
        {
            return NotFound(new { message = "Voucher not found." });
        }

        var data = new
        {
            voucher.VoucherId,
            voucher.Code,
            voucher.DiscountPercentage,
            voucher.ExpiryDate,
            voucher.IsActive,
            voucher.UsageCount,
            voucher.MaxUsage  // ✅ Added MaxUsage
        };

        return Ok(data);
    }


    [HttpGet]
    public IActionResult GetAllVouchers(string? search)
    {
        IQueryable<Voucher> result = _context.Set<Voucher>();

        // Track if any updates were made
        bool isUpdated = false;

        foreach (var voucher in result)
        {
            if (voucher.IsActive) // Only update active vouchers
            {
                // Auto-disable expired vouchers OR if the usage limit is reached
                if (voucher.ExpiryDate < DateTime.UtcNow || voucher.UsageCount >= voucher.MaxUsage)
                {
                    voucher.IsActive = false;
                    isUpdated = true;
                }
            }
        }

        // Save changes if any vouchers were updated
        if (isUpdated)
        {
            _context.SaveChanges();
        }

        // Apply search filter if provided
        if (!string.IsNullOrEmpty(search))
        {
            result = result.Where(v => v.Code.Contains(search));
        }

        // Return voucher data
        var list = result.OrderByDescending(v => v.VoucherId).ToList();
        var data = list.Select(v => new
        {
            v.VoucherId,
            v.Code,
            v.DiscountPercentage,
            v.ExpiryDate,
            v.IsActive,
            v.UsageCount,
            v.MaxUsage, // Ensure MaxUsage is included in the response
            v.CreatedByStaffId,
            LastUpdatedBy = v.LastUpdatedByStaffId
        });

        return Ok(data);
    }


    // GET: /Voucher/validate?search={promoCode}
    [HttpGet("validate")]
    public IActionResult ValidateVoucher(string search)
    {
        var voucher = _context.Set<Voucher>()
            .Where(v => v.Code == search && v.IsActive && v.ExpiryDate >= DateTime.UtcNow)
            .FirstOrDefault();

        if (voucher == null)
        {
            return BadRequest("Invalid or expired promo code.");
        }

        if (voucher.UsageCount >= voucher.MaxUsage)
        {
            return BadRequest("Promo code has been fully redeemed.");
        }

        return Ok(new
        {
            voucher.DiscountPercentage,
            voucher.VoucherId
        });
    }



    [HttpPost, Authorize]
    public IActionResult CreateVoucher([FromBody] Voucher voucher)
    {
        // Retrieve the staff ID from the JWT token claims
        var staffIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized("Invalid token.");
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                .ToList();

            return BadRequest(new { message = "Validation failed", errors = errors });
        }

        if (voucher.ExpiryDate < DateTime.UtcNow)
        {
            return BadRequest("Voucher expiry date must be in the future.");
        }

        if (voucher.MaxUsage <= 0)
        {
            return BadRequest("Max usage must be greater than 0.");
        }

        var newVoucher = new Voucher
        {
            Code = voucher.Code.Trim(),
            DiscountPercentage = voucher.DiscountPercentage,
            ExpiryDate = voucher.ExpiryDate,
            IsActive = voucher.IsActive,
            MaxUsage = voucher.MaxUsage,  // ✅ Added MaxUsage
            UsageCount = 0,  // ✅ Default UsageCount to 0
            CreatedByStaffId = staffId,
            LastUpdatedByStaffId = staffId
        };

        _context.Set<Voucher>().Add(newVoucher);
        _context.SaveChanges();

        var data = new
        {
            newVoucher.VoucherId,
            newVoucher.Code,
            newVoucher.DiscountPercentage,
            newVoucher.ExpiryDate,
            newVoucher.IsActive,
            newVoucher.MaxUsage,  // ✅ Return MaxUsage
            newVoucher.UsageCount  // ✅ Return UsageCount (default: 0)
        };

        return Ok(data);
    }




    [HttpPut("{id}"), Authorize]
    public IActionResult UpdateVoucher(int id, [FromBody] Voucher updatedVoucher)
    {
        var existingVoucher = _context.Set<Voucher>().Find(id);
        if (existingVoucher == null)
        {
            return NotFound(new { message = "Voucher not found." });
        }

        // Retrieve the staff ID from the JWT token claims
        var staffIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized("Invalid token.");
        }

        // ✅ Ensure the new MaxUsage is greater than or equal to the current MaxUsage
        if (updatedVoucher.MaxUsage < existingVoucher.MaxUsage)
        {
            return BadRequest(new { message = "Max usage cannot be decreased." });
        }

        existingVoucher.Code = updatedVoucher.Code.Trim();
        existingVoucher.DiscountPercentage = updatedVoucher.DiscountPercentage;
        existingVoucher.ExpiryDate = updatedVoucher.ExpiryDate;
        existingVoucher.IsActive = updatedVoucher.IsActive;
        existingVoucher.MaxUsage = updatedVoucher.MaxUsage; // ✅ Update MaxUsage

        // ❌ Removed UsageCount update (it should only be changed when a voucher is used)

        // Set the staff ID as the one who last updated the voucher
        existingVoucher.LastUpdatedByStaffId = staffId;

        _context.SaveChanges();

        var data = new
        {
            existingVoucher.VoucherId,
            existingVoucher.Code,
            existingVoucher.DiscountPercentage,
            existingVoucher.ExpiryDate,
            existingVoucher.IsActive,
            existingVoucher.MaxUsage,  // ✅ Return MaxUsage
            existingVoucher.UsageCount  // ✅ Return UsageCount
        };

        return Ok(data);
    }


    [HttpPut("{id}/incrementUsage"), Authorize]
    public IActionResult IncrementVoucherUsage(int id)
    {
        var existingVoucher = _context.Set<Voucher>().Find(id);

        if (existingVoucher == null)
        {
            return NotFound(new { message = "Voucher not found." });
        }

        if (!existingVoucher.IsActive || existingVoucher.ExpiryDate < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Cannot use an expired or inactive voucher." });
        }

        if (existingVoucher.UsageCount >= existingVoucher.MaxUsage)
        {
            return BadRequest(new { message = "Promo code has been fully redeemed." });
        }

        existingVoucher.UsageCount += 1; // ✅ Increase usage count
        if (existingVoucher.UsageCount >= existingVoucher.MaxUsage)
        {
            existingVoucher.IsActive = false; // Auto-disable when max usage is reached
        }

        _context.SaveChanges();

        return Ok(new
        {
            message = "Voucher usage updated successfully.",
            RemainingUses = existingVoucher.MaxUsage - existingVoucher.UsageCount
        });
    }




    [HttpDelete("{id}"), Authorize]
    public IActionResult DeleteVoucher(int id)
    {
        var voucher = _context.Set<Voucher>().Find(id);
        if (voucher == null)
        {
            return NotFound(new { message = "Voucher not found." });
        }

        _context.Set<Voucher>().Remove(voucher);
        _context.SaveChanges();

        return Ok(new { message = "Voucher deleted successfully." });
    }
}
