using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class AssignOrderRequestDelivery
    {
        [Required]
        public int DeliveryId { get; set; }
    }
}

