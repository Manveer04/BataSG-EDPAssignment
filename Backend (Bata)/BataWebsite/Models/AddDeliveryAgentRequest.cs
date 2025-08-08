using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

public class AddDeliveryAgentRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string NRIC { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; } = 0;


    [Required]
    public string ContactNumber { get; set; } = string.Empty;

    [Required]
    public string VehicleNumber { get; set; } = string.Empty;

    [Required]
    public string VehicleType { get; set; } = string.Empty;

    [Required]
    public bool AvailabilityStatus { get; set; } = true;

    [Required]
    public string PostalCode { get; set; } = string.Empty;

    [Required]
    public string VehicleOwnership { get; set; } = "self";

    public string? OwnerFullName { get; set; }

    public IFormFile? DriverLicenseFile { get; set; }
    public IFormFile? VrcFile { get; set; }
}
