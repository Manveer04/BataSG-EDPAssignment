using BataWebsite.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Xml.Linq;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProductController(MyDbContext context) : ControllerBase
    {
        private readonly MyDbContext _context = context;

        [HttpGet]
        public IActionResult GetAll(string? search)
        {
            IQueryable<Product> result = _context.Products;
            if (search != null)
            {
                result = result.Where(x => x.Name.Contains(search)
                || x.Description.Contains(search));
            }
            var list = result.OrderByDescending(x => x.CreatedAt).ToList();
            return Ok(list);
        }
        [HttpPost]
        public IActionResult AddProduct(Product product)
        {
            var now = DateTime.Now;
            try
            {
                Console.WriteLine("Received AddProduct request with data: ");

                // Check if the CategoryId exists
                var category = _context.Category.FirstOrDefault(c => c.Id == product.CategoryId);
                if (category == null)
                {
                    Console.WriteLine($"Error: Category with Id {product.CategoryId} does not exist.");
                    return BadRequest($"Category with Id {product.CategoryId} does not exist.");
                }

                // Validate Image File Name Length
                if ((product.Image?.Length ?? 0) > 20 || (product.ImageFile2?.Length ?? 0) > 20 || (product.ImageFile3?.Length ?? 0) > 20)
                {
                    Console.WriteLine("Error: One of the image file names exceeds 20 characters.");
                    return BadRequest("Image file names must not exceed 20 characters.");
                }

                // Create the product object
                var myProduct = new Product()
                {
                    Name = product.Name?.Trim(),
                    Description = product.Description?.Trim(),
                    Price = product.Price,
                    CategoryId = product.CategoryId,
                    Image = product.Image,
                    ImageFile2 = product.ImageFile2,
                    ImageFile3 = product.ImageFile3,
                    ThreeJsFile = product.ThreeJsFile, // Added Three.js file field
                    Color = product.Color.Trim(),
                    AmtSold = 0,
                    Views = 0,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                // Save the product to the database
                _context.Products.Add(myProduct);
                int saved = _context.SaveChanges();
                Console.WriteLine($"Product save result: {saved}");

                // Create the stock entry for the product
                var myStock = new Stock()
                {
                    ProductId = myProduct.ProductId,  // Associate stock with product
                    Size5 = 0,
                    Size6 = 0,
                    Size7 = 0,
                    Size8 = 0,
                    Size9 = 0,
                    Size10 = 0,
                    Size11 = 0,
                    Size12 = 0,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.Stocks.Add(myStock);
                saved = _context.SaveChanges();
                Console.WriteLine($"Stock save result: {saved}");

                return Ok(myProduct);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception occurred in AddProduct: " + ex.Message);
                Console.WriteLine("Stack Trace: " + ex.StackTrace);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpGet("{id}")]
        public IActionResult GetProduct(int id)
        {
            var productWithCategory = _context.Products
                .Include(p => p.Category)  // Ensure there's a navigation property named Category in your Product model
                .FirstOrDefault(p => p.ProductId == id);

            if (productWithCategory == null)
            {
                return NotFound();
            }

            return Ok(productWithCategory);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateProduct(int id, Product product)
        {
            var myProduct = _context.Products.Find(id);
            if (myProduct == null)
            {
                return NotFound();
            }
            myProduct.Name = product.Name.Trim();
            myProduct.Description = product.Description.Trim();
            myProduct.Price = product.Price;
            myProduct.CategoryId = product.CategoryId;
            myProduct.Image = product.Image;
            myProduct.ImageFile2 = product.ImageFile2;
            myProduct.ImageFile3 = product.ImageFile3;
            myProduct.ThreeJsFile = product.ThreeJsFile; // Added Three.js file update
            myProduct.Color = product.Color.Trim();
            myProduct.UpdatedAt = DateTime.Now;
            _context.SaveChanges();
            return Ok();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTutorial(int id)
        {
            var myProduct = _context.Products.Find(id);
            if (myProduct == null)
            {
                return NotFound();
            }
            _context.Products.Remove(myProduct);
            _context.SaveChanges();
            return Ok();
        }
    }
}
