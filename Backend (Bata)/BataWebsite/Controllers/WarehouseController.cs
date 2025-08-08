using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WarehouseController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public WarehouseController(MyDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        [HttpPost, Authorize]
        public async Task<IActionResult> CreateWarehouse([FromBody] Warehouse warehouse)
        {
            if (warehouse == null)
            {
                return BadRequest(new { message = "Invalid warehouse data" });
            }

            if (string.IsNullOrWhiteSpace(warehouse.WarehouseName))
            {
                return BadRequest(new { message = "Warehouse name is required" });
            }

            await _context.Warehouses.AddAsync(warehouse);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWarehouseById), new { id = warehouse.WarehouseId }, warehouse);
        }



        [HttpGet]
        public async Task<IActionResult> GetAllWarehouses()
        {
            var warehouses = await _context.Warehouses.ToListAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWarehouseById(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
                return NotFound();
            return Ok(warehouse);
        }

        [HttpPut("{id}"), Authorize]
        public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] Warehouse updatedWarehouse)
        {
            if (updatedWarehouse == null)
            {
                return BadRequest(new { message = "Invalid warehouse data received." });
            }

            if (id != updatedWarehouse.WarehouseId)
            {
                return BadRequest(new { message = "Warehouse ID in URL does not match the request body." });
            }

            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
            {
                return NotFound(new { message = "Warehouse not found." });
            }

            try
            {
                // Update warehouse details
                warehouse.WarehouseName = updatedWarehouse.WarehouseName;
                warehouse.Address = updatedWarehouse.Address;
                warehouse.PostalCode = updatedWarehouse.PostalCode;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Warehouse updated successfully.", warehouse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the warehouse.", error = ex.Message });
            }
        }


        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
                return NotFound();

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("with-distance")]
        public async Task<IActionResult> GetWarehousesWithDistance([FromQuery] double userLat, [FromQuery] double userLng)
        {
            try
            {
                var warehouses = await _context.Warehouses.ToListAsync();
                string oneMapToken = _configuration.GetValue<string>("OneMap:Token");

                if (string.IsNullOrEmpty(oneMapToken))
                {
                    throw new Exception("OneMap API token is missing. Check appsettings.json.");
                }

                var warehouseDistances = new List<object>();

                foreach (var warehouse in warehouses)
                {
                    var coordinates = await GetWarehouseCoordinates(warehouse.Address, oneMapToken);
                    if (coordinates == null)
                    {
                        Console.WriteLine($"Could not get coordinates for warehouse: {warehouse.WarehouseName}");
                        continue;
                    }

                    double? distance = await GetDistance(userLat, userLng, coordinates.Value.lat, coordinates.Value.lng, oneMapToken);

                    warehouseDistances.Add(new
                    {
                        warehouse.WarehouseId,
                        warehouse.WarehouseName,
                        warehouse.Address,
                        warehouse.PostalCode,
                        Distance = distance.HasValue ? $"{distance.Value:F1} km" : "Distance unavailable"
                    });
                }

                return Ok(warehouseDistances);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching warehouse distances: {ex}");
                return StatusCode(500, new { message = "Error fetching warehouse distances", error = ex.Message });
            }
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

        private async Task<double?> GetDistance(double startLat, double startLng, double endLat, double endLng, string token)
        {
            string routeUrl = $"https://www.onemap.gov.sg/api/public/routingsvc/route?start={startLat},{startLng}&end={endLat},{endLng}&routeType=drive";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await _httpClient.GetAsync(routeUrl);

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"❌ OneMap Route API request failed. Status Code: {response.StatusCode}");
                var errorMessage = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"❌ OneMap Error Response: {errorMessage}");
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"🔍 OneMap Route API Response: {responseBody}"); // ✅ Log full response

            var data = JsonSerializer.Deserialize<OneMapRouteResponse>(responseBody);

            if (data == null)
            {
                Console.WriteLine("⚠ OneMap response is null");
                return null;
            }

            if (data.RouteSummary == null)
            {
                Console.WriteLine($"⚠ RouteSummary is missing in OneMap API response.");
                return null;
            }

            Console.WriteLine($"✅ Distance found: {data.RouteSummary.TotalDistance / 1000.0} km");
            return data.RouteSummary.TotalDistance / 1000.0;
        }




        public class OneMapSearchResponse
        {
            [JsonPropertyName("found")]
            public int Found { get; set; }

            [JsonPropertyName("results")]
            public List<OneMapSearchResult> Results { get; set; } = new List<OneMapSearchResult>();
        }

        public class OneMapSearchResult
        {
            [JsonPropertyName("LATITUDE")]
            public string LatitudeStr { get; set; }

            [JsonPropertyName("LONGITUDE")]
            public string LongitudeStr { get; set; }

            public double Latitude => double.TryParse(LatitudeStr, out var lat) ? lat : 0.0;
            public double Longitude => double.TryParse(LongitudeStr, out var lng) ? lng : 0.0;
        }


        public class OneMapRouteResponse
        {
            [JsonPropertyName("status")]
            public int Status { get; set; }

            [JsonPropertyName("route_summary")]
            public RouteSummary RouteSummary { get; set; } = new RouteSummary();
        }

        public class RouteSummary
        {
            [JsonPropertyName("total_distance")]
            public double TotalDistance { get; set; }
        }
    }
}
