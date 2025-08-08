using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
public class Stock
{
    public int Id { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size5 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size6 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size7 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size8 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size9 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size10 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size11 { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int Size12 { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime CreatedAt { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime UpdatedAt { get; set; }

    // Foreign key property to link stock to product
    public int ProductId { get; set; }

    // Navigation property to Product
    [JsonIgnore]
    public Product? Product { get; set; }
}
