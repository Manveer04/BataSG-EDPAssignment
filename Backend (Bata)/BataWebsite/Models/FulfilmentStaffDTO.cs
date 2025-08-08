namespace BataWebsite.Models
{
    public class FulfilmentStaffDTO
    {
        public int FulfilStaffId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string AssignedArea { get; set; } = string.Empty;
        public int? WarehouseId { get; set; }
        public int StaffId { get; set; }
        public int? OrderId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PhoneNo { get; set; }
        public string Role { get; set; }
    }

}
