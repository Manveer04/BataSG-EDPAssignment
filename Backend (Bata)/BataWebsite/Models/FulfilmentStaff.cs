using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class FulfilmentStaff
    {
        [Key]
        public int FulfilStaffId { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(50)]
        public string AssignedArea { get; set; } = string.Empty;

        public int? WarehouseId { get; set; }
        public int StaffId { get; set; }
        public int? OrderId { get; set; }

        public int AssignedOrdersCount { get; set; } = 0; // New property
        public bool OnBreak { get; set; } = false; // New property

        // Navigation properties
        public Warehouse? Warehouse { get; set; }
        //public StaffUser? StaffUser { get; set; }
        public Order? Order { get; set; }

        [ForeignKey("StaffId")]
        public Staff Staff { get; set; } // ✅ Navigation Property for EF Core
    }
}
