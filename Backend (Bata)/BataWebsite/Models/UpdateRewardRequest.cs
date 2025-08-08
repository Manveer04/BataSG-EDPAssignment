using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class UpdateRewardRequest
    {
        [MinLength(3), MaxLength(100)]
        public string? Name { get; set; }

        [MinLength(3), MaxLength(200)]
        public string? Description { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Points Needed must be greater than 0.")]
        public int? PointsNeeded { get; set; }

        [RegularExpression("Bronze|Silver|Gold", ErrorMessage = "Tier Required must be either 'Bronze', 'Silver', or 'Gold'.")]
        public string? TierRequired { get; set; }

        [MaxLength(20)]
        public string? ImageFile { get; set; }
    }
}
