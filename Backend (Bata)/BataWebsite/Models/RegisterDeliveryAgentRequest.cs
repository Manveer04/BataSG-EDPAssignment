using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class RegisterDeliveryAgentRequest
    {
        [Required, MaxLength(50)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        public bool AvailabilityStatus { get; set; }

        [Required, MaxLength(50)]
        public string VehicleType { get; set; } = string.Empty;

        [Required]
        public int StaffId { get; set; }

        [Required]
        public int User { get; set; }

        [Required]
        public int DeliveryId { get; set; }
    }
}

