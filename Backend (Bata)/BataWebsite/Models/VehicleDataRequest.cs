namespace BataWebsite.Models
{
    public class VehicleDataRequest
    {
        public string Description { get; set; }
        public string RegistrationYear { get; set; }
        public string MakeDescription { get; set; }
        public string ModelDescription { get; set; }
        public string FuelType { get; set; }

        public string TaxExpiry { get; set; }
        public string ImageUrl { get; set; }
        // Add other fields as needed (e.g., EngineSize, Transmission)
    }
}
