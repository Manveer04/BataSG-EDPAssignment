using AutoMapper;
using Google.Apis.Admin.Directory.directory_v1;
using Google.Apis.Admin.Directory.directory_v1.Data;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NanoidDotNet;
using Newtonsoft.Json;
using System.Text;
using System.Security.Cryptography;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class FulfilmentStaffController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<FulfilmentStaffController> _logger;
        private readonly IWebHostEnvironment _environment;

        public FulfilmentStaffController(MyDbContext context, IMapper mapper, ILogger<FulfilmentStaffController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _environment = environment;
        }

        private static string GenerateSecurePassword(int length = 12)
        {
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string numbers = "0123456789";
            const string specialChars = "!@#$%^&*()-_=+<>?";

            string allChars = uppercase + lowercase + numbers + specialChars;
            RandomNumberGenerator rng = RandomNumberGenerator.Create();

            char[] password = new char[length];

            // Ensure password contains at least one of each required type
            password[0] = uppercase[RandomNumber(uppercase.Length)];
            password[1] = lowercase[RandomNumber(lowercase.Length)];
            password[2] = numbers[RandomNumber(numbers.Length)];
            password[3] = specialChars[RandomNumber(specialChars.Length)];

            // Fill the rest of the password randomly
            for (int i = 4; i < length; i++)
            {
                password[i] = allChars[RandomNumber(allChars.Length)];
            }

            // Shuffle the password to randomize character positions
            return new string(password.OrderBy(_ => RandomNumber(100)).ToArray());
        }

        // Helper function to generate a random number within a range
        private static int RandomNumber(int max)
        {
            byte[] randomBytes = new byte[1];
            RandomNumberGenerator.Fill(randomBytes);
            return randomBytes[0] % max;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(JobApplicant), StatusCodes.Status201Created)]
        public async Task<IActionResult> RegisterFulfilmentStaff([FromForm] RegisterFulfilmentStaffRequest request)
        {
            try
            {
                _logger.LogInformation("Received registration request for fulfillment staff: {@Request}", request);

                string resumeFileName = null;

                if (request.ResumeFile != null)
                {
                    _logger.LogInformation("Resume file detected. Validating size...");

                    if (request.ResumeFile.Length > 2 * 1024 * 1024)
                    {
                        _logger.LogWarning("Resume file exceeds maximum size (2MB)");
                        return BadRequest(new { message = "Maximum file size is 2MB" });
                    }

                    var id = Nanoid.Generate(size: 10);
                    resumeFileName = id + Path.GetExtension(request.ResumeFile.FileName);
                    var resumePath = Path.Combine(_environment.ContentRootPath, @"wwwroot/uploads", resumeFileName);

                    _logger.LogInformation("Saving resume file to: {ResumePath}", resumePath);

                    using var fileStream = new FileStream(resumePath, FileMode.Create);
                    await request.ResumeFile.CopyToAsync(fileStream);

                    _logger.LogInformation("Resume file saved successfully as: {ResumeFileName}", resumeFileName);
                }

                var jobApplicant = new JobApplicant
                {
                    JobRoleApplied = request.JobRoleApplied,
                    FullName = request.FullName,
                    Email = request.Email,
                    NRIC = request.NRIC,
                    ContactNumber = request.ContactNumber,
                    PreferredAssignedArea = request.PreferredAssignedArea,
                    PreferredWarehouse = request.PreferredWarehouse,
                    UserId = request.UserId,
                    ResumeFileName = resumeFileName,
                    Status = "Pending"
                };

                _logger.LogInformation("Created JobApplicant object: {@JobApplicant}", jobApplicant);

                await _context.JobApplicant.AddAsync(jobApplicant);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Job applicant saved to the database with ID: {ApplicantId}", jobApplicant.ApplicantId);

                return CreatedAtAction(nameof(GetJobApplicant), new { id = jobApplicant.ApplicantId }, jobApplicant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when registering job applicant: {ErrorMessage}", ex.Message);
                return StatusCode(500);
            }
        }




        [HttpPost("add")]
        [ProducesResponseType(typeof(FulfilmentStaff), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddFulfilmentStaff([FromForm] AddFulfilmentStaffRequestwithAdmin request)
        {
            try
            {
                string resumeFileName = null;

                if (request.ResumeFile != null)
                {
                    if (request.ResumeFile.Length > 2 * 1024 * 1024)
                    {
                        var message = "Maximum file size is 2MB";
                        return BadRequest(new { message });
                    }

                    var id = Nanoid.Generate(size: 10);
                    resumeFileName = id + Path.GetExtension(request.ResumeFile.FileName);
                    var resumePath = Path.Combine(_environment.ContentRootPath, @"wwwroot/uploads", resumeFileName);
                    using var fileStream = new FileStream(resumePath, FileMode.Create);
                    await request.ResumeFile.CopyToAsync(fileStream);
                }

                _logger.LogInformation("Creating StaffUser and FulfilmentStaff objects with the provided request data.");

                var staffUser = new Staff
                {
                    Username = request.FullName,
                    Password = request.Password,
                    //NRIC = request.NRIC,
                    Email = request.Email,
                    //PhoneNo = request.ContactNumber,
                    Role = "FulfilmentStaff",
                    //ResumeFileName = resumeFileName
                };

                //await _context.Staff.AddAsync(staffUser);
                await _context.SaveChangesAsync();

                var fulfilmentStaff = new FulfilmentStaff
                {
                    Status = "Active",
                    AssignedArea = request.AssignedArea,
                    WarehouseId = null, // Set appropriate value
                    //StaffId = staffUser.StaffId,
                    OrderId = null // Set default or appropriate value
                };

                await _context.FulfilmentStaffs.AddAsync(fulfilmentStaff);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetFulfilmentStaff), new { id = fulfilmentStaff.FulfilStaffId }, fulfilmentStaff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when adding fulfilment staff");
                return StatusCode(500);
            }
        }


        //[HttpPut("{id}/approve2")]
        //public async Task<IActionResult> ApproveJobApplicant2(int id, [FromBody] ApproveFulfilmentStaffRequest request)
        //{
        //    try
        //    {
        //        _logger.LogInformation("🔍 [ApproveJobApplicant] STARTED - Approving JobApplicant ID: {Id}", id);

        //        var jobApplicant = await _context.JobApplicant.FindAsync(id);
        //        if (jobApplicant == null)
        //        {
        //            _logger.LogWarning("⚠ [ApproveJobApplicant] JobApplicant with ID {Id} not found", id);
        //            return NotFound("JobApplicant not found.");
        //        }

        //        _logger.LogInformation("✅ [ApproveJobApplicant] JobApplicant found - Full Name: {FullName}, Email: {Email}, Role Applied: {Role}, WarehouseId: {WarehouseId}",
        //                               jobApplicant.FullName, jobApplicant.Email, jobApplicant.JobRoleApplied, jobApplicant.PreferredWarehouse);

        //        if (request.Approved)
        //        {
        //            // ✅ Generate a Google Workspace email
        //            string generatedEmail = $"{jobApplicant.FullName.Replace(" ", "").ToLower()}@batasg.cam";
        //            string tempPassword = "TempPassword123!";

        //            try
        //            {

        //                var credential = GoogleCredential.FromFile("learned-skill-450218-j4-fc111c983f58.json")
        //                    .CreateScoped(new[] { DirectoryService.Scope.AdminDirectoryUser });

        //                var service = new DirectoryService(new BaseClientService.Initializer()
        //                {
        //                    HttpClientInitializer = credential,
        //                    ApplicationName = "YourAppName"
        //                });

        //                string[] nameParts = jobApplicant.FullName.Split(" ");
        //                string givenName = nameParts[0];
        //                string familyName = nameParts.Length > 1 ? nameParts[1] : "Unknown"; // Default family name

        //                var newUser = new User
        //                {
        //                    Name = new UserName { GivenName = givenName, FamilyName = familyName },
        //                    PrimaryEmail = generatedEmail,
        //                    Password = tempPassword,
        //                    ChangePasswordAtNextLogin = true
        //                };

        //                var insertRequest = service.Users.Insert(newUser);
        //                var createdUser = insertRequest.Execute();

        //                await _context.SaveChangesAsync();


        //                _logger.LogInformation("📧 [ApproveJobApplicant] Generated email for staff: {GeneratedEmail}", generatedEmail);

        //                // ✅ Hash password securely before saving to `Staff`
        //                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(tempPassword);
        //                _logger.LogInformation("🔐 [ApproveJobApplicant] Password hashed successfully");

        //                // ✅ Save Staff in Staff Table (Including PhoneNumber)
        //                var staffUser = new Staff
        //                {
        //                    Username = jobApplicant.FullName,
        //                    Password = hashedPassword,
        //                    Email = generatedEmail,
        //                    PhoneNumber = jobApplicant.ContactNumber, // ✅ Store Phone Number
        //                    Role = "FulfilmentStaff"
        //                };

        //                await _context.Staffs.AddAsync(staffUser);
        //                await _context.SaveChangesAsync();

        //                _logger.LogInformation("✅ [ApproveJobApplicant] Staff record saved - ID: {StaffId}, Username: {Username}, Email: {Email}, Role: {Role}, Phone: {PhoneNumber}",
        //                                       staffUser.Id, staffUser.Username, staffUser.Email, staffUser.Role, staffUser.PhoneNumber);

        //                // ✅ Handle `PreferredWarehouse` being null
        //                int warehouseId = int.TryParse(jobApplicant.PreferredWarehouse, out var parsedWarehouseId) ? parsedWarehouseId : 0;


        //                // ✅ Save FulfilmentStaff and Link to Staff Table
        //                var fulfilmentStaff = new FulfilmentStaff
        //                {
        //                    StaffId = staffUser.Id, // ✅ Store StaffId properly
        //                    Status = "Approved",
        //                    AssignedArea = string.IsNullOrEmpty(jobApplicant.PreferredAssignedArea) ? "Unassigned" : jobApplicant.PreferredAssignedArea,
        //                    WarehouseId = warehouseId, // ✅ Store WarehouseId properly
        //                    OrderId = null,
        //                    AssignedOrdersCount = 0, // Default value
        //                    OnBreak = false // Default value
        //                };

        //                await _context.FulfilmentStaffs.AddAsync(fulfilmentStaff);
        //                await _context.SaveChangesAsync();

        //                _logger.LogInformation("✅ [ApproveJobApplicant] FulfilmentStaff record saved - ID: {FulfilmentStaffId}, StaffId: {StaffId}, Assigned Area: {AssignedArea}, WarehouseId: {WarehouseId}",
        //                                       fulfilmentStaff.FulfilStaffId, fulfilmentStaff.StaffId, fulfilmentStaff.AssignedArea, fulfilmentStaff.WarehouseId);

        //                //✅ Remove from JobApplicant table
        //                _context.JobApplicant.Remove(jobApplicant);
        //                await _context.SaveChangesAsync();

        //                _logger.LogInformation("🗑 [ApproveJobApplicant] JobApplicant record removed from database");

        //                await SendApprovalEmail(jobApplicant.FullName, generatedEmail, tempPassword, jobApplicant.Email);


        //                _logger.LogInformation("🎯 [ApproveJobApplicant] Process completed successfully for ID: {Id}", id);
        //                return Ok(new { message = "Staff approved & transferred to Staff table", email = staffUser.Email });
        //            }
        //            catch (Exception ex)
        //            {
        //                _logger.LogError("❌ [ApproveJobApplicant] Error creating staff account: {ExceptionMessage}", ex.Message);
        //                return StatusCode(500, "Error creating staff account.");
        //            }
        //        }

        //        _logger.LogWarning("⚠ [ApproveJobApplicant] Approval status not set to true for JobApplicant ID: {Id}", id);
        //        return BadRequest("Approval status not set to true.");
        //    }
        //    catch (DbUpdateException ex)
        //    {
        //        _logger.LogError("❌ [ApproveJobApplicant] Database update error: {ErrorMessage}", ex.InnerException?.Message ?? ex.Message);
        //        return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError("❌ [ApproveJobApplicant] Exception occurred during approval process: {ExceptionMessage}", ex.Message);
        //        return StatusCode(500);
        //    }
        //}


        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveJobApplicant(int id, [FromBody] ApproveFulfilmentStaffRequest request)
        {
            try
            {
                _logger.LogInformation("🔍 [ApproveJobApplicant] STARTED - Approving JobApplicant ID: {Id}", id);

                var jobApplicant = await _context.JobApplicant.FindAsync(id);
                if (jobApplicant == null)
                {
                    _logger.LogWarning("⚠ [ApproveJobApplicant] JobApplicant with ID {Id} not found", id);
                    return NotFound("JobApplicant not found.");
                }

                _logger.LogInformation("✅ [ApproveJobApplicant] JobApplicant found - Full Name: {FullName}, Email: {Email}, Role Applied: {Role}, WarehouseId: {WarehouseId}",
                                       jobApplicant.FullName, jobApplicant.Email, jobApplicant.JobRoleApplied, jobApplicant.PreferredWarehouse);

                if (request.Approved)
                {
                    // ✅ Generate a Google Workspace email
                    string generatedEmail = $"{jobApplicant.FullName.Replace(" ", "").ToLower()}@batasg.cam";
                    string tempPassword = GenerateSecurePassword();
                    _logger.LogInformation("🔐 [ApproveJobApplicant] Generated secure password: {TempPassword}", tempPassword);

                    try
                    {
                        _logger.LogInformation("📢 [Google API] Initializing Google Directory Service...");

                        var credential = GoogleCredential.FromFile("learned-skill-450218-j4-fc111c983f58.json")
                            .CreateScoped(new[] { DirectoryService.Scope.AdminDirectoryUser });

                        var service = new DirectoryService(new BaseClientService.Initializer()
                        {
                            HttpClientInitializer = credential,
                            ApplicationName = "YourAppName"
                        });

                        string[] nameParts = jobApplicant.FullName.Split(" ");
                        string givenName = nameParts[0];
                        string familyName = nameParts.Length > 1 ? nameParts[1] : "Unknown"; // Default family name

                        var newUser = new User
                        {
                            Name = new UserName { GivenName = givenName, FamilyName = familyName },
                            PrimaryEmail = generatedEmail,
                            Password = tempPassword,
                            ChangePasswordAtNextLogin = true
                        };

                        _logger.LogInformation("📢 [Google API] Creating user - Email: {Email}, Given Name: {GivenName}, Family Name: {FamilyName}",
                                               generatedEmail, givenName, familyName);

                        var insertRequest = service.Users.Insert(newUser);
                        var createdUser = insertRequest.Execute();

                        _logger.LogInformation("✅ [Google API] Google Workspace account created for {GeneratedEmail}", generatedEmail);

                        _logger.LogInformation("🔄 [ApproveJobApplicant] Saving changes to database...");

                        await _context.SaveChangesAsync();

                        _logger.LogInformation("📧 [ApproveJobApplicant] Generated email for staff: {GeneratedEmail}", generatedEmail);

                        // ✅ Hash password securely before saving to `Staff`
                        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(tempPassword);
                        _logger.LogInformation("🔐 [ApproveJobApplicant] Password hashed successfully");

                        // ✅ Save Staff in Staff Table
                        var staffUser = new Staff
                        {
                            Username = jobApplicant.FullName,
                            Password = hashedPassword,
                            Email = generatedEmail,
                            PhoneNumber = jobApplicant.ContactNumber,
                            Role = "FulfilmentStaff"
                        };

                        _logger.LogInformation("📝 [ApproveJobApplicant] Creating Staff record - Username: {Username}, Email: {Email}, Role: {Role}, Phone: {PhoneNumber}",
                                               staffUser.Username, staffUser.Email, staffUser.Role, staffUser.PhoneNumber);

                        await _context.Staffs.AddAsync(staffUser);
                        _logger.LogInformation("✅ [ApproveJobApplicant] Staff added to database. Pending save...");

                        await _context.SaveChangesAsync();

                        _logger.LogInformation("✅ [ApproveJobApplicant] Staff record saved - ID: {StaffId}, Username: {Username}, Email: {Email}, Role: {Role}, Phone: {PhoneNumber}",
                                               staffUser.Id, staffUser.Username, staffUser.Email, staffUser.Role, staffUser.PhoneNumber);


                        // ✅ Handle `PreferredWarehouse` being null
                        int warehouseId = int.TryParse(jobApplicant.PreferredWarehouse, out var parsedWarehouseId) ? parsedWarehouseId : 0;

                        // ✅ Save FulfilmentStaff and Link to Staff Table
                        var fulfilmentStaff = new FulfilmentStaff
                        {
                            StaffId = staffUser.Id,
                            Status = "Approved",
                            AssignedArea = string.IsNullOrEmpty(jobApplicant.PreferredAssignedArea) ? "Unassigned" : jobApplicant.PreferredAssignedArea,
                            WarehouseId = warehouseId,
                            OrderId = null,
                            AssignedOrdersCount = 0,
                            OnBreak = false
                        };

                        _logger.LogInformation("📝 [ApproveJobApplicant] Creating FulfilmentStaff record - StaffId: {StaffId}, Status: {Status}, Assigned Area: {AssignedArea}, WarehouseId: {WarehouseId}",
                                               fulfilmentStaff.StaffId, fulfilmentStaff.Status, fulfilmentStaff.AssignedArea, fulfilmentStaff.WarehouseId);

                        await _context.FulfilmentStaffs.AddAsync(fulfilmentStaff);
                        _logger.LogInformation("✅ [ApproveJobApplicant] FulfilmentStaff added to database. Pending save...");

                        await _context.SaveChangesAsync();

                        _logger.LogInformation("✅ [ApproveJobApplicant] FulfilmentStaff record saved - ID: {FulfilStaffId}, StaffId: {StaffId}, Assigned Area: {AssignedArea}, WarehouseId: {WarehouseId}",
                                               fulfilmentStaff.FulfilStaffId, fulfilmentStaff.StaffId, fulfilmentStaff.AssignedArea, fulfilmentStaff.WarehouseId);

                        //✅ Remove from JobApplicant table
                        _logger.LogInformation("🗑 [ApproveJobApplicant] Removing JobApplicant record...");
                        _context.JobApplicant.Remove(jobApplicant);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("✅ [ApproveJobApplicant] JobApplicant record removed from database");


                        _logger.LogInformation("🎯 [ApproveJobApplicant] Process completed successfully for ID: {Id}", id);
                        return Ok(new
                        {
                            message = "Staff approved & transferred to Staff table",
                            applicantName = jobApplicant.FullName,
                            applicantEmail = jobApplicant.Email,
                            newCompanyEmail = generatedEmail,
                            tempPassword = tempPassword
                        });
                    }
                    catch (DbUpdateException dbEx)
                    {
                        _logger.LogError("❌ [Database Error] Could not save changes. Error: {DbExceptionMessage}", dbEx.InnerException?.Message ?? dbEx.Message);
                        return StatusCode(500, "Database error: Could not save changes.");
                    }
                    catch (Google.GoogleApiException googleEx)
                    {
                        _logger.LogError("❌ [Google API Error] Failed to create Google account. Error: {GoogleExceptionMessage}", googleEx.Message);
                        return StatusCode(500, "Google API error: Could not create staff email.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("❌ [ApproveJobApplicant] Unexpected error: {ExceptionMessage}", ex.Message);
                        return StatusCode(500, "Unexpected error occurred.");
                    }
                }

                return BadRequest("Approval flag is not set.");
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ [ApproveJobApplicant] Critical error: {ExceptionMessage}", ex.Message);
                return StatusCode(500, "Critical error occurred.");
            }
        }


        private async Task SendApprovalEmail2(string fullName, string newEmail, string tempPassword, string applicantEmail)
        {
            using (HttpClient client = new HttpClient())
            {
                var payload = new
                {
                    service_id = "service_x3j7dtj",
                    template_id = "template_y78ejiw",
                    user_id = "_cnYQaIjdvT0VUtfLGa5O",
                    template_params = new
                    {
                        to_name = fullName,
                        to_email = applicantEmail, // ✅ Send to applicant's personal email
                        new_email = newEmail, // ✅ Show the newly generated company email
                        temp_password = tempPassword,
                    }
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ [SendApprovalEmail] Failed to send email: {Status}", response.StatusCode);
                }
            }
        }

        private async Task SendApprovalEmail(string fullName, string newEmail, string tempPassword, string applicantEmail)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    _logger.LogInformation("📨 [SendApprovalEmail] Preparing email payload...");

                    var payload = new
                    {
                        service_id = "service_x3j7dtj",
                        template_id = "template_y78ejiw",
                        user_id = "oDchvzUuR7Lp73KT5",
                        template_params = new
                        {
                            to_name = fullName,
                            to_email = applicantEmail, // ✅ Send to applicant's personal email
                            new_email = newEmail, // ✅ Show the newly generated company email
                            temp_password = tempPassword,
                        }
                    };

                    var json = JsonConvert.SerializeObject(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    _logger.LogInformation("📤 [SendApprovalEmail] Sending email to {ApplicantEmail} - New Email: {NewEmail}", applicantEmail, newEmail);
                    _logger.LogDebug("📧 [SendApprovalEmail] Payload: {Payload}", json);

                    var response = await client.PostAsync("https://api.emailjs.com/api/v1.0/email/send", content);

                    if (!response.IsSuccessStatusCode)
                    {
                        string responseContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("❌ [SendApprovalEmail] Failed to send email - Status: {StatusCode}, Response: {ResponseContent}",
                                         response.StatusCode, responseContent);
                    }
                    else
                    {
                        _logger.LogInformation("✅ [SendApprovalEmail] Email successfully sent to {ApplicantEmail}", applicantEmail);
                    }
                }
            }
            catch (HttpRequestException httpEx)
            {
                _logger.LogError("❌ [SendApprovalEmail] HTTP Request error: {HttpRequestExceptionMessage}", httpEx.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ [SendApprovalEmail] Unexpected error: {ExceptionMessage}", ex.Message);
            }
        }






        [HttpPost("assignorder/auto")]
        public async Task<IActionResult> AutoAssignOrder([FromBody] int orderId)
        {
            try
            {
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return NotFound();
                }

                var availableStaff = await _context.FulfilmentStaffs
                    .Where(fs => !fs.OnBreak && fs.AssignedOrdersCount < 5)
                    .OrderBy(fs => fs.AssignedOrdersCount)
                    .FirstOrDefaultAsync();

                if (availableStaff != null)
                {
                    availableStaff.AssignedOrdersCount++;
                    //order.AssignedStaffId = availableStaff.StaffId;
                    //order.OrderStatus = OrderStatus.Assigned;

                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Order {orderId} assigned to staff {availableStaff.StaffId}");
                }
                else
                {
                    _logger.LogInformation($"No available staff for order {orderId}. Order remains in queue.");
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when auto-assigning order");
                return StatusCode(500);
            }
        }

        //[HttpPut("assignorder/manual"), Authorize(Roles = "Admin")]
        //public async Task<IActionResult> ManualAssignOrder([FromBody] AssignOrderRequestFulfilment request)
        //{
        //    try
        //    {
        //        var order = await _context.Orders.FindAsync(request.OrderId);
        //        if (order == null)
        //        {
        //            return NotFound();
        //        }

        //        var fulfilmentStaff = await _context.FulfilmentStaffs.FindAsync(request.StaffId);
        //        if (fulfilmentStaff == null || fulfilmentStaff.OnBreak || fulfilmentStaff.AssignedOrdersCount >= 5)
        //        {
        //            return BadRequest("Staff is either not available or at full capacity.");
        //        }

        //        fulfilmentStaff.AssignedOrdersCount++;
        //        order.AssignedStaffId = fulfilmentStaff.StaffId;
        //        order.OrderStatus = OrderStatus.Assigned;

        //        await _context.SaveChangesAsync();
        //        _logger.LogInformation($"Order {request.OrderId} manually assigned to staff {fulfilmentStaff.StaffId}");

        //        return Ok();
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error when manually assigning order");
        //        return StatusCode(500);
        //    }
        //}

        [HttpPut("order/{orderId}/pack")]
        public async Task<IActionResult> PackOrder(int orderId)
        {
            try
            {
                _logger.LogInformation("PackOrder called with orderId: {OrderId}", orderId);

                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    _logger.LogWarning("Order with orderId: {OrderId} not found", orderId);
                    return NotFound();
                }

                if (order.OrderStatus != OrderStatus.Processing)
                {
                    _logger.LogWarning("Order with orderId: {OrderId} is not in Processing status. Current status: {OrderStatus}", orderId, order.OrderStatus);
                    return BadRequest("Order must be in Processing status to be packed.");
                }

                order.OrderStatus = OrderStatus.Shipped;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Order {OrderId} status updated to Shipped.", orderId);

                // Automatically update to Out for Delivery if assigned to a delivery agent
                //var deliveryAgent = await _context.DeliveryAgents.FirstOrDefaultAsync(da => da.OrderId == orderId);
                //if (deliveryAgent != null)
                //{
                //    order.OrderStatus = OrderStatus.Shipped;
                //    await _context.SaveChangesAsync();
                //    _logger.LogInformation("Order {OrderId} status updated to Out for Delivery.", orderId);
                //}

                return Ok(order);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error when packing order with orderId: {OrderId}", orderId);
                return StatusCode(500, "Database update error.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error when packing order with orderId: {OrderId}", orderId);
                return StatusCode(500, "Unexpected error.");
            }
        }

        [HttpPut("order/{orderId}/unpack")]
        public async Task<IActionResult> UnpackOrder(int orderId)
        {
            try
            {
                _logger.LogInformation("UnpackOrder called with orderId: {OrderId}", orderId);

                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    _logger.LogWarning("Order with orderId: {OrderId} not found", orderId);
                    return NotFound(new { message = $"Order with ID {orderId} not found." });
                }

                if (order.OrderStatus != OrderStatus.Shipped)
                {
                    _logger.LogWarning("Order with orderId: {OrderId} is not in Shipped status. Current status: {OrderStatus}", orderId, order.OrderStatus);
                    return BadRequest(new { message = "Order must be in Shipped status to be unpacked." });
                }

                order.OrderStatus = OrderStatus.Processing;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Order {OrderId} status updated to Processing.", orderId);

                //var deliveryAgent = await _context.DeliveryAgents.FirstOrDefaultAsync(da => da.OrderIds == orderId);
                //if (deliveryAgent != null)
                //{
                //    order.OrderStatus = OrderStatus.Processing;
                //    await _context.SaveChangesAsync();
                //    _logger.LogInformation("Order {OrderId} status updated to Processing.", orderId);
                //}

                return Ok(order);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error when unpacking order with orderId: {OrderId}", orderId);
                return StatusCode(500, new { message = "Database update error." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error when unpacking order with orderId: {OrderId}", orderId);
                return StatusCode(500, new { message = "Unexpected error." });
            }
        }


        //[HttpGet]
        //[ProducesResponseType(typeof(IEnumerable<FulfilmentStaffDTO>), StatusCodes.Status200OK)]
        //public async Task<IActionResult> GetAllFulfilmentStaffs()
        //{
        //    try
        //    {
        //        var fulfilmentStaffs = await _context.FulfilmentStaffs
        //            .Join(
        //                _context.Staff,
        //                fs => fs.StaffId,
        //                su => su.StaffId,
        //                (fs, su) => new FulfilmentStaffDTO
        //                {
        //                    FulfilStaffId = fs.FulfilStaffId,
        //                    Status = fs.Status,
        //                    WarehouseId = fs.WarehouseId,
        //                    StaffId = fs.StaffId,
        //                    OrderId = fs.OrderId,
        //                    Username = su.Username,
        //                    Email = su.Email,
        //                    AssignedArea = fs.AssignedArea,
        //                    PhoneNo = su.PhoneNo,
        //                    Role = su.Role
        //                }
        //            )
        //            .ToListAsync();

        //        return Ok(fulfilmentStaffs);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error when getting all fulfilment staffs");
        //        return StatusCode(500);
        //    }
        //}


        [HttpGet("{id}")]
        [ProducesResponseType(typeof(FulfilmentStaff), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFulfilmentStaff(int id)
        {
            try
            {
                var fulfilmentStaff = await _context.FulfilmentStaffs.FindAsync(id);
                if (fulfilmentStaff == null)
                {
                    return NotFound();
                }

                return Ok(fulfilmentStaff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting fulfilment staff by id");
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFulfilmentStaff(int id)
        {
            try
            {

                var fulfilmentStaff = await _context.FulfilmentStaffs.FindAsync(id);
                if (fulfilmentStaff == null)
                {
                    return NotFound();
                }

                _context.FulfilmentStaffs.Remove(fulfilmentStaff);
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when deleting fulfilment staff");
                return StatusCode(500);
            }
        }

        [HttpGet("{staffId}/orders")]
        public async Task<IActionResult> GetAssignedOrders(int staffId)
        {
            _logger.LogInformation("Fetching assigned orders for staff with ID: {StaffId}", staffId);

            try
            {
                var fulfilmentStaff = await _context.FulfilmentStaffs
                    .FirstOrDefaultAsync(fs => fs.StaffId == staffId);

                if (fulfilmentStaff == null)
                {
                    _logger.LogWarning("Fulfilment staff with Staff ID {StaffId} not found.", staffId);
                    Console.WriteLine($"Response: 404 - Fulfilment staff with Staff ID {staffId} not found.");
                    return NotFound("Fulfilment staff not found.");
                }

                var orders = await _context.Orders
                    .Where(o => o.FulfilmentStaffId == fulfilmentStaff.FulfilStaffId)
                    .ToListAsync();

                if (orders == null || !orders.Any())
                {
                    _logger.LogInformation("No orders assigned to staff with ID: {StaffId}", staffId);
                    Console.WriteLine($"Response: 200 - No orders assigned to staff with ID: {staffId}");
                    Console.WriteLine($"Response: 200 - No orders assigned to Fulfilmentstaff with ID: {fulfilmentStaff.FulfilStaffId}");
                    return Ok(new { message = "No orders assigned." });
                }

                _logger.LogInformation("Orders found for staff with ID: {StaffId}. Orders: {@Orders}", staffId, orders);
                Console.WriteLine($"Response: 200 - Orders found for staff with ID: {staffId}. Orders: {orders}");
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when fetching assigned orders for staff with ID: {StaffId}", staffId);
                Console.WriteLine($"Response: 500 - Error when fetching assigned orders for staff with ID: {staffId}. Exception: {ex.Message}");
                return StatusCode(500);
            }
        }








        [HttpGet("jobapplicant/{id}")]
        [ProducesResponseType(typeof(JobApplicant), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetJobApplicant(int id)
        {
            try
            {
                var jobApplicant = await _context.JobApplicant.FindAsync(id);
                if (jobApplicant == null)
                {
                    return NotFound();
                }

                return Ok(jobApplicant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error when getting job applicant by id");
                return StatusCode(500);
            }
        }
    }
}
