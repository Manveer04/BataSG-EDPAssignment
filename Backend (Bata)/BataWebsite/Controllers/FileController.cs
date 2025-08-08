using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NanoidDotNet;

namespace BataWebsite.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FileController(IWebHostEnvironment environment,
        ILogger<FileController> logger) : ControllerBase
    {
        private readonly IWebHostEnvironment _environment = environment;
        private readonly ILogger<FileController> _logger = logger;

        [HttpPost("upload"), Authorize]
        [ProducesResponseType(typeof(UploadResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            try
            {
                var extension = Path.GetExtension(file.FileName).ToLower();
                var isImage = extension == ".jpg" || extension == ".jpeg" || extension == ".png" || extension == ".gif";
                var isThreeJsFile = extension == ".glb" || extension == ".gltf" || extension == ".json";

                if (isImage && file.Length > 1024 * 1024) // 1MB limit for images
                {
                    var message = "Maximum file size for images is 1MB";
                    return BadRequest(new { message });
                }
                else if (isThreeJsFile && file.Length > 30 * 1024 * 1024) // 30MB limit for Three.js files
                {
                    var message = "Maximum file size for 3D models is 30MB";
                    return BadRequest(new { message });
                }
                else if (!isImage && !isThreeJsFile)
                {
                    var message = "Unsupported file format";
                    return BadRequest(new { message });
                }

                var id = Nanoid.Generate(size: 10);
                var filename = id + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(_environment.ContentRootPath, @"wwwroot/uploads", filename);
                using var fileStream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(fileStream);
                UploadResponse response = new() { Filename = filename };
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when uploading file");
                return StatusCode(500);
            }
        }
    }
}
