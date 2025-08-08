using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CartItemController : ControllerBase
    {
        private readonly MyDbContext _context;

        public CartItemController(MyDbContext context)
        {
            _context = context;
        }

        [HttpGet, Authorize]
        public IActionResult GetCartItems()
        {
            int customerId = GetCustomerId();

            var cart = _context.Carts
                .Include(c => c.CartItems) // Include cart items
                .SingleOrDefault(c => c.CustomerId == customerId);

            if (cart == null)
            {
                return NotFound("Cart not found for the customer.");
            }

            // Retrieve products explicitly and join with cart items
            var data = cart.CartItems.Select(ci => new
            {
                ci.CartItemId,
                ci.ProductId,
                ci.Quantity,
                ci.ShoeSize,  // ✅ Include ShoeSize
                Product = _context.Products
                    .Where(p => p.ProductId == ci.ProductId)
                    .Select(p => new
                    {
                        p.Name,
                        p.Price,
                        p.Image,
                        p.Color,
                    })
                    .FirstOrDefault() // Safely fetch product details
            });

            return Ok(data);
        }


        [HttpPost, Authorize]
        public IActionResult AddCartItem(CartItem cartItem)
        {
            int customerId = GetCustomerId();

            // Fetch the customer's cart
            var cart = _context.Carts.SingleOrDefault(c => c.CustomerId == customerId);
            if (cart == null)
            {
                return NotFound("Cart not found for the customer.");
            }

            // Check if the product exists
            var productExists = _context.Products.Any(p => p.ProductId == cartItem.ProductId);
            if (!productExists)
            {
                return NotFound("Product not found.");
            }

            // Ensure shoe size is valid
            if (cartItem.ShoeSize < 5 || cartItem.ShoeSize > 12)
            {
                return BadRequest("Invalid shoe size. Size must be between 5 and 12.");
            }

            // Check if the same product with the same shoe size already exists in the cart
            var existingCartItem = _context.CartItems
                .SingleOrDefault(ci => ci.CartId == cart.CartId
                    && ci.ProductId == cartItem.ProductId
                    && ci.ShoeSize == cartItem.ShoeSize);

            if (existingCartItem != null)
            {
                // Update the quantity if the item already exists
                existingCartItem.Quantity += cartItem.Quantity;
            }
            else
            {
                // Create a new cart item with the selected shoe size
                var newCartItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    ShoeSize = cartItem.ShoeSize // ✅ Store shoe size
                };

                _context.CartItems.Add(newCartItem);
            }

            _context.SaveChanges();

            return Ok("Item added to the cart.");
        }


        [HttpPut("{id}"), Authorize]
        public IActionResult UpdateCartItem(int id, [FromBody] CartItem updatedCartItem)
        {
            // Find the existing cart item by ID
            var existingCartItem = _context.CartItems.SingleOrDefault(ci => ci.CartItemId == id);

            if (existingCartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            if (updatedCartItem.Quantity < 1)
            {
                return BadRequest("Quantity must be at least 1.");
            }

            // Validate shoe size
            if (updatedCartItem.ShoeSize < 5 || updatedCartItem.ShoeSize > 12)
            {
                return BadRequest("Invalid shoe size. Size must be between 5 and 12.");
            }

            // Update the cart item
            existingCartItem.Quantity = updatedCartItem.Quantity;
            existingCartItem.ShoeSize = updatedCartItem.ShoeSize; // ✅ Allow shoe size update

            _context.SaveChanges();

            // Fetch the updated product details
            var product = _context.Products
                .Where(p => p.ProductId == existingCartItem.ProductId)
                .Select(p => new
                {
                    p.Name,
                    p.Price,
                    p.Image,
                    p.Color,
                })
                .FirstOrDefault();

            return Ok(new
            {
                existingCartItem.CartItemId,
                existingCartItem.Quantity,
                existingCartItem.ShoeSize, // ✅ Return updated shoe size
                Product = product
            });
        }


        [HttpDelete("{id}"), Authorize]
        public IActionResult DeleteCartItem(int id)
        {
            var cartItem = _context.CartItems.Find(id);

            if (cartItem == null)
            {
                return NotFound("Cart item not found.");
            }

            _context.CartItems.Remove(cartItem);
            _context.SaveChanges();

            return Ok("Cart item removed.");
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
