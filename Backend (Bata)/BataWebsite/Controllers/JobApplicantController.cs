using BataWebsite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class JobApplicantController : ControllerBase
    {
        private readonly MyDbContext context;
        private readonly ILogger<JobApplicantController> logger;
        private readonly IWebHostEnvironment _environment;

        public JobApplicantController(MyDbContext context, ILogger<JobApplicantController> logger, IWebHostEnvironment environment)
        {
            this.context = context;
            this.logger = logger;
            _environment = environment;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllJobApplicants()
        {
            try
            {
                List<JobApplicant> jobApplicants = await context.JobApplicant.ToListAsync();
                return Ok(jobApplicants);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving job applicants");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("resume/{fileName}")]
        public IActionResult GetResumeFile(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_environment.ContentRootPath, "wwwroot/uploads", fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("File not found");
                }

                var mimeType = GetMimeType(fileName);

                // ✅ Allow inline viewing (instead of forcing download)
                Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"";

                return PhysicalFile(filePath, mimeType);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving resume file");
                return StatusCode(500, "Error retrieving file");
            }
        }

        // ✅ Ensure correct MIME type is detected
        private static string GetMimeType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLower();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }


        // ✅ Update application (Only if not yet approved/rejected)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] JobApplicant updatedApplication)
        {
            var application = await context.JobApplicant.FindAsync(id);
            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }

            if (application.Status == "Approved" || application.Status == "Rejected")
            {
                return BadRequest(new { message = "Cannot edit an approved or rejected application" });
            }

            application.FullName = updatedApplication.FullName;
            application.Email = updatedApplication.Email;
            application.ContactNumber = updatedApplication.ContactNumber;
            application.PreferredAssignedArea = updatedApplication.PreferredAssignedArea;
            application.PreferredWarehouse = updatedApplication.PreferredWarehouse;

            await context.SaveChangesAsync();
            return Ok(new { message = "Application updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobApplicant(int id)
        {
            try
            {
                logger.LogInformation("Attempting to delete JobApplicant with ID: {Id}", id);

                var jobApplicant = await context.JobApplicant.FindAsync(id);
                if (jobApplicant == null)
                {
                    logger.LogWarning("JobApplicant with ID: {Id} not found", id);
                    return NotFound();
                }

                context.JobApplicant.Remove(jobApplicant);
                await context.SaveChangesAsync();

                logger.LogInformation("Successfully deleted JobApplicant with ID: {Id}", id);
                return Ok(new
                {
                    message = "Staff rejected & deleted from JobApplicant table",
                    applicantName = jobApplicant.FullName,
                    applicantEmail = jobApplicant.Email
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when deleting job applicant with ID: {Id}", id);
                return StatusCode(500);
            }
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetJobApplicationsByUserId(int userId)
        {
            try
            {
                var jobApplications = await context.JobApplicant
                    .Where(j => j.UserId == userId) // ✅ Find all applications with this UserId
                    .ToListAsync(); // ✅ Convert to a list

                if (jobApplications == null || !jobApplications.Any()) // ✅ Check if empty
                {
                    return NotFound("No job applications found for this UserId.");
                }

                return Ok(jobApplications);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving job applications for User ID: {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("applicant/{id}")]
        public async Task<IActionResult> GetJobApplicantById(int id)
        {
            try
            {
                var jobApplicant = await context.JobApplicant.FindAsync(id);

                if (jobApplicant == null)
                {
                    return NotFound("Job applicant not found.");
                }

                return Ok(jobApplicant);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving job applicant with ID: {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }





    }
}

