using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class OrderItem
    {
        [Key]
        public int OrderItemId { get; set; }

        [Required]
        public int OrderId { get; set; }  // Foreign key to Order

        public Order Order { get; set; }  // Navigation property to Order

        [Required]
        public int ProductId { get; set; }  // Foreign key to Product

        public Product Product { get; set; }  // Navigation property to Product

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Price { get; set; }  // Price of the product at the time of the order

        [Required]
        public int Quantity { get; set; }  // Quantity of the product ordered

        [Required]
        [Range(5, 12, ErrorMessage = "Shoe size must be between 5 and 12.")]
        public int ShoeSize { get; set; }  // ✅ New field to store selected shoe size
    }
}
