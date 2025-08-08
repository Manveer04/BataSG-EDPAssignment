import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Link, FormControl, InputLabel, Select, MenuItem, Collapse
} from '@mui/material';
import { CheckCircle, Cancel, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import http from '../http';
import emailjs from 'emailjs-com';

const JobApplicationsPage = () => {
    const [applications, setApplications] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedJobRole, setSelectedJobRole] = useState('All');
    const [expandedRows, setExpandedRows] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appRes, warehouseRes] = await Promise.all([
                    http.get(`/JobApplicant/all`),
                    http.get("/Warehouse")
                ]);

                console.log("📥 Job Application Response:", appRes.data);
                console.log("📦 Warehouse Response:", warehouseRes.data);

                setApplications(appRes.data);
                setWarehouses(warehouseRes.data);
            } catch (error) {
                console.error("❌ Error fetching applications or warehouses:", error);
            }
        };

        fetchData();
    }, []);

    const sendApprovalEmail = async ({ applicantName, applicantEmail, newCompanyEmail, tempPassword }) => {
        try {
            const response = await emailjs.send(
                "service_x3j7dtj", 
                "template_y78ejiw", 
                {
                    to_name: applicantName,
                    to_email: applicantEmail, 
                    new_email: newCompanyEmail, 
                    temp_password: tempPassword
                },
                "oDchvzUuR7Lp73KT5"
            );
    
            console.log("✅ Email sent successfully:", response);
            // alert("Approval email sent successfully!");
        } catch (error) {
            console.error("❌ Error sending email:", error);
            // alert("Failed to send approval email.");
        }
    };
    
    // const sendRejectionEmail = async ({ applicantName, applicantEmail }) => {
    //     try {
    //         const response = await emailjs.send(
    //             "service_x3j7dtj", 
    //             "template_ou181zl", 
    //             {
    //                 to_name: applicantName,
    //                 to_email: applicantEmail
    //             },
    //             "oDchvzUuR7Lp73KT5"
    //         );
    
    //         console.log("✅ Email sent successfully:", response);
    //         // alert("Approval email sent successfully!");
    //     } catch (error) {
    //         console.error("❌ Error sending email:", error);
    //         // alert("Failed to send approval email.");
    //     }
    // };  

    const sendRejectionEmail = async ({ applicantName, applicantEmail }) => {
        try {
            const response = await emailjs.send(
                "service_x3j7dtj", 
                "template_ou181zl", 
                {
                    to_name: applicantName,
                    to_email: applicantEmail
                },
                "oDchvzUuR7Lp73KT5"
            );
    
            console.log("✅ Rejection email sent successfully:", response);
            alert("Rejection email sent successfully!");
        } catch (error) {
            console.error("❌ Error sending rejection email:", error);
            alert("Failed to send rejection email.");
        }
    };
    

    const handleAcceptFulfilmentStaff = async (id) => {
        try {
            const response = await http.put(`/FulfilmentStaff/${id}/approve`, { approved: true }, {
                headers: { 'Content-Type': 'application/json' }
            });
    
            console.log(`✅ Accepted application with ID: ${id}`, response.data);
    
            // Extract email details from backend response
            const { applicantName, applicantEmail, newCompanyEmail, tempPassword } = response.data;
    
            // ✅ Send email from frontend using EmailJS
            await sendApprovalEmail({ applicantName, applicantEmail, newCompanyEmail, tempPassword });
    
            // Refresh page after successful approval and email sending
            window.location.reload();
        } catch (error) {
            console.error(`❌ Error accepting application with ID: ${id}`, error);
        }
    };

    const handleAcceptDeliveryAgent = async (id) => {
        try {
            const response = await http.put(`/DeliveryAgent/${id}/approve`, { approved: true }, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log(`Accepted application with ID: ${id}`);

            const { applicantName, applicantEmail, newCompanyEmail, tempPassword } = response.data;
    
            // ✅ Send email from frontend using EmailJS
            await sendApprovalEmail({ applicantName, applicantEmail, newCompanyEmail, tempPassword });

            window.location.reload();
        } catch (error) {
            console.error(`Error accepting application with ID: ${id}`, error);
        }
    };

    // const handleReject = async (id) => {
    //     try {
    //         await http.delete(`/JobApplicant/${id}`);
    //         const { applicantName, applicantEmail } = response.data;
    //         await sendRejectionEmail({ applicantName, applicantEmail});
    //         console.log(`Rejected application with ID: ${id}`);
    //         window.location.reload();
    //     } catch (error) {
    //         console.error(`Error rejecting application with ID: ${id}`, error);
    //     }
    // };

    const handleReject = async (id) => {
        try {
            // 🔍 Fetch applicant details before deleting
            const response = await http.get(`/JobApplicant/applicant/${id}`);
            const { fullName: applicantName, email: applicantEmail } = response.data;
    
            // ❌ Proceed with deletion
            await http.delete(`/JobApplicant/${id}`);
    
            // 📧 Send rejection email from the frontend
            await sendRejectionEmail({ applicantName, applicantEmail });
    
            console.log(`✅ Rejected application with ID: ${id}`);
            window.location.reload();
        } catch (error) {
            console.error(`❌ Error rejecting application with ID: ${id}`, error);
        }
    };

    const handleLinkClick = (fileName) => {
        const backendUrl = "https://localhost:7004/uploads";
        window.open(`${backendUrl}/${fileName}`, "_blank");
    };

    const filteredApplications = selectedJobRole === "All"
        ? applications
        : applications.filter(app => app.jobRoleApplied === selectedJobRole);

    const toggleRowExpansion = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <Box sx={{ p: 3 }} style={{
            marginTop: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', width: '96vw'
        }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#414B56", textAlign: "center", marginBottom: "20px" }}>Job Applications</Typography>


            <FormControl sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, minWidth: 200, marginLeft: 145 }}>
                <InputLabel>Filter by Job Role</InputLabel>
                <Select
                    value={selectedJobRole}
                    onChange={(e) => setSelectedJobRole(e.target.value)}
                >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="FulfilmentStaff">Fulfilment Staff</MenuItem>
                    <MenuItem value="DeliveryAgent">Delivery Agent</MenuItem>
                </Select>
            </FormControl>


            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} sx={{ width: "95%"}}>
                <Table sx={{ minWidth: 640 }} aria-label="job applications table">
                    <TableHead>
                        <TableRow>
                            <TableCell /> {/* Expand Button */}
                            <TableCell>Applicant ID</TableCell>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>NRIC</TableCell>
                            <TableCell>Contact Number</TableCell>
                            <TableCell>Job Role Applied</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredApplications.map((application) => {
                            const warehouse = warehouses.find(w => w.warehouseId === Number(application.preferredWarehouse));
                            const warehouseName = warehouse ? warehouse.warehouseName : "Unknown Warehouse";

                            return (
                                <React.Fragment key={application.applicantId}>
                                    {/* Common attributes row */}
                                    <TableRow>
                                        <TableCell>
                                            <IconButton onClick={() => toggleRowExpansion(application.applicantId)}>
                                                {expandedRows[application.applicantId] ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>{application.applicantId}</TableCell>
                                        <TableCell>{application.fullName}</TableCell>
                                        <TableCell>{application.email}</TableCell>
                                        <TableCell>{application.nric}</TableCell>
                                        <TableCell>{application.contactNumber}</TableCell>
                                        <TableCell>{application.jobRoleApplied}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="success"
                                                onClick={() => {
                                                    if (application.jobRoleApplied === "FulfilmentStaff") {
                                                        handleAcceptFulfilmentStaff(application.applicantId);
                                                    } else if (application.jobRoleApplied === "DeliveryAgent") {
                                                        handleAcceptDeliveryAgent(application.applicantId);
                                                    }
                                                }}
                                            >
                                                <CheckCircle sx={{fontSize: "25px"}} />
                                            </IconButton>
                                            <IconButton color="secondary" onClick={() => handleReject(application.applicantId)}>
                                                <Cancel sx={{fontSize: "25px"}} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>

                                    {/* Job-specific details (expandable row) */}
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ p: 0 }}>
                                            <Collapse in={expandedRows[application.applicantId]} timeout="auto" unmountOnExit>
                                                <Box sx={{
                                                    margin: 2,
                                                    p: 2,
                                                    border: "1px solid #ddd",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#f9f9f9",
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    justifyContent: 'space-between',
                                                    gap: '20px',
                                                    overflowX: 'auto'
                                                }}>
                                                    {application.jobRoleApplied === "FulfilmentStaff" ? (
                                                        <>
                                                            <Typography><strong>Preferred Assigned Area:</strong> {application.preferredAssignedArea}</Typography>
                                                            <Typography><strong>Preferred Warehouse:</strong> {warehouseName}</Typography>
                                                            <Typography>
                                                                <strong>Resume:</strong>{" "}
                                                                {application.resumeFileName ? (
                                                                    <Link
                                                                        href="#"
                                                                        onClick={() => handleLinkClick(application.resumeFileName)}
                                                                        sx={{ color: 'blue', textDecoration: 'underline' }} // ✅ Blue & Underlined
                                                                    >
                                                                        View here
                                                                    </Link>
                                                                ) : "No Resume"}
                                                            </Typography>

                                                        </>
                                                    ) : application.jobRoleApplied === "DeliveryAgent" ? (
                                                        <>
                                                            <Typography><strong>Vehicle Number:</strong> {application.vehicleNumber}</Typography>
                                                            <Typography><strong>Vehicle Type:</strong> {application.vehicleType}</Typography>
                                                            <Typography><strong>Vehicle Ownership:</strong> {application.vehicleOwnership}</Typography>
                                                            <Typography><strong>Postal Code:</strong> {application.postalCode}</Typography>
                                                            {application.vehicleOwnership === "someoneElse" && (
                                                                <>
                                                                    <Typography><strong>Owner Full Name:</strong> {application.ownerFullName}</Typography>
                                                                    <Typography>
                                                                        <strong>VRC File:</strong>{" "}
                                                                        {application.vehicleRegistrationCertificate ? (
                                                                            <Link
                                                                                href="#"
                                                                                onClick={() => handleLinkClick(application.vehicleRegistrationCertificate)}
                                                                                sx={{ color: 'blue', textDecoration: 'underline' }} // ✅ Blue & Underlined
                                                                            >
                                                                                View VRC
                                                                            </Link>
                                                                        ) : "Not Required"}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                            <Typography>
                                                                <strong>Driver License:</strong>{" "}
                                                                {application.driverLicenseFileName ? (
                                                                    <Link
                                                                        href="#"
                                                                        onClick={() => handleLinkClick(application.driverLicenseFileName)}
                                                                        sx={{ color: 'blue', textDecoration: 'underline' }} // ✅ Blue & Underlined
                                                                    >
                                                                        View License
                                                                    </Link>
                                                                ) : "No License"}
                                                            </Typography>
                                                        </>
                                                    ) : null}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default JobApplicationsPage;
