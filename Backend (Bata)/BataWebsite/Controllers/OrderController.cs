using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.ComponentModel.DataAnnotations;
using System.Drawing.Printing;
using System.Drawing;
using BataWebsite.Services;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Document = iTextSharp.text.Document;
using Rectangle = iTextSharp.text.Rectangle;


namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly OrderAssignmentService _orderAssignmentService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(MyDbContext context, OrderAssignmentService orderAssignmentService, ILogger<OrderController> logger)
        {
            _context = context;
            _logger = logger;
            _orderAssignmentService = orderAssignmentService;
        }

        private List<string> ValidateOrder(Order newOrder)
        {
            var errors = new List<string>();

            // Validate OrderDate (Ensure it is provided)
            if (newOrder.OrderDate == default)
            {
                errors.Add("OrderDate is required.");
            }

            // Validate CustomerId (Ensure it's provided and valid)
            if (newOrder.CustomerId <= 0)
            {
                errors.Add("CustomerId is required and must be valid.");
            }

            // Validate OrderStatus (Ensure it is a valid status)
            if (!Enum.IsDefined(typeof(OrderStatus), newOrder.OrderStatus))
            {
                errors.Add("OrderStatus is invalid.");
            }

            // Validate Subtotal (Must be greater than zero)
            if (newOrder.Subtotal <= 0)
            {
                errors.Add("Subtotal must be greater than zero.");
            }

            // Validate TotalAmount (Must be greater than zero)
            if (newOrder.TotalAmount <= 0)
            {
                errors.Add("TotalAmount must be greater than zero.");
            }

            // Validate ShippingAddressId (If provided, it must refer to an existing address)
            if (newOrder.ShippingAddressId.HasValue)
            {
                var address = _context.Addresses.FirstOrDefault(a => a.Id == newOrder.ShippingAddressId.Value);
                if (address == null)
                {
                    errors.Add("Invalid shipping address.");
                }
            }

            // Validate ContactNumber (Only digits)
            if (string.IsNullOrEmpty(newOrder.ContactNumber) || !Regex.IsMatch(newOrder.ContactNumber, @"^\d+$"))
            {
                errors.Add("ContactNumber must contain only digits.");
            }

            // Validate Email (Ensure it is in a valid email format)
            if (string.IsNullOrEmpty(newOrder.Email) || !new EmailAddressAttribute().IsValid(newOrder.Email))
            {
                errors.Add("Email is required and must be a valid email address.");
            }

            // Validate PaymentId (Ensure it exists in the database)
            var payment = _context.Payments.FirstOrDefault(p => p.PaymentId == newOrder.PaymentId);
            if (payment == null)
            {
                errors.Add("Invalid PaymentId.");
            }

            // VoucherId is optional, but if provided, ensure it's valid
            if (newOrder.VoucherId.HasValue)
            {
                var voucher = _context.Vouchers.FirstOrDefault(v => v.VoucherId == newOrder.VoucherId.Value);
                if (voucher == null)
                {
                    errors.Add("Invalid VoucherId.");
                }
            }

            return errors;
        }


        [HttpPost, Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] Order newOrder)
        {
            var customerId = GetCustomerId();  // Retrieve customerId from JWT token

            // Ensure the customer exists
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
            {
                return BadRequest(new { field = "Customer", message = "Customer not found." });
            }

            // Assign customer info and order details
            newOrder.CustomerId = customerId;
            newOrder.OrderDate = DateTime.UtcNow.AddHours(8);  // Adjusts to Singapore Time (SGT)
            newOrder.Email = newOrder.Email;
            newOrder.ContactNumber = newOrder.ContactNumber;
            newOrder.OrderStatus = OrderStatus.Processing;

            // Validate required fields
            if (string.IsNullOrEmpty(newOrder.ContactNumber) || newOrder.Subtotal <= 0 || newOrder.TotalAmount <= 0)
            {
                return BadRequest(new { field = "Order", message = "Missing required fields." });
            }

            // Fetch cart items
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .SingleOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest(new { field = "Cart", message = "Cart is empty." });
            }

            // Create OrderItems from CartItems
            foreach (var cartItem in cart.CartItems)
            {
                var orderItem = new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    Quantity = cartItem.Quantity,
                    Price = cartItem.Product.Price, // Store the price at the time of order
                    ShoeSize = cartItem.ShoeSize, // ✅ Include shoe size
                    Order = newOrder  // Associate with the newly created order
                };

                _context.OrderItems.Add(orderItem);
            }

            // Add the order to the database
            _context.Orders.Add(newOrder);
            await _context.SaveChangesAsync();  // Save the new order and order items

            // Clear the cart
            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            var assignmentResult = await _orderAssignmentService.AssignOrder(newOrder.OrderId);
            if (!assignmentResult)
            {
                return BadRequest(new { field = "OrderAssignment", message = "Failed to assign order to fulfilment staff." });
            }


            return Ok(new
            {
                newOrder.OrderId,
                newOrder.OrderDate,
                newOrder.TotalAmount,
                newOrder.OrderStatus,
                newOrder.Email
            });
        }

        [HttpGet("GetOrdersByFulfilmentStaff/{staffId}")]
        public async Task<IActionResult> GetOrdersByFulfilmentStaff(int staffId)
        {
            _logger.LogInformation("GetOrdersByFulfilmentStaff called with staffId: {StaffId}", staffId);

            var fulfilmentStaff = await _context.FulfilmentStaffs
                .FirstOrDefaultAsync(fs => fs.StaffId == staffId);

            if (fulfilmentStaff == null)
            {
                _logger.LogWarning("No fulfilment staff found with staffId: {StaffId}", staffId);
                return NotFound("Fulfilment staff not found.");
            }

            _logger.LogInformation("Fulfilment staff found with FulfilStaffId: {FulfilStaffId}", fulfilmentStaff.FulfilStaffId);

            var orders = await _context.Orders
                .Where(o => o.FulfilmentStaffId == fulfilmentStaff.FulfilStaffId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product) // Ensure product details are loaded
                .ToListAsync();

            if (orders == null || !orders.Any())
            {
                _logger.LogWarning("No orders found for fulfilment staff with FulfilStaffId: {FulfilStaffId}", fulfilmentStaff.FulfilStaffId);
                return NotFound("No orders found for the given fulfilment staff ID.");
            }

            _logger.LogInformation("Orders found for fulfilment staff with FulfilStaffId: {FulfilStaffId}", fulfilmentStaff.FulfilStaffId);

            var orderDTOs = orders.Select(o => new OrderDTO
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                OrderStatus = o.OrderStatus,
                TotalAmount = o.TotalAmount,
                Email = o.Email,
                OrderItems = o.OrderItems.Select(oi => new OrderItemDTO
                {
                    OrderItemId = oi.OrderItemId,
                    ProductName = oi.Product.Name, // Retrieve the product name
                    Price = oi.Price,
                    Quantity = oi.Quantity
                }).ToList()
            }).ToList();

            return Ok(orderDTOs);
        }

        [HttpGet("unassigned-shipped-orders")]
        public async Task<IActionResult> GetUnassignedShippedOrders()
        {
            try
            {
                // Get all orders with status "Shipped"
                var shippedOrders = await _context.Orders
                    .Where(o => o.OrderStatus == OrderStatus.Shipped)
                    .Include(o => o.ShippingAddress) // Include ShippingAddress
                    .ToListAsync();

                // Get all delivery agents and their assigned order IDs
                var deliveryAgents = await _context.DeliveryAgents.ToListAsync();

                // Filter out orders that are already assigned to a delivery agent
                var unassignedShippedOrders = shippedOrders
                    .Where(order => !deliveryAgents.Any(da => da.OrderIds.Contains(order.OrderId)))
                    .ToList();

                if (!unassignedShippedOrders.Any())
                {
                    return Ok(new { message = "No unassigned shipped orders found." });
                }

                var orderDTOs = unassignedShippedOrders.Select(o => new OrderDTO
                {
                    OrderId = o.OrderId,
                    OrderDate = o.OrderDate,
                    OrderStatus = o.OrderStatus,
                    TotalAmount = o.TotalAmount,
                    Email = o.Email,
                    ShippingAddress = o.ShippingAddress != null ? new AddressDTO
                    {
                        Id = o.ShippingAddress.Id,
                        Name = o.ShippingAddress.Name,
                        UnitNo = o.ShippingAddress.UnitNo,
                        Street = o.ShippingAddress.Street,
                        PostalCode = o.ShippingAddress.PostalCode,
                        FullAddress = $"{o.ShippingAddress.Name}, {o.ShippingAddress.UnitNo}, {o.ShippingAddress.Street}, {o.ShippingAddress.PostalCode}"
                    } : null,
                    OrderItems = o.OrderItems.Select(oi => new OrderItemDTO
                    {
                        OrderItemId = oi.OrderItemId,
                        ProductName = oi.Product.Name, // Retrieve the product name
                        Price = oi.Price,
                        Quantity = oi.Quantity
                    }).ToList()
                }).ToList();

                return Ok(orderDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when getting unassigned shipped orders: {ExceptionMessage}", ex.Message);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }





        [HttpGet("GetOrdersByDeliveryAgent/{staffId}")]
        public async Task<IActionResult> GetOrdersByDeliveryAgent(int staffId)
        {
            _logger.LogInformation("GetOrdersByDeliveryAgent called with staffId: {StaffId}", staffId);

            var deliveryAgent = await _context.DeliveryAgents
                .FirstOrDefaultAsync(da => da.StaffId == staffId);

            if (deliveryAgent == null)
            {
                _logger.LogWarning("No delivery agent found with staffId: {StaffId}", staffId);
                return NotFound("Delivery agent not found.");
            }

            _logger.LogInformation("Delivery agent found with AgentId: {AgentId}", deliveryAgent.AgentId);

            var orders = await _context.Orders
                .Where(o => deliveryAgent.OrderIds.Contains(o.OrderId))
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product) // Ensure product details are loaded
                .Include(o => o.ShippingAddress) // Include ShippingAddress
                .ToListAsync();

            if (orders == null || !orders.Any())
            {
                _logger.LogWarning("No orders found for delivery agent with AgentId: {AgentId}", deliveryAgent.AgentId);
                return Ok(new { message = "No Orders with Agent" });
            }

            _logger.LogInformation("Orders found for delivery agent with AgentId: {AgentId}", deliveryAgent.AgentId);

            var orderDTOs = orders.Select(o => new OrderDTO
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                OrderStatus = o.OrderStatus,
                TotalAmount = o.TotalAmount,
                Email = o.Email,
                ShippingAddress = o.ShippingAddress != null ? new AddressDTO
                {
                    Id = o.ShippingAddress.Id,
                    Name = o.ShippingAddress.Name,
                    UnitNo = o.ShippingAddress.UnitNo,
                    Street = o.ShippingAddress.Street,
                    PostalCode = o.ShippingAddress.PostalCode,
                    FullAddress = $"{o.ShippingAddress.Name}, {o.ShippingAddress.UnitNo}, {o.ShippingAddress.Street}, {o.ShippingAddress.PostalCode}"
                } : null,
                OrderItems = o.OrderItems.Select(oi => new OrderItemDTO
                {
                    OrderItemId = oi.OrderItemId,
                    ProductName = oi.Product.Name, // Retrieve the product name
                    Price = oi.Price,
                    Quantity = oi.Quantity
                }).ToList()
            }).ToList();

            return Ok(orderDTOs);
        }

        [HttpPut("addOrderToDeliveryAgent/{orderId}")]
        public async Task<IActionResult> AddOrderToDeliveryAgent(int orderId)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized("User not logged in.");
            }

            var deliveryAgent = await _context.DeliveryAgents.FirstOrDefaultAsync(da => da.StaffId == int.Parse(userId));
            if (deliveryAgent == null)
            {
                return NotFound("Delivery agent not found.");
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (deliveryAgent.OrderIds == null)
            {
                deliveryAgent.OrderIds = new List<int>();
            }

            deliveryAgent.OrderIds.Add(orderId);
            order.OrderStatus = OrderStatus.Delivered; // Update the order status to Delivered
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order added to delivery agent successfully and status updated to Delivered." });
        }


        [HttpGet("GenerateAWB/{orderId}")]
        public async Task<IActionResult> GenerateAWB(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Include(o => o.Customer)
                .ThenInclude(c => c.Addresses)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Order not found.");

            using (var stream = new MemoryStream())
            {
                // Set document to A5 Portrait
                var document = new Document(PageSize.A5, 40, 40, 30, 30);
                PdfWriter writer = PdfWriter.GetInstance(document, stream);
                document.Open();

                // Fonts (Increased size)
                var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
                var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
                var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
                var trackingFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK);

                // Generate Tracking Number (Example: BTAOL000123456)
                string trackingNumber = $"BTAOL{order.OrderId.ToString().PadLeft(9, '0')}";

                // Add Barcode (Shrunk)
                var barcode = new Barcode128
                {
                    Code = trackingNumber,
                    StartStopText = true,
                    BarHeight = 25f, // Reduce barcode height
                    X = 1.8f // Adjust line thickness
                };
                var barcodeImage = barcode.CreateImageWithBarcode(writer.DirectContent, BaseColor.BLACK, BaseColor.BLACK);
                barcodeImage.ScalePercent(120); // Reduce size slightly
                barcodeImage.Alignment = Element.ALIGN_CENTER;
                document.Add(barcodeImage);

                // Tracking Number Below Barcode
                var trackingText = new Paragraph($"TRACKING NUMBER: {trackingNumber}", trackingFont)
                {
                    Alignment = Element.ALIGN_CENTER,
                    SpacingAfter = 10
                };
                document.Add(trackingText);

                // **Order Details Section**
                var orderDetailsTable = new PdfPTable(2)
                {
                    WidthPercentage = 100
                };
                orderDetailsTable.SetWidths(new float[] { 1, 1 });

                orderDetailsTable.AddCell(new PdfPCell(new Phrase("Order ID:", headerFont)) { Border = Rectangle.NO_BORDER });
                orderDetailsTable.AddCell(new PdfPCell(new Phrase(order.OrderId.ToString(), normalFont)) { Border = Rectangle.NO_BORDER });

                orderDetailsTable.AddCell(new PdfPCell(new Phrase("Order Date:", headerFont)) { Border = Rectangle.NO_BORDER });
                orderDetailsTable.AddCell(new PdfPCell(new Phrase(order.OrderDate.ToString("dd MMM yyyy HH:mm:ss"), normalFont)) { Border = Rectangle.NO_BORDER });

                orderDetailsTable.AddCell(new PdfPCell(new Phrase("Total Amount:", headerFont)) { Border = Rectangle.NO_BORDER });
                orderDetailsTable.AddCell(new PdfPCell(new Phrase($"SGD {order.TotalAmount:F2}", normalFont)) { Border = Rectangle.NO_BORDER });

                document.Add(orderDetailsTable);
                document.Add(new Paragraph("\n"));

                // **Sender & Receiver Details**
                var senderReceiverTable = new PdfPTable(2)
                {
                    WidthPercentage = 100
                };
                senderReceiverTable.SetWidths(new float[] { 1, 1 });

                senderReceiverTable.AddCell(new PdfPCell(new Phrase("SENDER", headerFont)) { Border = Rectangle.NO_BORDER });
                senderReceiverTable.AddCell(new PdfPCell(new Phrase("RECEIVER", headerFont)) { Border = Rectangle.NO_BORDER });

                senderReceiverTable.AddCell(new PdfPCell(new Phrase("Bata Online", normalFont)) { Border = Rectangle.NO_BORDER });
                senderReceiverTable.AddCell(new PdfPCell(new Phrase(order.Customer.Email, normalFont)) { Border = Rectangle.NO_BORDER });

                senderReceiverTable.AddCell(new PdfPCell(new Phrase("111 N Bridge Rd, #01-27 Peninsula Plaza, Singapore 179098", normalFont)) { Border = Rectangle.NO_BORDER });
                senderReceiverTable.AddCell(new PdfPCell(new Phrase(order.Customer.Addresses.FirstOrDefault()?.Street ?? "N/A", normalFont)) { Border = Rectangle.NO_BORDER });

                senderReceiverTable.AddCell(new PdfPCell(new Phrase("Phone: +65 1234 5678", normalFont)) { Border = Rectangle.NO_BORDER });
                senderReceiverTable.AddCell(new PdfPCell(new Phrase("Phone: +65 9876 5432", normalFont)) { Border = Rectangle.NO_BORDER });

                document.Add(senderReceiverTable);
                document.Add(new Paragraph("\n"));

                // **Order Items Table**
                var itemTable = new PdfPTable(4)
                {
                    WidthPercentage = 100
                };
                itemTable.SetWidths(new float[] { 3, 1, 1, 1 });

                itemTable.AddCell(new PdfPCell(new Phrase("Product Name", headerFont)) { BackgroundColor = BaseColor.LIGHT_GRAY });
                itemTable.AddCell(new PdfPCell(new Phrase("Qty", headerFont)) { BackgroundColor = BaseColor.LIGHT_GRAY });
                itemTable.AddCell(new PdfPCell(new Phrase("Unit Price (SGD)", headerFont)) { BackgroundColor = BaseColor.LIGHT_GRAY });
                itemTable.AddCell(new PdfPCell(new Phrase("Total Price (SGD)", headerFont)) { BackgroundColor = BaseColor.LIGHT_GRAY });

                foreach (var item in order.OrderItems)
                {
                    itemTable.AddCell(new PdfPCell(new Phrase(item.Product.Name, normalFont)));
                    itemTable.AddCell(new PdfPCell(new Phrase(item.Quantity.ToString(), normalFont)));
                    itemTable.AddCell(new PdfPCell(new Phrase($"{item.Price:F2}", normalFont)));
                    itemTable.AddCell(new PdfPCell(new Phrase($"{(item.Price * item.Quantity):F2}", normalFont)));
                }

                document.Add(itemTable);
                document.Add(new Paragraph("\n"));

                // **Shipment Details**
                document.Add(new Paragraph("Shipping Method: Standard Delivery", normalFont));
                document.Add(new Paragraph("Expected Delivery: 3-5 Business Days", normalFont));

                // **Signature Section**
                document.Add(new Paragraph("\nSIGNATURES", headerFont));
                document.Add(new Paragraph("Sender: ___________________________", normalFont));
                document.Add(new Paragraph("Receiver: ___________________________", normalFont));

                document.Close();
                var pdfBytes = stream.ToArray();
                return File(pdfBytes, "application/pdf", $"AWB_{order.OrderId}.pdf");
            }
        }





        [HttpPut("removeOrderFromDeliveryAgent/{orderId}")]
        public async Task<IActionResult> RemoveOrderFromDeliveryAgent(int orderId)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized("User not logged in.");
            }

            var deliveryAgent = await _context.DeliveryAgents.FirstOrDefaultAsync(da => da.StaffId == int.Parse(userId));
            if (deliveryAgent == null)
            {
                return NotFound("Delivery agent not found.");
            }

            if (deliveryAgent.OrderIds == null || !deliveryAgent.OrderIds.Contains(orderId))
            {
                return BadRequest("Order not found in delivery agent's orders.");
            }

            deliveryAgent.OrderIds.Remove(orderId);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order removed from delivery agent successfully." });
        }

        [HttpGet("GetStaffIdsByAgent/{staffId}")]
        public async Task<IActionResult> GetStaffIdsByAgent(int staffId)
        {
            var deliveryAgent = await _context.DeliveryAgents.FirstOrDefaultAsync(da => da.StaffId == staffId);
            if (deliveryAgent == null)
            {
                return NotFound("Delivery agent not found.");
            }

            var staffIds = await _context.DeliveryAgents
                .Where(s => s.AgentId == deliveryAgent.AgentId)
                .Select(s => s.OrderIds)
                .ToListAsync();

            return Ok(staffIds);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllOrders()
        {
            Console.WriteLine("GetAllOrders endpoint hit."); // Log the request

            var orders = await _context.Orders
                .Include(o => o.Voucher)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product) // Ensure product details are loaded
                .Include(o => o.Customer)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            if (!orders.Any())
            {
                return NotFound("No orders found.");
            }

            var data = orders.Select(o => new
            {
                o.OrderId,
                o.OrderDate,
                o.OrderStatus,
                o.TotalAmount,
                o.Email,
                ShippingAddress = o.ShippingAddress != null ? o.ShippingAddress.Street : "No address provided",
                Voucher = o.Voucher?.Code ?? "No voucher used",
                OrderItems = o.OrderItems.Select(oi => new
                {
                    ProductName = oi.Product.Name, // Ensure `Product.Name` exists
                    oi.Quantity,
                    oi.Price,
                    oi.ShoeSize, // ✅ Include shoe size in the response
                    TotalPrice = oi.Quantity * oi.Price
                }).ToList()
            });

            return Ok(data);
        }


        // Get all orders for a customer
        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            var customerId = GetCustomerId();
            var orders = await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .Include(o => o.Voucher)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.OrderItems) // Include OrderItems
                .ThenInclude(oi => oi.Product) // Include Product details
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            if (!orders.Any())
            {
                return NotFound("No orders found for this customer.");
            }

            var data = orders.Select(o => new
            {
                o.OrderId,
                o.OrderDate,
                o.OrderStatus,
                o.TotalAmount,
                ShippingAddress = o.ShippingAddress != null ? o.ShippingAddress.Street : "No address provided",
                Voucher = o.Voucher?.Code ?? "No voucher used",
                o.Email,
                // Include the OrderItems in the response
                OrderItems = o.OrderItems.Select(oi => new
                {
                    oi.Product.Name,
                    oi.Quantity,
                    oi.Price,
                    oi.ShoeSize, // ✅ Include shoe size in the response
                    TotalPrice = oi.Quantity * oi.Price
                }).ToList()
            });

            return Ok(data);
        }

        [HttpPut("ScanAWBBarcode/{barcode}")]
        public async Task<IActionResult> ScanAWBBarcode(string barcode)
        {
            _logger.LogInformation("ScanAWBBarcode called with barcode: {Barcode}", barcode);

            try
            {
                if (string.IsNullOrEmpty(barcode))
                {
                    _logger.LogWarning("Barcode is empty or null.");
                    return BadRequest("Barcode is required.");
                }

                // Extract OrderId from barcode (Assuming format: BTAOL000123456)
                var match = Regex.Match(barcode, @"BTAOL(\d{9})"); // Extract numeric part
                if (!match.Success)
                {
                    _logger.LogWarning("Invalid barcode format: {Barcode}", barcode);
                    return BadRequest("Invalid barcode format.");
                }

                int orderId = int.Parse(match.Groups[1].Value);
                _logger.LogInformation("Extracted OrderId from barcode: {OrderId}", orderId);

                // Find the order
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);
                if (order == null)
                {
                    _logger.LogWarning("Order not found for OrderId: {OrderId}", orderId);
                    return NotFound("Order not found.");
                }

                // Check if the order is already delivered
                if (order.OrderStatus == OrderStatus.Delivered)
                {
                    _logger.LogInformation("Order with OrderId: {OrderId} is already marked as Delivered.", orderId);
                    return BadRequest("Order is already marked as Delivered.");
                }

                // Update order status to Delivered
                order.OrderStatus = OrderStatus.Delivered;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Order with OrderId: {OrderId} marked as Delivered.", orderId);
                return Ok(new { message = "Order marked as Delivered.", OrderId = orderId });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error processing barcode scan: {Message}", ex.Message);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var customerId = GetCustomerId();
            var role = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value; // Get the user's role

            var orderQuery = _context.Orders
                .Include(o => o.ShippingAddress)
                .Include(o => o.Voucher)
                .Include(o => o.Payment)
                .Include(o => o.OrderItems) // Include OrderItems
                .ThenInclude(oi => oi.Product) // If you need product details, use ThenInclude
                .Where(o => o.OrderId == id);

            // If the user is not a staff member, enforce the CustomerId check
            if (role != "standard")
            {
                orderQuery = orderQuery.Where(o => o.CustomerId == customerId);
            }

            var order = await orderQuery.FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound("Order not found or does not belong to this customer.");
            }

            var data = new
            {
                order.OrderId,
                order.OrderDate,
                order.OrderStatus,
                order.Subtotal,
                order.Discount,
                order.ShippingFee,
                order.TotalAmount,
                order.Email,
                order.ContactNumber,
                order.ShippingAddress?.UnitNo,
                order.ShippingAddress?.PostalCode,
                order.ShippingAddress?.Name,
                ShippingAddress = order.ShippingAddress != null ? order.ShippingAddress.Street : "No address provided",
                // Include the OrderItems
                OrderItems = order.OrderItems.Select(oi => new
                {
                    oi.Product.Name,
                    oi.Quantity,
                    oi.Price,
                    oi.ShoeSize, // ✅ Include shoe size in the response
                    TotalPrice = oi.Quantity * oi.Price
                }).ToList()
            };

            return Ok(data);
        }


        // Update order status (for admin or staff)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus newStatus)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound("Order not found.");
            }

            // Update the order status
            order.OrderStatus = newStatus;
            order.UpdatedAt = DateTime.UtcNow.AddHours(8);


            await _context.SaveChangesAsync();

            return Ok(new { order.OrderId, order.OrderStatus });
        }

        // Delete order (for customer or admin)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var customerId = GetCustomerId();
            var order = await _context.Orders.FindAsync(id);

            if (order == null || order.CustomerId != customerId)
            {
                return NotFound("Order not found or does not belong to this customer.");
            }

            // Remove associated payment when deleting the order

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order deleted successfully." });
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
