namespace BataWebsite.Models
{
    public class DeliveryAgentDTO
    {
        public int AgentId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public bool AvailabilityStatus { get; set; }
        public string VehicleType { get; set; } = string.Empty;
        public int StaffId { get; set; }
        public int DeliveryId { get; set; }
    }
}
