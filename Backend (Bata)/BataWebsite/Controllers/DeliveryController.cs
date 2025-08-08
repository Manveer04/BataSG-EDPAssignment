using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DeliveryController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<DeliveryController> _logger;

        public DeliveryController(MyDbContext context, ILogger<DeliveryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignDeliveryAgent(int orderId, int agentId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound("Order not found");
            }

            var agent = await _context.DeliveryAgents.FindAsync(agentId);
            if (agent == null)
            {
                return NotFound("Delivery Agent not found");
            }

            var delivery = new Delivery
            {
                OrderId = orderId,
                DeliveryAgentId = agentId,
                EstimatedDeliveryDate = DateTime.UtcNow.AddDays(2),
                Status = DeliveryStatus.Pending,
                TrackingId = Guid.NewGuid().ToString()
            };

            await _context.Deliveries.AddAsync(delivery);
            await _context.SaveChangesAsync();

            return Ok(delivery);
        }

        [HttpPut("update-status/{id}")]
        [Authorize(Roles = "DeliveryAgent,Admin")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, DeliveryStatus status)
        {
            var delivery = await _context.Deliveries.FindAsync(id);
            if (delivery == null)
            {
                return NotFound("Delivery not found");
            }

            delivery.Status = status;
            if (status == DeliveryStatus.Delivered)
            {
                delivery.ActualDeliveryDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(delivery);
        }

        [HttpGet("track/{orderId}")]
        public async Task<IActionResult> TrackDelivery(int orderId)
        {
            var delivery = await _context.Deliveries
                .Where(d => d.OrderId == orderId)
                .FirstOrDefaultAsync();

            if (delivery == null)
            {
                return NotFound("Delivery not found");
            }

            return Ok(delivery);
        }
    }
}
