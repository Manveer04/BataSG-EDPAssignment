using AutoMapper;
using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RewardController(MyDbContext context, IMapper mapper,
        ILogger<RewardController> logger) : ControllerBase
    {
        private readonly MyDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly ILogger<RewardController> _logger = logger;

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<RewardDTO>), StatusCodes.Status200OK)]
        public IActionResult GetAll(string? search)
        {
            try
            {
                IQueryable<Reward> result = _context.Rewards.Include(r => r.Customer); // Changed User -> Customer
                if (search != null)
                {
                    result = result.Where(x => x.Name.Contains(search)
                        || x.Description.Contains(search));
                }
                var list = result.OrderByDescending(x => x.CreatedAt).ToList();
                IEnumerable<RewardDTO> data = list.Select(_mapper.Map<RewardDTO>);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting all rewards");
                return StatusCode(500);
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(RewardDTO), StatusCodes.Status200OK)]
        public IActionResult GetReward(int id)
        {
            try
            {
                Reward? reward = _context.Rewards.Include(r => r.Customer) // Changed User -> Customer
                    .SingleOrDefault(r => r.Id == id);
                if (reward == null)
                {
                    return NotFound();
                }
                RewardDTO data = _mapper.Map<RewardDTO>(reward);
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting reward by id");
                return StatusCode(500);
            }
        }

        [HttpPost, Authorize]
        [ProducesResponseType(typeof(RewardDTO), StatusCodes.Status200OK)]
        public IActionResult AddReward(AddRewardRequest reward)
        {
            try
            {
                int customerId = GetCustomerId(); // Changed User -> Customer
                var now = DateTime.Now;
                var myReward = new Reward()
                {
                    Name = reward.Name.Trim(),
                    Description = reward.Description.Trim(),
                    PointsNeeded = reward.PointsNeeded,
                    TierRequired = reward.TierRequired,
                    ImageFile = reward.ImageFile,
                    CreatedAt = now,
                    UpdatedAt = now,
                    CustomerId = customerId // Changed UserId -> CustomerId
                };

                _context.Rewards.Add(myReward);
                _context.SaveChanges();

                Reward? newReward = _context.Rewards.Include(r => r.Customer) // Changed User -> Customer
                    .FirstOrDefault(r => r.Id == myReward.Id);
                RewardDTO rewardDTO = _mapper.Map<RewardDTO>(newReward);
                return Ok(rewardDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when adding reward");
                return StatusCode(500);
            }
        }

        [HttpPut("{id}"), Authorize]
        public IActionResult UpdateReward(int id, UpdateRewardRequest reward)
        {
            try
            {
                var myReward = _context.Rewards.Find(id);
                if (myReward == null)
                {
                    return NotFound();
                }

                if (reward.Name != null)
                {
                    myReward.Name = reward.Name.Trim();
                }
                if (reward.Description != null)
                {
                    myReward.Description = reward.Description.Trim();
                }
                if (reward.PointsNeeded.HasValue)
                {
                    myReward.PointsNeeded = reward.PointsNeeded.Value;
                }
                if (reward.TierRequired != null)
                {
                    myReward.TierRequired = reward.TierRequired;
                }

                // Handle ImageFile update
                if (reward.ImageFile != null)
                {
                    myReward.ImageFile = reward.ImageFile;
                }
                else if (reward.ImageFile == null && myReward.ImageFile != null)
                {
                    myReward.ImageFile = null;
                }

                myReward.UpdatedAt = DateTime.Now;

                _context.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when updating reward");
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}"), Authorize]
        public IActionResult DeleteReward(int id)
        {
            try
            {
                var myReward = _context.Rewards.Find(id);
                if (myReward == null)
                {
                    return NotFound();
                }

                _context.Rewards.Remove(myReward);
                _context.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when deleting reward");
                return StatusCode(500);
            }
        }

        private int GetCustomerId() // Changed method name from GetUserId to GetCustomerId
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
