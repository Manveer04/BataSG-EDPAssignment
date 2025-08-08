using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class ApproveDeliveryAgentRequest
    {
        [Required]
        public bool Approved { get; set; }
    }
}

