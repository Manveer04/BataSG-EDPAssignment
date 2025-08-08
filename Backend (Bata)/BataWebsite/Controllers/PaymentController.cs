using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly MyDbContext _context;

        public PaymentController(MyDbContext context)
        {
            _context = context;
        }

        // Create a payment for an order
        [HttpPost("process-payment"), Authorize]
        public async Task<IActionResult> ProcessPayment([FromBody] Payment newPayment)
        {
            // Validate payment fields
            var validationErrors = ValidatePayment(newPayment);
            if (validationErrors.Any())
            {
                return BadRequest(new { errors = validationErrors });
            }

            // Set the payment status to "Succeeded"
            newPayment.PaymentStatus = PaymentStatus.Succeeded;

            // Save the payment
            _context.Payments.Add(newPayment);
            await _context.SaveChangesAsync();

            // Return the PaymentId
            return Ok(new { PaymentId = newPayment.PaymentId });
        }



        private List<string> ValidatePayment(Payment newPayment)
        {
            var errors = new List<string>();

            // Validate Card Number (Only digits and 16 digits)
            if (string.IsNullOrEmpty(newPayment.CardNumber) || !Regex.IsMatch(newPayment.CardNumber, @"^\d{16}$"))
            {
                errors.Add("Card number must be 16 digits.");
            }

            // Validate Expiry Date (MM/YY format and check if the date is in the future)
            if (string.IsNullOrEmpty(newPayment.ExpiryDate) || !Regex.IsMatch(newPayment.ExpiryDate, @"^\d{2}/\d{2}$"))
            {
                errors.Add("Expiry date must be in MM/YY format.");
            }
            else
            {
                var today = DateTime.UtcNow;
                var expiryParts = newPayment.ExpiryDate.Split('/');
                var month = int.Parse(expiryParts[0]);
                var year = int.Parse(expiryParts[1]);
                var expiryDate = new DateTime(2000 + year, month, 1);

                if (expiryDate < today)
                {
                    errors.Add("Expiry date cannot be in the past.");
                }
            }

            // Validate CVV (Only digits and exactly 3 digits)
            if (string.IsNullOrEmpty(newPayment.CVV) || !Regex.IsMatch(newPayment.CVV, @"^\d{3}$"))
            {
                errors.Add("CVV must be 3 digits.");
            }

            return errors;
        }

        // Helper method to get customer ID from JWT token
        private int GetCustomerId()
        {
            // Assuming the logged-in customer has a Claim of type "NameIdentifier" for CustomerId
            return Convert.ToInt32(User.Claims
                .Where(c => c.Type == ClaimTypes.NameIdentifier)
                .Select(c => c.Value).SingleOrDefault());
        }
    }
}
