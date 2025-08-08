using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class AddFulfilmentStaffRequestwithAdmin
    {
        [Required, MaxLength(50)]
        public string JobRoleApplied { get; set; }
        [Required, MaxLength(100)]
        public string FullName { get; set; }
        [Required, MaxLength(100)]
        public string Password { get; set; }
        [MaxLength(100)]
        public string Email { get; set; }
        [Required, MaxLength(12)]
        public string NRIC { get; set; }
        [Required, MaxLength(15)]
        public string ContactNumber { get; set; }
        [MaxLength(50)]
        public string AssignedArea { get; set; }
        [MaxLength(100)]
        public string Warehouse { get; set; }
        [MaxLength(255)]
        public string ResumeFileName { get; set; }
        public IFormFile ResumeFile { get; set; }
    }

}
