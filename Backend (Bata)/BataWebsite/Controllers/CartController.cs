using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CartController : ControllerBase
    {
        private readonly MyDbContext _context;

        public CartController(MyDbContext context)
        {
            _context = context;
        }

        [HttpGet, Authorize]
        public IActionResult GetCustomerCart()
        {
            int customerId = GetCustomerId();

            var cart = _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .SingleOrDefault(c => c.CustomerId == customerId);

            if (cart == null)
            {
                return NotFound("No cart found for the customer.");
            }

            var data = new
            {
                cart.CartId,
                cart.CustomerId,
                CartItems = cart.CartItems.Select(ci => new
                {
                    ci.CartItemId,
                    ci.ProductId,
                    ci.Product.Name,
                    ci.Quantity
                })
            };

            return Ok(data);
        }

        [HttpPost, Authorize]
        public IActionResult CreateCart()
        {
            int customerId = GetCustomerId();

            if (_context.Carts.Any(c => c.CustomerId == customerId))
            {
                return Conflict("A cart already exists for this customer.");
            }

            var newCart = new Cart
            {
                CustomerId = customerId
            };

            _context.Carts.Add(newCart);
            _context.SaveChanges();

            return Ok(newCart);
        }


        [HttpPut("clear"), Authorize]
        public IActionResult ClearCart()
        {
            int customerId = GetCustomerId();

            var cart = _context.Carts
                .Include(c => c.CartItems)
                .SingleOrDefault(c => c.CustomerId == customerId);

            if (cart == null)
            {
                return NotFound("Cart not found for the customer.");
            }

            _context.CartItems.RemoveRange(cart.CartItems);
            _context.SaveChanges();

            return Ok("Cart cleared.");
        }

        private int GetCustomerId()
        {
            // Assuming the logged-in customer has a Claim of type "NameIdentifier" for CustomerId
            return Convert.ToInt32(User.Claims
                .Where(c => c.Type == ClaimTypes.NameIdentifier)
                .Select(c => c.Value).SingleOrDefault());
        }
    }
}
