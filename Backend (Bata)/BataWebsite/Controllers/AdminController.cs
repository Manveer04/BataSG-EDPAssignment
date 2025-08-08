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
public class AdminController : ControllerBase
{
    private readonly MyDbContext _context;
    private readonly IConfiguration _configuration;

    public AdminController(MyDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private string GenerateJwtToken(Admin admin)
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
                new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
                new Claim(ClaimTypes.Name, admin.Username),
                new Claim(ClaimTypes.Email, admin.Email),
                new Claim(ClaimTypes.Role, admin.Role)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] Admin newAdmin)
    {
        if (string.IsNullOrWhiteSpace(newAdmin.Username) ||
            string.IsNullOrWhiteSpace(newAdmin.Email) ||
            string.IsNullOrWhiteSpace(newAdmin.Password) ||
            string.IsNullOrWhiteSpace(newAdmin.PhoneNumber))
        {
            return BadRequest("Username, email, password and phone number are required.");
        }
        if (!Regex.IsMatch(newAdmin.PhoneNumber, @"^\d{8}$"))
        {
            return BadRequest("Invalid phone number. It must be 8 digits.");
        }
        newAdmin.Email = newAdmin.Email.Trim().ToLower();

        if (_context.Admins.Any(s => s.Email == newAdmin.Email))
        {
            return Conflict("This email is already registered.");
        }

        newAdmin.Password = BCrypt.Net.BCrypt.HashPassword(newAdmin.Password.Trim());
        newAdmin.Username = newAdmin.Username.Trim();

        _context.Admins.Add(newAdmin);
        _context.SaveChanges();

        return Ok(new { message = "Registration successful", staffId = newAdmin.Id });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] Admin loginAdmin)
    {
        if (string.IsNullOrWhiteSpace(loginAdmin.Email) || string.IsNullOrWhiteSpace(loginAdmin.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var admin = _context.Admins.FirstOrDefault(a => a.Email == loginAdmin.Email.Trim().ToLower());
        if (admin == null || !BCrypt.Net.BCrypt.Verify(loginAdmin.Password.Trim(), admin.Password))
        {
            return Unauthorized("Invalid email or password.");
        }

        var token = GenerateJwtToken(admin);

        return Ok(new
        {
            Message = "Login successful",
            Admin = new { admin.Id, admin.Username, admin.Email, admin.Role },
            AccessToken = token
        });
    }

    [HttpGet("profile"), Authorize]
    public IActionResult GetProfile()
    {
        var adminIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized("Invalid token.");
        }

        var admin = _context.Admins.FirstOrDefault(a => a.Id == adminId);

        if (admin == null)
        {
            return NotFound("Admin not found.");
        }

        var adminProfile = new
        {
            admin.Username,
            admin.Email,
            admin.PhoneNumber
        };

        return Ok(adminProfile);
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
            var admin = _context.Admins.FirstOrDefault(s => s.Email == googlePayload.Email);
            if (admin == null)
            {
                // Reject login attempt for unauthorized access
                return Unauthorized("Unauthorized access. Email not registered.");
            }

            // Generate JWT token for the valid staff  
            var token = GenerateJwtToken(admin);
            return Ok(new { Admin = admin, AccessToken = token });
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
    public IActionResult AuthenticateAdmin()
    {
        var adminIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(adminIdClaim, out var adminId))
        {
            return Unauthorized("Invalid token.");
        }

        var admin = _context.Admins.FirstOrDefault(a => a.Id == adminId);

        if (admin == null)
        {
            return NotFound("Admin not found.");
        }

        return Ok(new
        {
            Message = "Authentication successful",
            Admin = new { admin.Id, admin.Username, admin.Email, admin.Role }
        });
    }
    [HttpDelete("customers/{id}"), Authorize]
    public IActionResult DeleteCustomer(int id)
    {
        var customer = _context.Customers.FirstOrDefault(s => s.Id == id);

        if (customer == null)
        {
            return NotFound("Customer not found.");
        }

        // Optionally, you can check if the logged-in staff has the necessary role to delete other staff.
        var loggedInStaffId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value);
        var loggedInStaff = _context.Admins.FirstOrDefault(s => s.Id == loggedInStaffId);
        Console.WriteLine(loggedInStaff);
        if (loggedInStaff?.Role != "Admin")  // You can replace "Admin" with the actual role
        {
            return Unauthorized("You do not have permission to delete this staff member.");
        }

        _context.Customers.Remove(customer);
        _context.SaveChanges();

        return Ok(new { message = "Customer member deleted successfully." });
    }
    [HttpGet("staffs"), Authorize]
    public IActionResult GetAllStaff()
    {
        var staffs = _context.Staffs
            .Select(c => new
            {
                c.Id,
                c.Username,
                c.Email,
                c.PhoneNumber,
            })
            .ToList();
        if (!staffs.Any())
        {
            return NotFound("No staffs found.");
        }
        return Ok(staffs);
    }
    [HttpDelete("staffs/{id}"), Authorize]
    public IActionResult DeleteStaff(int id)
    {
        var staff = _context.Staffs.FirstOrDefault(s => s.Id == id);

        if (staff == null)
        {
            return NotFound("staffnot found.");
        }
        // Optionally, you can check if the logged-in staff has the necessary role to delete other staff.
        var loggedInStaffId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value);
        var loggedInStaff = _context.Admins.FirstOrDefault(s => s.Id == loggedInStaffId);
        Console.WriteLine(loggedInStaff);
        if (loggedInStaff?.Role != "Admin")  // You can replace "Admin" with the actual role
        {
            return Unauthorized("You do not have permission to delete this staff member.");
        }
        _context.Staffs.Remove(staff);
        _context.SaveChanges();
        return Ok(new { message = "Staff member deleted successfully." });
    }
}