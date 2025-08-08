using BataWebsite.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using static BataWebsite.Controllers.WarehouseController;

namespace BataWebsite.Services
{
    public class OrderAssignmentService
    {
        private readonly MyDbContext _context;
        private readonly ILogger<OrderAssignmentService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _token;

        public OrderAssignmentService(MyDbContext context, ILogger<OrderAssignmentService> logger, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClient;

            // ✅ Retrieve the token from appsettings.json
            _token = configuration.GetValue<string>("OneMap:Token");

            if (string.IsNullOrEmpty(_token))
            {
                throw new Exception("OneMap Token is missing in appsettings.json");
            }
        }
        public class OneMapSearchResponse
        {
            [JsonPropertyName("found")]
            public int Found { get; set; }

            [JsonPropertyName("results")]
            public List<OneMapSearchResult> Results { get; set; } = new List<OneMapSearchResult>();
        }

        public async Task<bool> AssignOrder(int orderId)
        {
            var order = await _context.Orders.Include(o => o.ShippingAddress).FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
            {
                return false;
            }

            var shippingAddress = order.ShippingAddress;
            if (shippingAddress == null)
            {
                _logger.LogWarning("Invalid shipping location for order {OrderId}", orderId);
                return false;
            }

            var shippingCoordinates = await GetWarehouseCoordinates($"{shippingAddress.Street} {shippingAddress.PostalCode}", _token);
            if (!shippingCoordinates.HasValue)
            {
                _logger.LogWarning("Unable to geocode shipping address for order {OrderId}", orderId);
                return false;
            }

            var warehouses = await _context.Warehouses.ToListAsync();
            var orderedWarehouses = new List<(Warehouse warehouse, double distance)>();

            foreach (var warehouse in warehouses)
            {
                var warehouseCoordinates = await GetWarehouseCoordinates(warehouse.Address, _token);
                if (!warehouseCoordinates.HasValue)
                {
                    _logger.LogWarning("Unable to geocode warehouse address for warehouse {WarehouseId}", warehouse.WarehouseId);
                    continue;
                }

                var distance = CalculateDistance(
                    shippingCoordinates.Value.lat, shippingCoordinates.Value.lng,
                    warehouseCoordinates.Value.lat, warehouseCoordinates.Value.lng);

                orderedWarehouses.Add((warehouse, distance));
            }

            orderedWarehouses = orderedWarehouses.OrderBy(w => w.distance).ToList();

            FulfilmentStaff? bestStaff = null;
            foreach (var wh in orderedWarehouses)
            {
                var candidates = await _context.FulfilmentStaffs
                    .Where(fs => fs.WarehouseId == wh.warehouse.WarehouseId && !fs.OnBreak)
                    .ToListAsync();

                if (!candidates.Any()) continue;

                var maxWorkload = candidates.Max(fs => fs.AssignedOrdersCount) + 1;
                var staffScores = candidates
                    .Select(fs => new
                    {
                        Staff = fs,
                        Score = (0.5 * (1 - (wh.distance / 50))) + // Distance weight (50km max)
                               (0.5 * (1 - (fs.AssignedOrdersCount / (double)maxWorkload)))
                    })
                    .OrderByDescending(s => s.Score)
                    .ToList();

                bestStaff = staffScores.First().Staff;
                break;
            }

            if (bestStaff != null)
            {
                bestStaff.AssignedOrdersCount++;
                order.FulfilmentStaffId = bestStaff.FulfilStaffId;
                order.OrderStatus = OrderStatus.Processing;
            }
            else
            {
                _logger.LogWarning("No available staff found for order {OrderId}", order.OrderId);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<(double lat, double lng)?> GetWarehouseCoordinates(string address, string token)
        {
            string searchUrl = $"https://www.onemap.gov.sg/api/common/elastic/search?searchVal={Uri.EscapeDataString(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(token);
            var response = await _httpClient.GetAsync(searchUrl);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"❌ OneMap Search API request failed. Status Code: {response.StatusCode}");
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"🔍 OneMap API Response: {responseBody}"); // ✅ Log full response

            var data = JsonSerializer.Deserialize<OneMapSearchResponse>(responseBody);

            if (data == null || data.Results == null || data.Results.Count == 0)
            {
                Console.WriteLine($"⚠ No coordinates found for address: {address}");
                return null;
            }

            var result = data.Results[0]; // Take the first result
            Console.WriteLine($"✅ Found coordinates: {result.Latitude}, {result.Longitude}");

            return (result.Latitude, result.Longitude);
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // Earth radius in km
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }
}
