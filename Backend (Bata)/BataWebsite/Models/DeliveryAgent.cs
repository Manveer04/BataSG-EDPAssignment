using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class DeliveryAgent
    {
        [Key]
        public int AgentId { get; set; }

        [MaxLength(50)]
        public string VehicleNumber { get; set; } = string.Empty;

        public bool AvailabilityStatus { get; set; }

        [MaxLength(50)]
        public string VehicleType { get; set; } = string.Empty;

        public int StaffId { get; set; }
        public int DeliveryId { get; set; }

        // Navigation properties
        //public StaffUser? StaffUser { get; set; }
        public Delivery? Delivery { get; set; }

        // Change OrderId to a list to accept multiple values
        public List<int> OrderIds { get; set; } = new List<int>();
    }
}
