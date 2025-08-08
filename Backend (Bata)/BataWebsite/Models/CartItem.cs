using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class CartItem
    {
        public int CartItemId { get; set; }

        [Required]
        public int CartId { get; set; }

        public int ProductId { get; set; }

        public int Quantity { get; set; }

        [Required]
        [Range(5, 12, ErrorMessage = "Shoe size must be between 5 and 12.")]
        public int ShoeSize { get; set; }  // ✅ New column for selected shoe size

        // Navigation properties
        [ForeignKey(nameof(CartId))]
        public Cart? Cart { get; set; }

        public Product? Product { get; set; }
    }

}
