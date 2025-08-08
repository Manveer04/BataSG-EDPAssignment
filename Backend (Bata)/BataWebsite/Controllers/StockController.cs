using BataWebsite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.IO;
using Microsoft.Extensions.Logging; // Import logging namespace

namespace BataWebsite.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class StockController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<StockController> _logger;

        // ✅ CORRECT WAY to Inject ILogger
        public StockController(MyDbContext context, ILogger<StockController> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            IQueryable<Stock> result = _context.Stocks;
            var list = result.OrderByDescending(x => x.CreatedAt).ToList();
            return Ok(list);
        }
        [HttpPost]
        public IActionResult AddStock(Stock stock)
        {
            var now = DateTime.Now;
            var myStock = new Stock()
            {
                ProductId = stock.ProductId,
                Size5 = 1,
                Size6 = 2,
                Size7 = 3,
                Size8 = 4,
                Size9 = 5,
                Size10 = 6,
                Size11 = 7,
                Size12 = 8,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Stocks.Add(myStock);
            _context.SaveChanges();
            return Ok(myStock);
        }
        [HttpGet("product/{productId}")]
        public IActionResult GetStockByProductId(int productId)
        {
            var stock = _context.Stocks.FirstOrDefault(s => s.ProductId == productId);
            if (stock == null)
            {
                return NotFound($"Stock for ProductId {productId} not found.");
            }
            return Ok(stock);
        }

        [HttpPut("product/{productId}")]
        public IActionResult UpdateStockByProductId(int productId, [FromBody] Stock stock)
        {
            _logger.LogInformation($"📦 [UpdateStock] Request received for Product ID: {productId}");

            if (stock == null)
            {
                _logger.LogWarning($"⚠️ [UpdateStock] No stock data received.");
                return BadRequest("Invalid stock data provided.");
            }

            _logger.LogInformation($"📝 [UpdateStock] Received Payload: {System.Text.Json.JsonSerializer.Serialize(stock)}");

            var myStock = _context.Stocks.FirstOrDefault(s => s.ProductId == productId);
            if (myStock == null)
            {
                _logger.LogWarning($"❌ [UpdateStock] Stock for Product ID {productId} not found.");
                return NotFound($"Stock for Product ID {productId} not found.");
            }

            // **Ensure the request does NOT contain Product (which causes validation errors)**
            if (stock.Product != null)
            {
                _logger.LogWarning($"⚠️ [UpdateStock] Request contains an invalid Product object. Ignoring it.");
                stock.Product = null;  // 👈 Remove Product to avoid validation error
            }

            // Update stock values
            myStock.Size5 = stock.Size5;
            myStock.Size6 = stock.Size6;
            myStock.Size7 = stock.Size7;
            myStock.Size8 = stock.Size8;
            myStock.Size9 = stock.Size9;
            myStock.Size10 = stock.Size10;
            myStock.Size11 = stock.Size11;
            myStock.Size12 = stock.Size12;
            myStock.UpdatedAt = DateTime.Now;

            _logger.LogInformation($"✅ [UpdateStock] Updated Stock Values: {System.Text.Json.JsonSerializer.Serialize(myStock)}");

            try
            {
                _context.SaveChanges();
                _logger.LogInformation($"🚀 [UpdateStock] Successfully updated stock for Product ID {productId}.");
                return Ok(myStock);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ [UpdateStock] Database error updating stock for Product ID {productId}: {ex.Message}");
                return StatusCode(500, "Internal Server Error while updating stock.");
            }
        }





        [HttpDelete("{id}")]
        public IActionResult DeleteStock(int id)
        {
            var myStock = _context.Stocks.Find(id);
            if (myStock == null)
            {
                return NotFound();
            }
            _context.Stocks.Remove(myStock);
            _context.SaveChanges();
            return Ok();
        }
        [HttpGet("export")]
        public IActionResult ExportStockToExcel()
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            // Fetch stocks with product details
            var stocks = _context.Stocks
                .Include(s => s.Product) // Join with Product table
                .Select(s => new
                {
                    s.ProductId,
                    ProductName = s.Product.Name, // Get Product Name
                    s.Size5,
                    s.Size6,
                    s.Size7,
                    s.Size8,
                    s.Size9,
                    s.Size10,
                    s.Size11,
                    s.Size12
                })
                .ToList();

            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Stocks");

                // Add headers including Product Name
                worksheet.Cells[1, 1].Value = "ProductId";
                worksheet.Cells[1, 2].Value = "Product Name"; // New Column
                worksheet.Cells[1, 3].Value = "Size 5";
                worksheet.Cells[1, 4].Value = "Size 6";
                worksheet.Cells[1, 5].Value = "Size 7";
                worksheet.Cells[1, 6].Value = "Size 8";
                worksheet.Cells[1, 7].Value = "Size 9";
                worksheet.Cells[1, 8].Value = "Size 10";
                worksheet.Cells[1, 9].Value = "Size 11";
                worksheet.Cells[1, 10].Value = "Size 12";

                // Add stock data
                for (int i = 0; i < stocks.Count; i++)
                {
                    var stock = stocks[i];
                    worksheet.Cells[i + 2, 1].Value = stock.ProductId;
                    worksheet.Cells[i + 2, 2].Value = stock.ProductName; // Include Product Name
                    worksheet.Cells[i + 2, 3].Value = stock.Size5;
                    worksheet.Cells[i + 2, 4].Value = stock.Size6;
                    worksheet.Cells[i + 2, 5].Value = stock.Size7;
                    worksheet.Cells[i + 2, 6].Value = stock.Size8;
                    worksheet.Cells[i + 2, 7].Value = stock.Size9;
                    worksheet.Cells[i + 2, 8].Value = stock.Size10;
                    worksheet.Cells[i + 2, 9].Value = stock.Size11;
                    worksheet.Cells[i + 2, 10].Value = stock.Size12;
                }

                // Convert to byte array and return the Excel file
                var fileContent = package.GetAsByteArray();
                return File(fileContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "StockData.xlsx");
            }
        }
        [HttpPost("import")]
        public IActionResult ImportStockFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            // Set EPPlus license context
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            try
            {
                using (var package = new ExcelPackage(file.OpenReadStream()))
                {
                    var worksheet = package.Workbook.Worksheets[0];

                    // Read the data from the Excel file
                    int rowCount = worksheet.Dimension.Rows;

                    for (int row = 2; row <= rowCount; row++) // Skip header row
                    {
                        // Read the ProductId from column 1
                        if (!int.TryParse(worksheet.Cells[row, 1].Text, out int productId))
                        {
                            continue; // Skip invalid ProductId rows
                        }

                        // Ignore Column 2 (Product Name) and only extract stock data from column 3 onwards
                        var stock = new Stock
                        {
                            ProductId = productId,
                            Size5 = int.TryParse(worksheet.Cells[row, 3].Text, out int size5) ? size5 : 0,
                            Size6 = int.TryParse(worksheet.Cells[row, 4].Text, out int size6) ? size6 : 0,
                            Size7 = int.TryParse(worksheet.Cells[row, 5].Text, out int size7) ? size7 : 0,
                            Size8 = int.TryParse(worksheet.Cells[row, 6].Text, out int size8) ? size8 : 0,
                            Size9 = int.TryParse(worksheet.Cells[row, 7].Text, out int size9) ? size9 : 0,
                            Size10 = int.TryParse(worksheet.Cells[row, 8].Text, out int size10) ? size10 : 0,
                            Size11 = int.TryParse(worksheet.Cells[row, 9].Text, out int size11) ? size11 : 0,
                            Size12 = int.TryParse(worksheet.Cells[row, 10].Text, out int size12) ? size12 : 0,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };

                        // Check if stock already exists for this product
                        var existingStock = _context.Stocks.FirstOrDefault(s => s.ProductId == productId);
                        if (existingStock != null)
                        {
                            // Update existing stock
                            existingStock.Size5 = stock.Size5;
                            existingStock.Size6 = stock.Size6;
                            existingStock.Size7 = stock.Size7;
                            existingStock.Size8 = stock.Size8;
                            existingStock.Size9 = stock.Size9;
                            existingStock.Size10 = stock.Size10;
                            existingStock.Size11 = stock.Size11;
                            existingStock.Size12 = stock.Size12;
                            existingStock.UpdatedAt = DateTime.Now;
                        }
                        else
                        {
                            // Add new stock entry
                            _context.Stocks.Add(stock);
                        }
                    }

                    _context.SaveChanges();
                }

                return Ok("Stocks imported successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error importing stocks: {ex.Message}");
            }
        }
    }
}
