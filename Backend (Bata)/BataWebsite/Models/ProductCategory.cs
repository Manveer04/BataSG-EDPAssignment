using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public class ProductCategory
    {
        public int Id { get; set; }

        [Required, MinLength(3), MaxLength(20)]
        public string Category { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

    }

}
