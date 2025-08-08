using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using BataWebsite.Models;
using BataWebsite;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using System.Text.Json;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly MyDbContext _context;
    private readonly IConfiguration _configuration;

    public StaffController(MyDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private string GenerateJwtToken(Staff staff)
    {
        var secretKey = _configuration["Authentication:Secret"];
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT secret key is missing in configuration.");
        }

        var key = Encoding.UTF8.GetBytes(secretKey);
        var tokenHandler = new JwtSecurityTokenHandler();

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, staff.Id.ToString()),
                new Claim(ClaimTypes.Name, staff.Username),
                new Claim(ClaimTypes.Email, staff.Email),
                new Claim(ClaimTypes.Role, staff.Role) // ✅ Add the role claim
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] Staff newStaff)
    {
        if (string.IsNullOrWhiteSpace(newStaff.Username) ||
            string.IsNullOrWhiteSpace(newStaff.Email) ||
            string.IsNullOrWhiteSpace(newStaff.Password) ||
            string.IsNullOrWhiteSpace(newStaff.PhoneNumber))
        {
            return BadRequest("Username, email, password and phone number are required.");
        }
        if (!Regex.IsMatch(newStaff.PhoneNumber, @"^\d{8}$"))
        {
            return BadRequest("Invalid phone number. It must be 8 digits.");
        }
        newStaff.Email = newStaff.Email.Trim().ToLower();

        if (_context.Staffs.Any(s => s.Email == newStaff.Email))
        {
            return Conflict("This email is already registered.");
        }

        newStaff.Password = BCrypt.Net.BCrypt.HashPassword(newStaff.Password.Trim());
        newStaff.Username = newStaff.Username.Trim();

        _context.Staffs.Add(newStaff);
        _context.SaveChanges();

        return Ok(new { message = "Registration successful", staffId = newStaff.Id });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] Staff loginStaff)
    {
        if (string.IsNullOrWhiteSpace(loginStaff.Email) || string.IsNullOrWhiteSpace(loginStaff.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var staff = _context.Staffs.FirstOrDefault(s => s.Email == loginStaff.Email.Trim().ToLower());
        if (staff == null || !BCrypt.Net.BCrypt.Verify(loginStaff.Password.Trim(), staff.Password))
        {
            return Unauthorized("Invalid email or password.");
        }

        var token = GenerateJwtToken(staff);

        return Ok(new
        {
            Message = "Login successful",
            Staff = new { staff.Id, staff.Username, staff.Email, staff.Role },
            AccessToken = token
        });
    }

    [HttpGet("profile"), Authorize]
    public IActionResult GetProfile()
    {
        var staffIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized("Invalid token.");
        }

        var staff = _context.Staffs.FirstOrDefault(s => s.Id == staffId);

        if (staff == null)
        {
            return NotFound("Staff not found.");
        }

        var staffProfile = new
        {
            staff.Username,
            staff.Email,
            staff.PhoneNumber // Add other properties if necessary
        };

        return Ok(staffProfile);
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] JsonElement body)
    {
        try
        {
            if (!body.TryGetProperty("tokenId", out var tokenIdElement) || tokenIdElement.ValueKind == JsonValueKind.Null)
            {
                return BadRequest("tokenId is required.");
            }

            string tokenId = tokenIdElement.GetString();
            if (string.IsNullOrWhiteSpace(tokenId))
            {
                return BadRequest("Invalid tokenId.");
            }

            var clientId = _configuration["Authentication:Google:ClientId"];

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { clientId }
            };

            var googlePayload = await GoogleJsonWebSignature.ValidateAsync(tokenId, settings);

            // Check if the email exists in the database
            var staff = _context.Staffs.FirstOrDefault(s => s.Email == googlePayload.Email);
            if (staff == null)
            {
                // Reject login attempt for unauthorized access
                return Unauthorized("Unauthorized access. Email not registered.");
            }

            // Generate JWT token for the valid staff  
            var token = GenerateJwtToken(staff);
            return Ok(new { Staff = staff, AccessToken = token });
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Internal Server Error");
        }
    }
    [HttpGet("customers"), Authorize]
    public IActionResult GetAllCustomers()
    {
        var customers = _context.Customers
            .Select(c => new
            {
                c.Id,
                c.Username,
                c.Email,
                c.PhoneNumber,
                c.Points,
                c.Tier
            })
            .ToList();

        if (!customers.Any())
        {
            return NotFound("No customers found.");
        }

        return Ok(customers);
    }
    [HttpGet("auth"), Authorize]
    public IActionResult AuthenticateStaff()
    {
        var staffIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(staffIdClaim, out var staffId))
        {
            return Unauthorized("Invalid token.");
        }

        var staff = _context.Staffs.FirstOrDefault(s => s.Id == staffId);

        if (staff == null)
        {
            return NotFound("Staff not found.");
        }

        return Ok(new
        {
            Message = "Authentication successful",
            Staff = new { staff.Id, staff.Username, staff.Email, staff.Role }
        });
    }
    [HttpDelete("customers/{id}"), Authorize]
    public IActionResult DeleteStaff(int id)
    {
        var customer = _context.Customers.FirstOrDefault(s => s.Id == id);

        if (customer == null)
        {
            return NotFound("Staff not found.");
        }

        // Optionally, you can check if the logged-in staff has the necessary role to delete other staff.
        var loggedInStaffId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value);
        var loggedInStaff = _context.Staffs.FirstOrDefault(s => s.Id == loggedInStaffId);

        if (loggedInStaff?.Role != "standard" & loggedInStaff?.Role != "Admin")  // You can replace "Admin" with the actual role
        {
            return Unauthorized("You do not have permission to delete this staff member.");
        }

        _context.Customers.Remove(customer);
        _context.SaveChanges();

        return Ok(new { message = "Staff member deleted successfully." });
    }

}