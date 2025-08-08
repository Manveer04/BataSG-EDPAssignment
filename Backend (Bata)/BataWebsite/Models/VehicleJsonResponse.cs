using System.Text.Json.Serialization;

namespace BataWebsite.Models
{
    public class VehicleJsonResponse
    {
        public string Description { get; set; }
        public string RegistrationYear { get; set; }
        public CarMakeInfo CarMake { get; set; }
        public CarModelInfo CarModel { get; set; }
        public TextValue MakeDescription { get; set; }
        public TextValue ModelDescription { get; set; }
        public string TaxExpiry { get; set; }
        public string ImageUrl { get; set; }
        public FuelTypeInfo FuelType { get; set; }
    }

    public class TextValue
    {
        [JsonPropertyName("CurrentTextValue")]
        public string CurrentTextValue { get; set; }
    }

    public class CarMakeInfo : TextValue { }
    public class CarModelInfo : TextValue { }
    public class FuelTypeInfo : TextValue { }

}
