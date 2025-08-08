using System.Text.Json.Serialization;

namespace BataWebsite.Models
{
    public class Address
    {
        public int Id { get; set; } // Primary key
        public string Name { get; set; } = string.Empty;
        public string UnitNo { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;

        // Foreign key to associate this address with a customer
        public int CustomerId { get; set; }
        [JsonIgnore]
        public Customer? Customer { get; set; } = null!;
    }
}
