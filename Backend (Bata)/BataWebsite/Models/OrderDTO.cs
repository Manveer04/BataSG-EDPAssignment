namespace BataWebsite.Models
{
    public class OrderDTO
    {
        public int OrderId { get; set; }
        public DateTime OrderDate { get; set; }
        public OrderStatus OrderStatus { get; set; }
        public decimal TotalAmount { get; set; }
        public string Email { get; set; }
        public List<OrderItemDTO> OrderItems { get; set; }
        public AddressDTO? ShippingAddress { get; set; } // Optional ShippingAddress
    }

    public class OrderItemDTO
    {
        public int OrderItemId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}
