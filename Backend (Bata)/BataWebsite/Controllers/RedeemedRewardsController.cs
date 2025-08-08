using AutoMapper;
using BataWebsite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RedeemedRewardController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<RedeemedRewardController> _logger;

        public RedeemedRewardController(MyDbContext context, IMapper mapper, ILogger<RedeemedRewardController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        // Get all redeemed rewards (with optional search)
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<RedeemedRewardDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                var query = _context.RedeemedRewards.Include(r => r.Customer).AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(x => x.Name.Contains(search) || x.Description.Contains(search));
                }

                var redeemedRewards = await query.OrderByDescending(x => x.RedeemedAt).ToListAsync();

                // Adjust RedeemedAt to GMT+8
                foreach (var redeemedReward in redeemedRewards)
                {
                    redeemedReward.RedeemedAt = redeemedReward.RedeemedAt.AddHours(8); // Adjust to GMT+8
                }

                var data = redeemedRewards.Select(_mapper.Map<RedeemedRewardDTO>);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting all redeemed rewards.");
                return StatusCode(500, "Internal server error.");
            }
        }

        // Get a redeemed reward by ID
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(RedeemedRewardDTO), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRedeemedReward(int id)
        {
            try
            {
                var redeemedReward = await _context.RedeemedRewards
                    .Include(r => r.Customer)
                    .SingleOrDefaultAsync(r => r.Id == id);

                if (redeemedReward == null)
                {
                    _logger.LogWarning("Redeemed reward with ID {Id} not found.", id);
                    return NotFound("Redeemed reward not found.");
                }

                var data = _mapper.Map<RedeemedRewardDTO>(redeemedReward);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting redeemed reward by ID.");
                return StatusCode(500, "Internal server error.");
            }
        }

        // Redeem a reward
        [HttpPost]
        [ProducesResponseType(typeof(RedeemedRewardDTO), StatusCodes.Status201Created)]
        public async Task<IActionResult> RedeemReward([FromBody] RedeemedRewardRequest request)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid RedeemedRewardRequest model.");
                return BadRequest(ModelState);
            }

            try
            {
                // Get the customer ID from claims
                var customerIdFromClaims = GetCustomerId();

                // Fetch the customer from the database
                var customer = await _context.Customers.SingleOrDefaultAsync(c => c.Id == customerIdFromClaims);
                if (customer == null)
                {
                    _logger.LogWarning("Customer with ID {CustomerId} not found.", customerIdFromClaims);
                    return NotFound("Customer not found.");
                }

                // Validate points
                if (customer.Points < request.PointsUsed)
                {
                    _logger.LogWarning("Customer {CustomerId} has insufficient points to redeem reward.", customerIdFromClaims);
                    return BadRequest("Insufficient points.");
                }

                // Deduct points and update customer
                using var transaction = await _context.Database.BeginTransactionAsync();

                customer.Points -= request.PointsUsed;
                _context.Customers.Update(customer);

                // Create the redeemed reward
                var redeemedReward = new RedeemedReward
                {
                    Name = request.Name,
                    Description = request.Description,
                    PointsUsed = request.PointsUsed,
                    ImageFile = request.ImageFile,
                    CustomerId = customerIdFromClaims, // Ensure the foreign key is CustomerId
                    RedeemedAt = DateTime.UtcNow,
                    IsGifted = request.IsGifted
                };

                _context.RedeemedRewards.Add(redeemedReward);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Map to DTO and return response
                var redeemedRewardDTO = _mapper.Map<RedeemedRewardDTO>(redeemedReward);
                _logger.LogInformation("Reward redeemed successfully by Customer {CustomerId}.", customerIdFromClaims);
                return CreatedAtAction(nameof(GetRedeemedReward), new { id = redeemedReward.Id }, redeemedRewardDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error redeeming reward.");
                return StatusCode(500, "Internal server error.");
            }
        }

        [HttpPost("{id}/gift")]
        public async Task<IActionResult> GiftReward(int id, [FromBody] GiftRewardRequest request)
        {
            // Decode the recipient's username to handle any URL-encoded characters like spaces (%20)
            string decodedUsername = Uri.UnescapeDataString(request.RecipientUsername);

            // Find the recipient customer by username
            var recipientCustomer = await _context.Customers
                .Where(c => c.Username == decodedUsername)
                .FirstOrDefaultAsync();

            if (recipientCustomer == null)
            {
                return NotFound("Recipient username doesn't exist.");
            }

            // Get the reward based on the reward ID
            var reward = await _context.Rewards.FindAsync(id);
            if (reward == null)
            {
                return NotFound("Reward not found.");
            }

            // Create a redeemed reward entry for the recipient
            var redeemedRewardForRecipient = new RedeemedReward
            {
                Name = reward.Name,
                Description = reward.Description,
                RedeemedAt = DateTime.Now,
                PointsUsed = reward.PointsNeeded,
                CustomerId = recipientCustomer.Id, // Link to recipient's CustomerId
                ImageFile = reward.ImageFile,
                IsGifted = true
            };

            // Add the redeemed reward for the recipient to the database
            _context.RedeemedRewards.Add(redeemedRewardForRecipient);

            // Adjust RedeemedAt to GMT+8
            redeemedRewardForRecipient.RedeemedAt = DateTime.Now.AddHours(8);
            redeemedRewardForRecipient.RedeemedAt = redeemedRewardForRecipient.RedeemedAt.AddHours(8); // Adjust to GMT+8

            redeemedRewardForRecipient.RedeemedAt = DateTime.Now.AddHours(8); // Ensure the recipient's RedeemedAt is also adjusted

            // Optionally, deduct points from the recipient (if needed)
            recipientCustomer.Points -= reward.PointsNeeded;

            // Create a redeemed reward entry for the gifter (using OriginalCustomerId)
            var originalCustomer = await _context.Customers
                .Where(c => c.Id == request.OriginalCustomerId)  // Use OriginalCustomerId
                .FirstOrDefaultAsync();

            if (originalCustomer == null)
            {
                return NotFound("Original customer not found.");
            }

            var originalRedeemedReward = new RedeemedReward
            {
                Name = reward.Name,
                Description = reward.Description,
                RedeemedAt = DateTime.Now,
                PointsUsed = reward.PointsNeeded,
                CustomerId = originalCustomer.Id, // Gifter's customer ID
                ImageFile = reward.ImageFile
            };

            // Add the original redeemed reward for the gifting customer to the database
            _context.RedeemedRewards.Add(originalRedeemedReward);

            // Deduct points from the gifter (assuming gifter points should also be deducted)
            originalCustomer.Points -= reward.PointsNeeded;

            // Save all changes in one go
            await _context.SaveChangesAsync();

            return Ok("Reward successfully gifted!");
        }

        [HttpGet("check-username/{username}")]
        public async Task<IActionResult> CheckUsernameExists(string username)
        {
            // Decode the username to handle any URL-encoded characters like spaces (%20)
            string decodedUsername = Uri.UnescapeDataString(username);

            // Check if the username exists in the Customers table
            var customer = await _context.Customers
                .Where(c => c.Username == decodedUsername)
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new { message = "Username doesn't exist" });
            }

            return Ok(new { message = "Username exists", customerId = customer.Id });
        }

        // Helper to get customer ID from claims
        private int GetCustomerId()
        {
            var customerIdClaim = User.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (customerIdClaim == null)
            {
                throw new UnauthorizedAccessException("Customer ID not found in claims.");
            }

            return Convert.ToInt32(customerIdClaim);
        }
    }
}
