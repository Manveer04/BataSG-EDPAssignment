namespace BataWebsite.Models
{
    public class AddressDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string UnitNo { get; set; }
        public string Street { get; set; }
        public string PostalCode { get; set; }
        public string FullAddress { get; set; } // Concatenated full address
    }


}
