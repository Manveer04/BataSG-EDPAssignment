using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class RedeemedRewardDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int PointsUsed { get; set; }

        public DateTime RedeemedAt { get; set; }

        public string ImageFile { get; set; } = string.Empty;

        public int CustomerId { get; set; }

        public bool IsGifted { get; set; }

        // Use the UserBasicDTO to represent user details
        public Customer? Customer { get; set; }
    }
}
