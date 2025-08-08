using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class DeliveryRoute
    {
        [Key]
        public int RouteId { get; set; }

        [MaxLength(100)]
        public string RouteStart { get; set; } = string.Empty;

        [MaxLength(100)]
        public string RouteEnd { get; set; } = string.Empty;

        public double RouteDistance { get; set; }
        public TimeSpan RouteDuration { get; set; }

        [MaxLength(50)]
        public string RoutePriority { get; set; } = string.Empty;

        public int WarehouseId { get; set; }
        public int AgentId { get; set; }

        // Navigation properties
        public Warehouse? Warehouse { get; set; }
        public DeliveryAgent? DeliveryAgent { get; set; }
    }
}
