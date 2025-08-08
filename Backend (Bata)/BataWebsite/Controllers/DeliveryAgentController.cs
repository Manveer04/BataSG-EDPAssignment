using AutoMapper;
using Google.Apis.Admin.Directory.directory_v1;
using Google.Apis.Admin.Directory.directory_v1.Data;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using BataWebsite.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Xml;
using System.Security.Cryptography;

namespace BataWebsite.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DeliveryAgentController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<DeliveryAgentController> _logger;
        private readonly IConfiguration _configuration;

        public DeliveryAgentController(MyDbContext context, IMapper mapper, ILogger<DeliveryAgentController> logger, IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _configuration = configuration;
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

        [HttpPost("apply")]
        [ProducesResponseType(typeof(JobApplicant), StatusCodes.Status201Created)]
        public async Task<IActionResult> ApplyDeliveryAgent([FromForm] AddDeliveryAgentRequest request)
        {
            try
            {
                _logger.LogInformation("🚀 Processing new Delivery Agent application...");

                string? driverLicenseFileName = null;
                string? vrcFileName = null;

                string uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");

                // ✅ Ensure the upload directory exists
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                // ✅ Handle Driver's License Upload
                if (request.DriverLicenseFile != null)
                {
                    var uniqueId = NanoidDotNet.Nanoid.Generate(size: 10);
                    driverLicenseFileName = uniqueId + Path.GetExtension(request.DriverLicenseFile.FileName);
                    var filePath = Path.Combine(uploadPath, driverLicenseFileName);
                    using var fileStream = new FileStream(filePath, FileMode.Create);
                    await request.DriverLicenseFile.CopyToAsync(fileStream);
                }

                // ✅ Handle VRC Upload (If someone else's vehicle)
                if (request.VehicleOwnership == "someoneElse" && request.VrcFile != null)
                {
                    var uniqueId = NanoidDotNet.Nanoid.Generate(size: 10);
                    vrcFileName = uniqueId + Path.GetExtension(request.VrcFile.FileName);
                    var vrcFilePath = Path.Combine(uploadPath, vrcFileName);
                    using var fileStream = new FileStream(vrcFilePath, FileMode.Create);
                    await request.VrcFile.CopyToAsync(fileStream);
                }

                // ✅ Create JobApplicant Entry
                var jobApplicant = new JobApplicant
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    NRIC = request.NRIC,
                    UserId = request.UserId,
                    ContactNumber = request.ContactNumber,
                    JobRoleApplied = "DeliveryAgent",
                    VehicleNumber = request.VehicleNumber,
                    VehicleType = request.VehicleType,
                    AvailabilityStatus = request.AvailabilityStatus,
                    PostalCode = request.PostalCode,
                    VehicleOwnership = request.VehicleOwnership,
                    OwnerFullName = request.VehicleOwnership == "someoneElse" ? request.OwnerFullName : null,
                    DriverLicenseFileName = driverLicenseFileName,
                    VehicleRegistrationCertificate = vrcFileName,
                    Status = "Pending"
                };

                // ✅ Save to the JobApplicant Table
                await _context.JobApplicant.AddAsync(jobApplicant);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Delivery Agent application submitted successfully.");

                return CreatedAtAction(nameof(GetJobApplicant), new { id = jobApplicant.ApplicantId }, jobApplicant);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when applying as Delivery Agent: {ExceptionMessage}", ex.Message);
                return StatusCode(500, "Error when applying as Delivery Agent");
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApprovedeliveryAgent(int id, [FromBody] ApproveDeliveryAgentRequest request)
        {
            try
            {
                _logger.LogInformation("🔍 [ApprovedeliveryAgent] STARTED - Approving deliveryAgent Applicant ID: {Id}", id);

                // Find the job applicant
                var jobApplicant = await _context.JobApplicant.FindAsync(id);
                if (jobApplicant == null)
                {
                    _logger.LogWarning("⚠ [ApprovedeliveryAgent] JobApplicant with ID {Id} not found", id);
                    return NotFound("JobApplicant not found.");
                }

                _logger.LogInformation("✅ [ApprovedeliveryAgent] JobApplicant found - Full Name: {FullName}, Email: {Email}, Role Applied: {Role}, VehicleType: {VehicleType}",
                                       jobApplicant.FullName, jobApplicant.Email, jobApplicant.JobRoleApplied, jobApplicant.VehicleType);

                if (request.Approved)
                {
                    // ✅ Generate a Google Workspace email
                    string generatedEmail = $"{jobApplicant.FullName.Replace(" ", "").ToLower()}@batasg.cam";
                    string tempPassword = GenerateSecurePassword();
                    _logger.LogInformation("🔐 [ApproveJobApplicant] Generated secure password: {TempPassword}", tempPassword);

                    try
                    {
                        // Create Google Workspace account
                        var credential = GoogleCredential.FromFile("learned-skill-450218-j4-fc111c983f58.json")
                            .CreateScoped(new[] { DirectoryService.Scope.AdminDirectoryUser });

                        var service = new DirectoryService(new BaseClientService.Initializer()
                        {
                            HttpClientInitializer = credential,
                            ApplicationName = "YourAppName"
                        });

                        // ✅ Fix: Handle single-word names properly
                        string[] nameParts = jobApplicant.FullName.Split(" ");
                        string givenName = nameParts[0].Trim();
                        string familyName = nameParts.Length > 1 ? nameParts[1].Trim() : "Unknown"; // Default family name

                        // Validate givenName and familyName
                        if (string.IsNullOrWhiteSpace(givenName) || givenName.Any(char.IsDigit) || givenName.Length < 2)
                        {
                            _logger.LogError("Invalid Given Name: {GivenName}", givenName);
                            return BadRequest("Invalid Given Name.");
                        }

                        if (string.IsNullOrWhiteSpace(familyName) || familyName.Any(char.IsDigit) || familyName.Length < 2)
                        {
                            _logger.LogError("Invalid Family Name: {FamilyName}", familyName);
                            return BadRequest("Invalid Family Name.");
                        }

                        var newUser = new User
                        {
                            Name = new UserName { GivenName = givenName, FamilyName = familyName },
                            PrimaryEmail = generatedEmail,
                            Password = tempPassword,
                            ChangePasswordAtNextLogin = true
                        };



                        var insertRequest = service.Users.Insert(newUser);
                        var createdUser = insertRequest.Execute();

                        _logger.LogInformation("📧 [ApprovedeliveryAgent] Generated email for staff: {GeneratedEmail}", generatedEmail);

                        // ✅ Hash password securely before saving to `Staff`
                        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(tempPassword);
                        _logger.LogInformation("🔐 [ApprovedeliveryAgent] Password hashed successfully");

                        // ✅ Save Staff in Staff Table (Including PhoneNumber)
                        var staffUser = new Staff
                        {
                            Username = jobApplicant.FullName,
                            Password = hashedPassword,
                            Email = generatedEmail,
                            PhoneNumber = jobApplicant.ContactNumber, // ✅ Store Phone Number
                            Role = "deliveryAgent"
                        };

                        await _context.Staffs.AddAsync(staffUser);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation("✅ [ApprovedeliveryAgent] Staff record saved - ID: {StaffId}, Username: {Username}, Email: {Email}, Role: {Role}, Phone: {PhoneNumber}",
                                               staffUser.Id, staffUser.Username, staffUser.Email, staffUser.Role, staffUser.PhoneNumber);

                        // ✅ Save deliveryAgent and Link to Staff Table
                        var deliveryAgent = new DeliveryAgent
                        {
                            StaffId = staffUser.Id, // ✅ Store StaffId properly
                            VehicleNumber = jobApplicant.VehicleNumber,
                            AvailabilityStatus = true, // Default to available
                            VehicleType = jobApplicant.VehicleType
                        };

                        await _context.DeliveryAgents.AddAsync(deliveryAgent);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation("✅ [ApprovedeliveryAgent] deliveryAgent record saved - ID: {deliveryAgentId}, StaffId: {StaffId}, VehicleNumber: {VehicleNumber}, VehicleType: {VehicleType}",
                                               deliveryAgent.AgentId, deliveryAgent.StaffId, deliveryAgent.VehicleNumber, deliveryAgent.VehicleType);

                        //✅ Remove from JobApplicant table(optional)
                        _context.JobApplicant.Remove(jobApplicant);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation("🗑 [ApprovedeliveryAgent] JobApplicant record removed from database");

                        _logger.LogInformation("🎯 [ApprovedeliveryAgent] Process completed successfully for ID: {Id}", id);
                        return Ok(new
                        {
                            message = "Staff approved & transferred to Staff table",
                            applicantName = jobApplicant.FullName,
                            applicantEmail = jobApplicant.Email,
                            newCompanyEmail = generatedEmail,
                            tempPassword = tempPassword
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError("❌ [ApprovedeliveryAgent] Error creating delivery staff account: {ExceptionMessage}", ex.Message);
                        return StatusCode(500, "Error creating delivery staff account.");
                    }
                }
                else
                {
                    _logger.LogInformation("❌ [ApprovedeliveryAgent] Approval not granted for ID: {Id}", id);
                    return BadRequest("Approval not granted.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ [ApprovedeliveryAgent] Unexpected error: {ExceptionMessage}", ex.Message);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }


        //[HttpPost, Authorize(Roles = "Admin")]
        //[ProducesResponseType(typeof(DeliveryAgentDTO), StatusCodes.Status201Created)]
        //public async Task<IActionResult> AddDeliveryAgent(AddDeliveryAgentRequest request)
        //{
        //    try
        //    {
        //        _logger.LogInformation("🚀 Adding new Delivery Agent...");

        //        var deliveryAgent = new DeliveryAgent
        //        {
        //            VehicleNumber = request.VehicleNumber,
        //            AvailabilityStatus = request.AvailabilityStatus,
        //            VehicleType = request.VehicleType,
        //            StaffId = request.StaffId,
        //            DeliveryId = request.DeliveryId
        //        };

        //        await _context.DeliveryAgents.AddAsync(deliveryAgent);
        //        await _context.SaveChangesAsync();

        //        var deliveryAgentDTO = _mapper.Map<DeliveryAgentDTO>(deliveryAgent);

        //        _logger.LogInformation("✅ Delivery Agent added successfully.");
        //        return CreatedAtAction(nameof(GetDeliveryAgent), new { id = deliveryAgent.AgentId }, deliveryAgentDTO);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError("❌ Error when adding delivery agent: {ExceptionMessage}", ex.Message);
        //        return StatusCode(500);
        //    }
        //}

        [HttpGet("vehicle-info")]
        public async Task<IActionResult> GetVehicleInfo([FromQuery] string registrationNumber)
        {
            try
            {
                string username = _configuration.GetValue<string>("CarRegistration:Username");
                if (string.IsNullOrEmpty(username))
                    throw new Exception("CarRegistration API username is missing.");

                // Construct SOAP request
                var soapEnvelope = $@"
        <soap12:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' 
            xmlns:xsd='http://www.w3.org/2001/XMLSchema' 
            xmlns:soap12='http://www.w3.org/2003/05/soap-envelope'>
            <soap12:Body>
                <CheckSingapore xmlns='http://regcheck.org.uk'>
                    <RegistrationNumber>{registrationNumber}</RegistrationNumber>
                    <username>{username}</username>
                </CheckSingapore>
            </soap12:Body>
        </soap12:Envelope>";

                // Send SOAP request
                using var client = new HttpClient();
                var content = new StringContent(soapEnvelope, Encoding.UTF8, "application/soap+xml");
                var response = await client.PostAsync("https://sg.carregistrationapi.com/api/reg.asmx", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Error response from CarRegistration API: {errorResponse}");
                    return StatusCode((int)response.StatusCode, new { message = "Error fetching vehicle info from external API", error = errorResponse });
                }

                // Read response
                var responseXml = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"SOAP Response: {responseXml}");  // Log raw XML response

                // Parse XML response
                var xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(responseXml);

                // Handle SOAP namespaces
                XmlNamespaceManager nsmgr = new XmlNamespaceManager(xmlDoc.NameTable);
                nsmgr.AddNamespace("soap", "http://www.w3.org/2003/05/soap-envelope");
                nsmgr.AddNamespace("reg", "http://regcheck.org.uk");

                // Extract CheckSingaporeResult
                var resultNode = xmlDoc.SelectSingleNode("//soap:Body/reg:CheckSingaporeResponse/reg:CheckSingaporeResult", nsmgr);
                if (resultNode == null)
                {
                    throw new Exception("Could not find CheckSingaporeResult in the response.");
                }

                // Extract JSON vehicle data from <vehicleJson>
                var vehicleJsonNode = resultNode.SelectSingleNode("reg:vehicleJson", nsmgr);
                VehicleJsonResponse jsonResponse = null;

                if (vehicleJsonNode != null)
                {
                    string vehicleJson = vehicleJsonNode.InnerText;
                    _logger.LogInformation($"Extracted vehicleJson: {vehicleJson}"); // Log JSON

                    jsonResponse = System.Text.Json.JsonSerializer.Deserialize<VehicleJsonResponse>(vehicleJson);

                    _logger.LogInformation($"Json Response {System.Text.Json.JsonSerializer.Serialize(jsonResponse)}");
                }

                // Extract additional vehicle data from <vehicleData>
                var vehicleData = new VehicleDataRequest
                {
                    Description = jsonResponse?.Description ?? resultNode.SelectSingleNode("reg:vehicleData/reg:Description", nsmgr)?.InnerText ?? "N/A",
                    RegistrationYear = jsonResponse?.RegistrationYear ?? resultNode.SelectSingleNode("reg:vehicleData/reg:RegistrationYear", nsmgr)?.InnerText ?? "N/A",
                    MakeDescription = jsonResponse?.MakeDescription?.CurrentTextValue ?? resultNode.SelectSingleNode("reg:vehicleData/reg:CarMake/reg:CurrentTextValue", nsmgr)?.InnerText ?? "N/A",
                    ModelDescription = jsonResponse?.ModelDescription?.CurrentTextValue ?? resultNode.SelectSingleNode("reg:vehicleData/reg:CarModel", nsmgr)?.InnerText ?? "N/A",
                    FuelType = jsonResponse?.CarMake?.CurrentTextValue ?? "N/A",
                    TaxExpiry = jsonResponse?.TaxExpiry ?? "N/A",
                    ImageUrl = jsonResponse?.ImageUrl ?? "N/A"
                };

                _logger.LogInformation($"Final Extracted Vehicle Data: {System.Text.Json.JsonSerializer.Serialize(vehicleData)}");

                return Ok(vehicleData);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving vehicle data: {ex}");
                return StatusCode(500, new { message = "Error fetching vehicle info", error = ex.Message });
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
                _logger.LogError(ex, "Error when retrieving job applicant by ID");
                return StatusCode(500, "Internal Server Error");
            }
        }


        [HttpPut("{id}/assignorder"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignOrderToDeliveryAgent(int id, AssignOrderRequestDelivery request)
        {
            try
            {
                var deliveryAgent = await _context.DeliveryAgents.FindAsync(id);
                if (deliveryAgent == null)
                {
                    return NotFound();
                }

                deliveryAgent.DeliveryId = request.DeliveryId;
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when assigning order to delivery agent: {ExceptionMessage}", ex.Message);
                return StatusCode(500);
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<DeliveryAgentDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllDeliveryAgents()
        {
            try
            {
                var deliveryAgents = await _context.DeliveryAgents.ToListAsync();
                var deliveryAgentDTOs = deliveryAgents.Select(_mapper.Map<DeliveryAgentDTO>);
                return Ok(deliveryAgentDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when getting all delivery agents: {ExceptionMessage}", ex.Message);
                return StatusCode(500);
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(DeliveryAgentDTO), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDeliveryAgent(int id)
        {
            try
            {
                var deliveryAgent = await _context.DeliveryAgents.FindAsync(id);
                if (deliveryAgent == null)
                {
                    return NotFound();
                }

                var deliveryAgentDTO = _mapper.Map<DeliveryAgentDTO>(deliveryAgent);
                return Ok(deliveryAgentDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when getting delivery agent by ID: {ExceptionMessage}", ex.Message);
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDeliveryAgent(int id)
        {
            try
            {
                var deliveryAgent = await _context.DeliveryAgents.FindAsync(id);
                if (deliveryAgent == null)
                {
                    return NotFound();
                }

                _context.DeliveryAgents.Remove(deliveryAgent);
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error when deleting delivery agent: {ExceptionMessage}", ex.Message);
                return StatusCode(500);
            }
        }
    }
}
