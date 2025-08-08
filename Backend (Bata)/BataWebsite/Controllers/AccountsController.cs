using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using BataWebsite;
using BataWebsite.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using System.Text.Json;
using Microsoft.AspNetCore.Identity.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using OtpNet;
using QRCoder;
using System.Web;
using System.IO;
using System.Net.Mail;
using System.Security.Cryptography;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly MyDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserController> _logger;

    public UserController(MyDbContext context, IConfiguration configuration, ILogger<UserController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    private string GenerateJwtToken(Customer user)
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
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role) // ✅ Add the role claim
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] Customer newUser)
    {
        if (string.IsNullOrWhiteSpace(newUser.Username) ||
            string.IsNullOrWhiteSpace(newUser.Email) ||
            string.IsNullOrWhiteSpace(newUser.Password) ||
            string.IsNullOrWhiteSpace(newUser.PhoneNumber))
        {
            return BadRequest("Username, email, password and phone number are required.");
        }

        newUser.Email = newUser.Email.Trim().ToLower();

        if (_context.Customers.Any(u => u.Email == newUser.Email))
        {
            return Conflict("This email is already registered");
        }

        newUser.Password = BCrypt.Net.BCrypt.HashPassword(newUser.Password.Trim());
        newUser.Username = newUser.Username.Trim();
        newUser.PhoneNumber = newUser.PhoneNumber.Trim();

        _context.Customers.Add(newUser);
        _context.SaveChanges();

        return Ok(new { message = "Registration successful", userId = newUser.Id });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] Customer loginUser)
    {
        Console.WriteLine($"Login attempt for {loginUser.Email}");
        if (string.IsNullOrWhiteSpace(loginUser.Email) || string.IsNullOrWhiteSpace(loginUser.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Email == loginUser.Email.Trim().ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginUser.Password.Trim(), user.Password))
        {
            return Unauthorized("Invalid email or password.");
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            Message = "Login successful",
            User = new { user },
            AccessToken = token
        });
    }

    [HttpGet("profile"), Authorize]
    public IActionResult GetProfile()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"Token claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}"))}");

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers
            .Include(c => c.Addresses) // This includes the Addresses
            .FirstOrDefault(u => u.Id == userId);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        // Create a simple view model or anonymous object to return, avoiding circular references
        var userProfile = new
        {
            user.Id,
            user.Username,
            user.Email,
            user.PhoneNumber,
            user.Points,
            user.Tier,
            user.Is2FAEnabled,
            Address = user.Addresses?.Any() == true ? "View Addresses" : "Not set"
        };

        Console.WriteLine($"User: {JsonConvert.SerializeObject(userProfile)}");

        return Ok(userProfile);
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

            // Log the ClientId being used
            var clientId = _configuration["Authentication:Google:ClientId"];
            Console.WriteLine($"Google ClientId from config: {clientId}");

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { clientId }
            };

            // Log the settings being passed to the validation
            Console.WriteLine($"Google login settings - Audience: {string.Join(", ", settings.Audience)}");

            var googlePayload = await GoogleJsonWebSignature.ValidateAsync(tokenId, settings);

            // Log the Google payload
            Console.WriteLine($"Google payload: {googlePayload}");

            // Process Google payload
            var user = _context.Customers.FirstOrDefault(u => u.Email == googlePayload.Email);
            if (user == null)
            {
                return Ok(new { Message = "User does not exist, please set a password.", Email = googlePayload.Email, Username = googlePayload.Name });
            }

            var token = GenerateJwtToken(user);
            return Ok(new { User = user, accessToken = token });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Google login error: {ex}");
            return StatusCode(500, "Internal Server Error");
        }
    }

    [HttpPost("set-password")]
    public IActionResult SetPassword([FromBody] Customer request)
    {
        var user = _context.Customers.FirstOrDefault(u => u.Email == request.Email);
        if (user != null)
        {
            return Conflict("This email is already registered.");
        }

        user = new Customer
        {
            Email = request.Email,
            Username = request.Username,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _context.Customers.Add(user);
        _context.SaveChanges();
        var token = GenerateJwtToken(user);

        return Ok(new { Message = "Account created successfully.", User = user, accessToken = token });
    }

    [HttpPut("update-profile"), Authorize]
    public IActionResult UpdateProfile([FromBody] Customer updatedUser)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        // Update the user's information
        user.Username = updatedUser.Username.Trim();
        user.PhoneNumber = updatedUser.PhoneNumber; // Ensure the property exists in your model
        _context.SaveChanges();

        return Ok(new { message = "Profile updated successfully." });
    }
    [HttpGet("addresses/{id}"), Authorize]
    public IActionResult GetAddressById(int id)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var address = _context.Addresses.FirstOrDefault(a => a.Id == id && a.CustomerId == userId);
        if (address == null)
        {
            return NotFound("Address not found or does not belong to the user.");
        }

        return Ok(address);
    }
    [HttpGet("addresses"), Authorize]
    public IActionResult GetAddresses()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var addresses = _context.Addresses.Where(a => a.CustomerId == userId).ToList();

        return Ok(addresses);
    }

    [HttpPost("addresses"), Authorize]
    public IActionResult AddAddress([FromBody] Address newAddress)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return BadRequest(new { message = "Invalid model state.", errors });
        }


        Console.WriteLine($"Received Address: {JsonConvert.SerializeObject(newAddress)}");

        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        newAddress.CustomerId = userId;
        _context.Addresses.Add(newAddress);
        _context.SaveChanges();

        return Ok(new { message = "Address added successfully.", address = newAddress });
    }
    [HttpGet("auth"), Authorize]
    public IActionResult AuthenticateUser()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        return Ok(new
        {
            Message = "Authentication successful",
            User = new { user }
        });
    }
    [HttpPut("addresses/{addressId}"), Authorize]
    public IActionResult EditAddress(int addressId, [FromBody] Address updatedAddress)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return BadRequest(new { message = "Invalid model state.", errors });
        }

        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var existingAddress = _context.Addresses.FirstOrDefault(a => a.Id == addressId && a.CustomerId == userId);
        if (existingAddress == null)
        {
            return NotFound("Address not found or does not belong to the current user.");
        }

        // Update the address fields
        existingAddress.Name = updatedAddress.Name;
        existingAddress.UnitNo = updatedAddress.UnitNo;
        existingAddress.Street = updatedAddress.Street;
        existingAddress.PostalCode = updatedAddress.PostalCode;

        _context.SaveChanges();

        return Ok(new { message = "Address updated successfully.", address = existingAddress });
    }
    [HttpDelete("addresses/{id}"), Authorize]
    public IActionResult DeleteAddress(int id)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var address = _context.Addresses.FirstOrDefault(a => a.Id == id && a.CustomerId == userId);
        if (address == null)
        {
            return NotFound("Address not found or does not belong to the user.");
        }

        _context.Addresses.Remove(address);
        _context.SaveChanges();

        return Ok("Address deleted successfully.");
    }
    [HttpDelete("delete"), Authorize]
    public IActionResult DeleteAccount()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        _context.Customers.Remove(user);
        _context.SaveChanges();

        return Ok(new { message = "Account deleted successfully." });
    }

    [HttpPut("update"), Authorize]
    public IActionResult Update([FromBody] UpdateUserRequest request)
    {
        try
        {
            // Validate the request model
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get the user ID from the JWT token
            var customerId = Convert.ToInt32(User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value);

            // Find the user in the database
            var customer = _context.Customers.FirstOrDefault(x => x.Id == customerId);
            if (customer == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Update user details
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                customer.Username = request.Name.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                // Check if email already exists
                var existingUser = _context.Customers.FirstOrDefault(x => x.Email == request.Email);
                if (existingUser != null && existingUser.Id != customerId)
                {
                    return BadRequest(new { message = "Email already exists." });
                }
                customer.Email = request.Email.Trim().ToLower();
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                customer.Password = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
            }

            // Update Points if provided
            if (request.Points.HasValue)
            {
                customer.Points = request.Points.Value;
            }

            // Update Tier if provided
            if (!string.IsNullOrWhiteSpace(request.Tier))
            {
                customer.Tier = request.Tier.Trim();
            }

            //user.UpdatedAt = DateTime.Now;

            // Save changes to the database
            _context.Customers.Update(customer);
            _context.SaveChanges();

            return Ok(new { message = "User details updated successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error when updating user details");
            return StatusCode(500, new { message = "Internal server error." });
        }
    }
    [HttpPost("enable-2fa"), Authorize]
    public IActionResult EnableTwoFactorAuthentication()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (user.Is2FAEnabled)
        {
            return BadRequest("Two-factor authentication is already enabled.");
        }

        // Generate Base32 secret key
        var secretKey = KeyGeneration.GenerateRandomKey(20);
        var secretBase32 = Base32Encoding.ToString(secretKey);
        user.TwoFactorSecret = secretBase32;
        _context.SaveChanges();

        // Generate OTP Auth URL (Google Authenticator-compatible)
        string otpAuthUrl = $"otpauth://totp/{HttpUtility.UrlEncode("MyApp")}:{HttpUtility.UrlEncode(user.Email)}?secret={secretBase32}&issuer={HttpUtility.UrlEncode("MyApp")}";

        // Generate QR Code
        using var qrCodeGenerator = new QRCodeGenerator();
        using var qrCodeData = qrCodeGenerator.CreateQrCode(otpAuthUrl, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        string qrCodeBase64 = Convert.ToBase64String(qrCode.GetGraphic(20));

        return Ok(new
        {
            SecretKey = secretBase32,
            QrCodeImage = $"data:image/png;base64,{qrCodeBase64}"
        });
    }

    [HttpPost("verify-2fa"), Authorize]
    public IActionResult VerifyTwoFactor([FromBody] OtpVerificationRequest request)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return BadRequest("Two-factor authentication is not enabled.");
        }

        var secretKey = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(secretKey);

        bool isValid = totp.VerifyTotp(request.Code, out _, new VerificationWindow(1, 1));

        if (!isValid)
        {
            return Unauthorized("Invalid or expired OTP.");
        }

        user.Is2FAEnabled = true; // Enable 2FA after successful verification
        _context.SaveChanges();

        return Ok(new { Message = "Two-factor authentication enabled successfully." });
    }

    [HttpPost("verify-otp"), Authorize]
    public IActionResult VerifyAuthenticator([FromBody] VerifyOtpRequest request)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return BadRequest("2FA is not enabled for this user.");
        }

        // Check if user is locked out
        if (user.OtpFailedAttempts >= 3 && user.OtpLockoutEnd > DateTime.UtcNow)
        {
            return Unauthorized("Too many failed attempts. Try again in 1 minute.");
        }
        if (user.OtpFailedAttempts >= 3 && user.OtpLockoutEnd < DateTime.UtcNow)
        {
            user.OtpFailedAttempts = 0;
        }


        var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
        bool isValidOtp = totp.VerifyTotp(request.Otp, out long timeWindowUsed, VerificationWindow.RfcSpecifiedNetworkDelay);

        if (!isValidOtp)
        {
            user.OtpFailedAttempts++; // Increase failed attempt count
            // Lock user out if failed 3 times
            if (user.OtpFailedAttempts >= 3)
            {
                user.OtpLockoutEnd = DateTime.UtcNow.AddMinutes(1); // Lock for 1 minute
            }
            _context.SaveChanges(); // Save to database
            return Unauthorized("Invalid OTP. You have " + (3 - user.OtpFailedAttempts) + " tries left.");
        }
        // Reset failed attempts on success
        user.OtpFailedAttempts = 0;
        user.OtpLockoutEnd = null;
        _context.SaveChanges();

        return Ok(new { message = "OTP verification successful." });
    }

    public class VerifyOtpRequest
    {
        public string Otp { get; set; }
    }

[HttpPost("disable-2fa"), Authorize]
    public IActionResult DisableTwoFactor([FromBody] OtpVerificationRequest request)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }
        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }
        if (string.IsNullOrEmpty(user.TwoFactorSecret) || !user.Is2FAEnabled)
        {
            return BadRequest("Two-factor authentication is already disabled.");
        }
        var secretKey = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(secretKey);
        bool isValid = totp.VerifyTotp(request.Code, out _, new VerificationWindow(1, 1));
        if (!isValid)
        {
            return Unauthorized("Invalid or expired OTP.");
        }
        // Disable 2FA
        user.Is2FAEnabled = false;
        user.TwoFactorSecret = null; // Optional: Clear the secret
        _context.SaveChanges();
        return Ok(new { Message = "Two-factor authentication disabled successfully." });
    }

    [HttpPut("change-password")]
    [Authorize]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid token.");
        }

        var user = _context.Customers.FirstOrDefault(u => u.Id == userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        // Verify the current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
        {
            return Unauthorized("Current password is incorrect.");
        }

        // Validate new password (add your password validation logic here)
        if (request.NewPassword.Length < 8)
        {
            return BadRequest("New password must be at least 6 characters long.");
        }

        // Hash the new password
        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        // Save changes to the database
        _context.SaveChanges();

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = _context.Customers.FirstOrDefault(u => u.Email == request.Email);
        if (user == null)
        {
            return NotFound("User with this email not found.");
        }
        // Generate reset token
        user.PasswordResetToken = GenerateToken();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        _context.SaveChanges();
        // Send reset email
        string resetLink = $"http://localhost:3000/reset-password?token={user.PasswordResetToken}";
        return Ok(new
        {
            resetLink = resetLink,
            email = request.Email
        });
        //SendEmail(user.Email, "Password Reset Request", $"Click here to reset your password: {resetLink}");
        //return Ok(new { message = "Password reset link sent to your email." });
    }
    private string GenerateToken()
    {
        using (var rng = new RNGCryptoServiceProvider())
        {
            byte[] tokenData = new byte[32];
            rng.GetBytes(tokenData);
            return Convert.ToBase64String(tokenData);
        }
    }
    private void SendEmail(string to, string subject, string body)
    {
        try
        {
            var mail = new MailMessage();
            mail.From = new MailAddress("batabrotherjohn@gmail.com"); // Use your email
            mail.To.Add(to);
            mail.Subject = subject;
            mail.Body = body;
            mail.IsBodyHtml = true;
            var smtp = new SmtpClient("smtp.gmail.com")
            {
                Port = 587,
                Credentials = new System.Net.NetworkCredential("batabrotherjohn@gmail.com", "axbq fqmq swkm uwwh"),
                EnableSsl = true
            };
            smtp.Send(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error sending email: " + ex.Message);
        }
    }

    [HttpPost("reset-password")]
    public IActionResult ResetPassword([FromBody] PasswordRequest request)
    {
        // URL decode the token
        var decodedToken = HttpUtility.UrlDecode(request.Token).Replace(" ", "+").Trim();
        Console.WriteLine(request.Token);
        Console.WriteLine("HI");
        Console.WriteLine(decodedToken);
        try
        {
            // Retrieve user based on the decoded token
            var user = _context.Customers.FirstOrDefault(u => u.PasswordResetToken == decodedToken);
            // Check if user exists and if token has expired
            if (user == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest("Invalid or expired token.");
            }
            // Hash new password
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            _context.SaveChanges();
            return Ok(new { message = "Password reset successfully." });
        }
        catch (FormatException)
        {
            // Handle invalid base64 format
            return BadRequest("Invalid token format.");
        }
    }
}
