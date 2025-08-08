using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class ApproveFulfilmentStaffRequest
    {
        [Required]
        public bool Approved { get; set; }
    }
}

