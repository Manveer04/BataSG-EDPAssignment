using BataWebsite.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CategoryController(MyDbContext context) : ControllerBase
    {
        private readonly MyDbContext _context = context;

        [HttpGet]
        public IActionResult GetAll(string? search)
        {
            IQueryable<ProductCategory> result = _context.Category;
            if (search != null)
            {
                result = result.Where(x => x.Category.Contains(search));
            }
            var list = result.OrderByDescending(x => x.CreatedAt).ToList();
            return Ok(list);
        }
        [HttpPost]
        public IActionResult AddCategory(ProductCategory category)
        {
            var now = DateTime.Now;
            var myCategory = new ProductCategory()
            {
                Category = category.Category.Trim(),
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Category.Add(myCategory);
            _context.SaveChanges();
            return Ok(myCategory);
        }
        [HttpGet("{id}")]
        public IActionResult GetCategory(int id)
        {
            ProductCategory? category = _context.Category.Find(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }
        [HttpPut("{id}")]
        public IActionResult UpdateCategory(int id, ProductCategory category)
        {
            var myCategory = _context.Category.Find(id);
            if (myCategory == null)
            {
                return NotFound();
            }
            myCategory.Category = category.Category.Trim();
            myCategory.UpdatedAt = DateTime.Now;
            _context.SaveChanges();
            return Ok();
        }
        [HttpDelete("{id}")]
        public IActionResult DeleteCategory(int id)
        {
            var myCategory = _context.Category.Find(id);
            if (myCategory == null)
            {
                return NotFound();
            }
            _context.Category.Remove(myCategory);
            _context.SaveChanges();
            return Ok();
        }
    }
}
