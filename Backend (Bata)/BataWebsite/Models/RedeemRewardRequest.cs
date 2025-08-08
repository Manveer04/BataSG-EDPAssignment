using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class RedeemedRewardRequest
    {
        [Required]
        [MaxLength(100, ErrorMessage = "Reward name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200, ErrorMessage = "Description cannot exceed 200 characters.")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Points used must be greater than 0.")]
        public int PointsUsed { get; set; }

        public string? ImageFile { get; set; }

        public bool IsGifted { get; set; } = false;
    }
}
