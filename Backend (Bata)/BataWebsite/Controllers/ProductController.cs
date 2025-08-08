

//using BataWebsite.Models;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;

//namespace BataWebsite.Controllers
//{
//    [ApiController]
//    [Route("[controller]")]
//    public class ProductController(MyDbContext context) : ControllerBase
//    {
//        private readonly MyDbContext _context = context;

//        [HttpGet]
//        public IActionResult GetAllProducts(string? search)
//        {
//            IQueryable<Product> result = _context.Set<Product>();
//            if (!string.IsNullOrEmpty(search))
//            {
//                result = result.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
//            }

//            var list = result.OrderByDescending(p => p.ProductId).ToList();
//            var data = list.Select(p => new
//            {
//                p.ProductId,
//                p.Name,
//                p.Description,
//                p.Image,
//                p.Price,
//                p.Stock,
//                p.AmtSold,
//                p.Color,
//                p.Size
//            });

//            return Ok(data);
//        }

//        [HttpGet("{id}")]
//        public IActionResult GetProduct(int id)
//        {
//            var product = _context.Set<Product>().SingleOrDefault(p => p.ProductId == id);

//            if (product == null)
//            {
//                return NotFound();
//            }

//            var data = new
//            {
//                product.ProductId,
//                product.Name,
//                product.Description,
//                product.Image,
//                product.Price,
//                product.Stock,
//                product.AmtSold,
//                product.Color,
//                product.Size
//            };

//            return Ok(data);
//        }

//        [HttpPost, Authorize]
//        public IActionResult CreateProduct(Product product)
//        {
//            if (!ModelState.IsValid)
//            {
//                return BadRequest(ModelState);
//            }

//            // Create a new Product object
//            var newProduct = new Product
//            {
//                Name = product.Name.Trim(),
//                Description = product.Description.Trim(),
//                Image = product.Image.Trim(),
//                Price = product.Price,
//                Stock = product.Stock,
//                AmtSold = product.AmtSold,
//                Color = product.Color.Trim(),
//                Size = product.Size.Trim()
//            };

//            _context.Set<Product>().Add(newProduct);
//            _context.SaveChanges();

//            // Return the created product as a response
//            var data = new
//            {
//                newProduct.ProductId,
//                newProduct.Name,
//                newProduct.Description,
//                newProduct.Image,
//                newProduct.Price,
//                newProduct.Stock,
//                newProduct.AmtSold,
//                newProduct.Color,
//                newProduct.Size
//            };

//            return Ok(data);
//        }

//        [HttpPut("{id}"), Authorize]
//        public IActionResult UpdateProduct(int id, Product product)
//        {
//            // Find the existing product by ID
//            var existingProduct = _context.Set<Product>().Find(id);
//            if (existingProduct == null)
//            {
//                return NotFound();
//            }

//            existingProduct.Name = product.Name.Trim();
//            existingProduct.Description = product.Description.Trim();
//            existingProduct.Image = product.Image.Trim();
//            existingProduct.Price = product.Price;
//            existingProduct.Stock = product.Stock;
//            existingProduct.AmtSold = product.AmtSold;
//            existingProduct.Color = product.Color.Trim();
//            existingProduct.Size = product.Size.Trim();

//            // Save changes to the database
//            _context.SaveChanges();

//            // Return a structured response
//            var data = new
//            {
//                existingProduct.ProductId,
//                existingProduct.Name,
//                existingProduct.Description,
//                existingProduct.Image,
//                existingProduct.Price,
//                existingProduct.Stock,
//                existingProduct.AmtSold,
//                existingProduct.Color,
//                existingProduct.Size
//            };

//            return Ok(data);
//        }

//        [HttpDelete("{id}"), Authorize]
//        public IActionResult DeleteProduct(int id)
//        {
//            // Find the product by ID
//            var product = _context.Set<Product>().Find(id);
//            if (product == null)
//            {
//                return NotFound();
//            }

//            _context.Set<Product>().Remove(product);
//            _context.SaveChanges();

//            return Ok();
//        }

//        private bool ProductExists(int id)
//        {
//            return _context.Set<Product>().Any(e => e.ProductId == id);
//        }
//    }
//}
