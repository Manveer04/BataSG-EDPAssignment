using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BataWebsite.Models
{
    public enum OrderStatus
    {
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }

    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        [Required]
        [ForeignKey("Customer")]
        public int CustomerId { get; set; }

        public Customer? Customer { get; set; }

        [Required]
        public OrderStatus OrderStatus { get; set; } = OrderStatus.Processing;
        public int? FulfilmentStaffId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? Discount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal ShippingFee { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Foreign Key to Address for Shipping Address
        [ForeignKey("ShippingAddress")]
        public int? ShippingAddressId { get; set; }

        public Address? ShippingAddress { get; set; }  // Change from Addresses to ShippingAddress

        // Contact number added to the order
        public string ContactNumber { get; set; } = string.Empty;

        // Email field added to the order
        public string Email { get; set; } = string.Empty;

        // Foreign Key to Voucher (nullable since it's not mandatory for all orders)
        [ForeignKey("Voucher")]
        public int? VoucherId { get; set; }

        public Voucher? Voucher { get; set; }

        // One-to-one relationship with Payment
        [ForeignKey("Payment")]
        public int PaymentId { get; set; }

        public Payment? Payment { get; set; }

        // Add navigation property for OrderItems
        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }



}
