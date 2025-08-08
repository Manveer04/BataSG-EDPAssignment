using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class Reward
    {
        public int Id { get; set; }

        [Required, MinLength(3), MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, MinLength(3), MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Points Needed must be greater than 0.")]
        public int PointsNeeded { get; set; }

        [Required]
        [RegularExpression("Bronze|Silver|Gold", ErrorMessage = "Tier Required must be either 'Bronze', 'Silver', or 'Gold'.")]
        public string TierRequired { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ImageFile { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        // Foreign key property
        public int CustomerId { get; set; }

        // Navigation property to represent the one-to-many relationship
        public Customer? Customer { get; set; }
    }
}
