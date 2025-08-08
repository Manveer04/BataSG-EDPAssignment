using System.ComponentModel.DataAnnotations;

namespace BataWebsite.Models
{
    public class JobApplicant
    {
        [Key]
        public int ApplicantId { get; set; }

        [Required]
        public int UserId { get; set; } // ✅ Associate applicant with a user

        [Required, MaxLength(50)]
        public string JobRoleApplied { get; set; } // ✅ "FulfilmentStaff" or "DeliveryAgent"

        [Required, MaxLength(100)]
        public string FullName { get; set; }

        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(12)]
        public string NRIC { get; set; }

        [Required, MaxLength(15)]
        public string ContactNumber { get; set; }

        // ✅ Fields specific to Fulfilment Staff
        [MaxLength(50)]
        public string? PreferredAssignedArea { get; set; } // ✅ Only for Fulfilment Staff

        [MaxLength(100)]
        public string? PreferredWarehouse { get; set; } // ✅ Only for Fulfilment Staff

        [MaxLength(255)]
        public string? ResumeFileName { get; set; } // ✅ Resume Upload (Fulfilment Staff)

        // ✅ Fields specific to Delivery Agent
        [MaxLength(50)]
        public string? VehicleNumber { get; set; } // ✅ Vehicle Number

        [MaxLength(50)]
        public string? VehicleType { get; set; } // ✅ "Motorcycle", "Car", "Van"

        public bool? AvailabilityStatus { get; set; } // ✅ Available = true, Unavailable = false

        [MaxLength(6)]
        public string? PostalCode { get; set; } // ✅ Store Delivery Agent’s Postal Code

        [MaxLength(20)]
        public string? VehicleOwnership { get; set; } // ✅ "self" or "someoneElse"

        [MaxLength(100)]
        public string? OwnerFullName { get; set; } // ✅ If "someoneElse", store owner’s name

        [MaxLength(255)]
        public string? DriverLicenseFileName { get; set; } // ✅ Store Driver’s License file path

        [MaxLength(255)]
        public string? VehicleRegistrationCertificate { get; set; } // ✅ Store VRC file path

        // ✅ Status Tracking
        [Required, MaxLength(20)]
        public string Status { get; set; } = "Pending"; // ✅ "Pending", "Approved", "Rejected"
    }
}
