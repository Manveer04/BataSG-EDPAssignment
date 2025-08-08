using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class UpdateUserRequest
    {
        [MinLength(3), MaxLength(100)]
        public string? Name { get; set; }

        [EmailAddress]
        [MaxLength(100)]
        public string? Email { get; set; }

        [MinLength(6), MaxLength(100)]
        public string? Password { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Points must be a non-negative number.")]
        public int? Points { get; set; }

        [RegularExpression("Bronze|Silver|Gold", ErrorMessage = "Tier must be either 'Bronze', 'Silver', or 'Gold'.")]
        public string? Tier { get; set; }
    }
}
