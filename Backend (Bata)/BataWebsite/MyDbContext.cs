using BataWebsite.Models;
using Microsoft.EntityFrameworkCore;

namespace BataWebsite
{
    public class MyDbContext(IConfiguration configuration) : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string? connectionString = configuration.GetConnectionString("MyConnection");
            if (connectionString != null)
            {
                optionsBuilder.UseMySQL(connectionString);
            }
        }


        public DbSet<Customer>? Customers { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Address>? Addresses { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public required DbSet<DeliveryAgent> DeliveryAgents { get; set; }
        public required DbSet<JobApplicant> JobApplicant { get; set; }
        public required DbSet<FulfilmentStaff> FulfilmentStaffs { get; set; }
        public required DbSet<DeliveryRoute> DeliveryRoutes { get; set; }
        public required DbSet<Delivery> Deliveries { get; set; }
        public required DbSet<Warehouse> Warehouses { get; set; }

        public required DbSet<Reward> Rewards { get; set; }

        public DbSet<RedeemedReward> RedeemedRewards { get; set; }
        public DbSet<Order> Orders { get; set; } // Add the DbSet for Orders
        public DbSet<Payment> Payments { get; set; } // Add a new DbSet for payments (if using a separate table for payments)
        public DbSet<OrderItem> OrderItems { get; set; }

        public required DbSet<Stock> Stocks { get; set; }


        public required DbSet<ProductCategory> Category { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure the one-to-many relationship between Customer and Address
            modelBuilder.Entity<Address>()
                .HasOne(a => a.Customer) // Each Address has one Customer
                .WithMany(c => c.Addresses) // Each Customer can have many Addresses
                .HasForeignKey(a => a.CustomerId) // Foreign key in Address table
                .OnDelete(DeleteBehavior.Cascade); // Optional: Cascade delete related Addresses when a Customer is deleted

            // Add a composite unique constraint for CartId and ProductId
            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.ProductId })
                .IsUnique();

            // Order - Voucher relationship: many-to-1
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Voucher)
                .WithMany()
                .HasForeignKey(o => o.VoucherId)
                .OnDelete(DeleteBehavior.SetNull);


            modelBuilder.Entity<OrderItem>()
                    .HasOne(oi => oi.Order)  // Each OrderItem has one Order
                    .WithMany(o => o.OrderItems) // An Order can have many OrderItems
                    .HasForeignKey(oi => oi.OrderId) // Foreign key in OrderItem table
                    .OnDelete(DeleteBehavior.Cascade);  // Cascade delete related OrderItems when an Order is deleted

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.DeliveryAgent)
                .WithOne(da => da.Delivery)
                .HasForeignKey<Delivery>(d => d.DeliveryAgentId) // ✅ Explicitly setting foreign key
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading delete loops

            modelBuilder.Entity<FulfilmentStaff>()
                .HasOne(f => f.Staff)
                .WithMany()
                .HasForeignKey(f => f.StaffId)
                .OnDelete(DeleteBehavior.Cascade);


        }

    }
}
