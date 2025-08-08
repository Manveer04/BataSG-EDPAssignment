namespace BataWebsite.Models
{
    public class RewardDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int PointsNeeded { get; set; }

        public string TierRequired { get; set; } = string.Empty;

        public string? ImageFile { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public int CustomerId { get; set; }

        public Customer? Customer { get; set; }
    }
}
