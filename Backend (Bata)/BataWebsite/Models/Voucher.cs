using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class Voucher
    {
        [Key]
        public int VoucherId { get; set; }

        [Required]
        [MinLength(5, ErrorMessage = "Code must be at least 5 characters long.")]
        [MaxLength(30, ErrorMessage = "Code cannot exceed 30 characters.")]
        [Column(TypeName = "varchar(30)")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Range(1, 100, ErrorMessage = "Discount percentage must be between 1 and 100.")]
        public int DiscountPercentage { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        public bool IsActive { get; set; } = true; // Default to active

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Max usage must be at least 1.")]
        public int MaxUsage { get; set; } // Maximum number of times the voucher can be used

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Usage count cannot be negative.")]
        public int UsageCount { get; set; } = 0; // Default to 0

        // New fields for tracking staff who created/last updated the voucher
        [Required]
        public int CreatedByStaffId { get; set; }  // Staff ID who created the voucher
        public int? LastUpdatedByStaffId { get; set; }  // Staff ID who last updated the voucher (nullable)
    }
}
