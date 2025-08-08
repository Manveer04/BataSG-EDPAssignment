using BataWebsite.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

public class Product
{
    // Primary Key
    public int ProductId { get; set; }

    // Name of the product
    public string Name { get; set; }

    // Description of the product
    [Required, MinLength(3), MaxLength(500)]
    public string Description { get; set; }

    [Required]
    [Range(0.01, 99999.99, ErrorMessage = "Price must be between 0.01 and 99999.99.")]
    public decimal Price { get; set; }

    [Required]
    [MaxLength(20)]
    public string? Image { get; set; }

    [Required]
    [MaxLength(20)]
    public string? ImageFile2 { get; set; }

    [Required]
    [MaxLength(20)]
    public string? ImageFile3 { get; set; }

    [MaxLength(50)]
    public string? ThreeJsFile { get; set; } // Stores the filename of the 3.js file

    [Required]
    [MaxLength(50)]
    public string Color { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "Amount Sold must be a non-negative number.")]
    public int AmtSold { get; set; } = 0;

    [Range(0, int.MaxValue, ErrorMessage = "Views must be a non-negative number.")]
    public int Views { get; set; } = 0;

    [Column(TypeName = "datetime")]
    public DateTime CreatedAt { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime UpdatedAt { get; set; }

    // Foreign key property
    public int CategoryId { get; set; }

    // Navigation property to represent the one-to-many relationship
    [JsonIgnore]
    public ProductCategory? Category { get; set; }

}









//using System.ComponentModel.DataAnnotations;
//using System.ComponentModel.DataAnnotations.Schema;

//namespace BataWebsite.Models
//{
//    public class Product
//    {
//        public int ProductId { get; set; }

//        [Required]
//        [MinLength(3)]
//        [MaxLength(50)]
//        public string Name { get; set; } = string.Empty;

//        [Required]
//        [MinLength(10)]
//        [MaxLength(300)]
//        public string Description { get; set; } = string.Empty;

//        [Required]
//        [MaxLength(30)]
//        public string Image { get; set; } = string.Empty;

//        [Required]
//        [Column(TypeName = "decimal(18, 2)")]
//        public decimal Price { get; set; }


//        [Required]
//        [MaxLength(50)]
//        public string Color { get; set; } = string.Empty;

//        [Required]
//        [MaxLength(10)]
//        public string Size { get; set; } = string.Empty;

//        [Required]
//        public int Stock { get; set; }

//        public int AmtSold { get; set; }


//        // Navigation property for 1-to-1 relationship
//        public CartItem? CartItem { get; set; } // Nullable navigation property
//    }
//}
