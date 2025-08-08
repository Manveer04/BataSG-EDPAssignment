using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public enum DeliveryStatus
    {
        Pending,
        OutForDelivery,
        Delivered,
        Failed
    }

    public class Delivery
    {
        [Key]
        public int DeliveryId { get; set; }

        [Required]
        [ForeignKey("Order")]
        public int OrderId { get; set; }

        [Required]
        public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;

        [Required]
        public DateTime EstimatedDeliveryDate { get; set; }

        public DateTime? ActualDeliveryDate { get; set; }

        [MaxLength(255)]
        public string TrackingId { get; set; } = string.Empty;

        [Required]
        public int DeliveryAgentId { get; set; }

        [MaxLength(255)]
        public string ProofOfDelivery { get; set; } = string.Empty; // Store photo path or signature info

        // Navigation properties
        public DeliveryAgent DeliveryAgent { get; set; }
        public Order Order { get; set; }
    }
}
