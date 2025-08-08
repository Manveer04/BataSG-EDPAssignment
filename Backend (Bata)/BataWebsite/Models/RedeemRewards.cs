using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BataWebsite.Models
{
    public class RedeemedReward
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100, ErrorMessage = "Reward name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "datetime")]
        public DateTime RedeemedAt { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Points used must be greater than 0.")]
        public int PointsUsed { get; set; }

        [MaxLength(20)]
        public string? ImageFile { get; set; }

        public bool IsGifted { get; set; } = false;

        // Foreign key property to User
        [Required]
        public int CustomerId { get; set; }  // Foreign key pointing to the User model

        // Navigation property to represent the one-to-many relationship
        [JsonIgnore]  // Prevents circular reference when serializing to JSON
        public Customer? Customer { get; set; }  // Navigation property to User model

    }
}
