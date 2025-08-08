using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class Cart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        // Navigation property for 1-to-1 relationship
        [ForeignKey(nameof(CustomerId))]
        public Customer Customers { get; set; }

        // Navigation property for 1-to-many relationship
        public List<CartItem> CartItems { get; set; } = new List<CartItem>();
    }
}
