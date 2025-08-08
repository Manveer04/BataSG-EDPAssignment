using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DeliveryPerformanceController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<DeliveryPerformanceController> _logger;

        public DeliveryPerformanceController(MyDbContext context, ILogger<DeliveryPerformanceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPut("order/{orderId}/deliver"), Authorize(Roles = "DeliveryAgent")]
        public async Task<IActionResult> DeliverOrder(int orderId)
        {
            try
            {
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return NotFound();
                }

                if (order.OrderStatus != OrderStatus.Shipped)
                {
                    return BadRequest("Order must be Out for Delivery to be marked as Delivered.");
                }

                order.OrderStatus = OrderStatus.Delivered;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Order {orderId} status updated to Delivered.");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when delivering order");
                return StatusCode(500);
            }
        }

        [HttpGet("agent/{agentId}/summary")]
        [Authorize(Roles = "Admin,DeliveryAgent")]
        public async Task<IActionResult> GetDeliveryPerformance(int agentId)
        {
            var completedDeliveries = await _context.Deliveries
                .Where(d => d.DeliveryAgentId == agentId && d.Status == DeliveryStatus.Delivered)
                .CountAsync();

            var totalDeliveries = await _context.Deliveries
                .Where(d => d.DeliveryAgentId == agentId)
                .CountAsync();

            var onTimeDeliveries = await _context.Deliveries
                .Where(d => d.DeliveryAgentId == agentId && d.Status == DeliveryStatus.Delivered && d.ActualDeliveryDate <= d.EstimatedDeliveryDate)
                .CountAsync();

            var onTimePercentage = totalDeliveries > 0 ? (onTimeDeliveries * 100.0 / totalDeliveries) : 0;

            return Ok(new
            {
                AgentId = agentId,
                CompletedDeliveries = completedDeliveries,
                TotalDeliveries = totalDeliveries,
                OnTimePercentage = onTimePercentage
            });
        }

        
    }
}
