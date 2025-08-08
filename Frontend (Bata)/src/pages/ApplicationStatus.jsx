import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField
} from "@mui/material";
import http from "../http";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

function ApplicationStatus() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState([]);  // ✅ Store multiple applications
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [preferredWarehouse, setPreferredWarehouse] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appRes, warehouseRes] = await Promise.all([
                    http.get(`/JobApplicant/${id}`),  // ✅ Fetch the Job Application
                    http.get("/Warehouse")  // ✅ Fetch Warehouses
                ]);

                console.log("📥 Job Application Response:", appRes.data);
                console.log("📦 Warehouse Response:", warehouseRes.data);

                setApplication(appRes.data);
                setWarehouses(warehouseRes.data);

                // ✅ Convert preferredWarehouse to match Warehouse ID
                const preferredWarehouseId = Number(appRes.data.preferredWarehouse);
                console.log("🔍 Preferred Warehouse ID:", preferredWarehouseId);

                const foundWarehouse = warehouseRes.data.find(w => w.warehouseId === preferredWarehouseId);
                setPreferredWarehouse(foundWarehouse ? foundWarehouse.warehouseName : "Unknown Warehouse");

                setLoading(false);
            } catch (error) {
                console.error("❌ Error fetching application or warehouses:", error);
                toast.error("Failed to load application or warehouses");
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleEditToggle = (selectedApplication) => {
        setIsEditing(true);
        setEditData({
            applicantId: selectedApplication.applicantId,
            fullName: selectedApplication.fullName,
            email: selectedApplication.email,
            contactNumber: selectedApplication.contactNumber
        });
    };
    

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            const payload = {
                fullName: editData.fullName,
                email: editData.email,
                contactNumber: editData.contactNumber,
                nric: editData.nric || application.find(app => app.applicantId === editData.applicantId)?.nric || "", // ✅ Ensure NRIC is included
                jobRoleApplied: editData.jobRoleApplied || application.find(app => app.applicantId === editData.applicantId)?.jobRoleApplied || "" // ✅ Ensure Job Role is included
            };
    
            console.log("📤 Sending Update Payload:", payload);
    
            const response = await http.put(`/JobApplicant/${editData.applicantId}`, payload);
    
            toast.success("Updated successfully");
    
            // ✅ Update the UI
            setApplication((prev) =>
                prev.map((app) =>
                    app.applicantId === editData.applicantId ? { ...app, ...editData } : app
                )
            );
    
            setIsEditing(false);
        } catch (error) {
            console.error("❌ Backend Error:", error.response?.data);
            toast.error(`Failed to update application: ${error.response?.data?.title || "Unknown error"}`);
        }
    };
    
    

    const handleDelete = (applicantId) => {
        if (window.confirm(`Are you sure you want to delete this application?`)) {
            http.delete(`/JobApplicant/${applicantId}`)  // ✅ Deletes correct application
                .then(() => {
                    toast.success("Application deleted successfully");
                    setApplications(prev => prev.filter(app => app.applicantId !== applicantId));  // ✅ Remove from UI
                })
                .catch(error => console.error("Failed to delete application:", error));
        }
    };
    

    if (loading) return <CircularProgress />;

    return (
        <div>
            <Box sx={{width: "100vw", mt: 15}}>
                <CustomerSidebar /> {/* Sidebar for customer account pages */}
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#414B56", textAlign: "center", mb: 4 }}>Application Status</Typography>

                {application ? (
                    <TableContainer component={Paper} sx={{ maxWidth: "90%", margin: "auto" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Applicant Id</strong></TableCell>
                                    <TableCell><strong>Full Name</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>NRIC</strong></TableCell>
                                    <TableCell><strong>Contact Number</strong></TableCell>
                                    <TableCell><strong>Job Role Applied</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {application.length > 0 ? (
                                    application.map((application) => (
                                        <TableRow key={application.applicantId}>
                                            <TableCell>{application.applicantId}</TableCell>
                                            <TableCell>{application.fullName}</TableCell>
                                            <TableCell>{application.email}</TableCell>
                                            <TableCell>{application.nric}</TableCell>
                                            <TableCell>{application.contactNumber || "Not Provided"}</TableCell>
                                            <TableCell>{application.jobRoleApplied}</TableCell>
                                            <TableCell>{application.status || "Pending"}</TableCell>
                                            <TableCell>
                                                <Button variant="contained" color="primary" onClick={() => handleEditToggle(application)}>
                                                    Edit
                                                </Button>
                                                <Button variant="contained" color="error" onClick={() => handleDelete(application.applicantId)} sx={{marginLeft: "10px"}}>
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} style={{ textAlign: "center" }}>No applications found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                        </Table>
                    </TableContainer>
                ) : (
                    <Typography variant="h6">Application not found.</Typography>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditing} onClose={() => setIsEditing(false)}>
                    <DialogTitle>Edit Your Details</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Full Name"
                            name="fullName"
                            value={editData?.fullName || ""}
                            onChange={handleEditChange}
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Email"
                            name="email"
                            value={editData?.email || ""}
                            onChange={handleEditChange}
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Contact Number"
                            name="contactNumber"
                            value={editData?.contactNumber || ""}
                            onChange={handleEditChange}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsEditing(false)} color="secondary">Cancel</Button>
                        <Button onClick={handleUpdate} color="green">Save Changes</Button>
                    </DialogActions>
                </Dialog>

                <ToastContainer />
            </Box>
        </div>
    );
}

export default ApplicationStatus;
