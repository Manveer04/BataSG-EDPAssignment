using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public enum PaymentStatus
    {
        Pending,
        Succeeded,
        Failed,
    }

    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public PaymentStatus PaymentStatus { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Amount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string CardNumber { get; set; }

        [Required]
        public string ExpiryDate { get; set; }

        [Required]
        public string CVV { get; set; }
    }
}
