using System.Text.Json.Serialization;

namespace BataWebsite.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int Points { get; set; } = 0;
        public string Tier { get; set; } = "Bronze";
        public string Role { get; set; } = "customer";

        // Two-Factor Authentication Fields
        public bool Is2FAEnabled { get; set; } = false;  // Flag for whether 2FA is enabled
        public string? TwoFactorSecret { get; set; } // Secret key for 2FA
        public int OtpFailedAttempts { get; set; } = 0; // New column
        public DateTime? OtpLockoutEnd { get; set; } // New column
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Navigation property for related addresses
        [JsonIgnore]
        public ICollection<Address> Addresses { get; set; } = new List<Address>();

        // Navigation property for 1-to-1 relationship
        [JsonIgnore]
        public Cart? Cart { get; set; } // Nullable to avoid circular dependency issues during creation
        
        // Navigation property for customer's orders
        public ICollection<Order> Orders { get; set; } = new List<Order>(); // Link to orders placed by this customer
    }
}
