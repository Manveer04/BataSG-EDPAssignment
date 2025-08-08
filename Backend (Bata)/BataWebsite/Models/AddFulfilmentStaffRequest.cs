using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class AddFulfilmentStaffRequest
    {
        [Required, MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string AssignedArea { get; set; } = string.Empty;

        [Required]
        public int userId { get; set; }

        [Required]
        public int WarehouseId { get; set; }

        [Required]
        public int StaffId { get; set; }

        [Required]
        public int OrderId { get; set; }
    }
}

