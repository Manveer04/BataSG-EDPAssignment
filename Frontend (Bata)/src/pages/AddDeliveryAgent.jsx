import React, { useState, useContext } from "react";
import {
    Box, TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, FormLabel, IconButton, FormHelperText, Radio, RadioGroup, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import http from "../http";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import UserContext from "../contexts/UserContext";

const AddDeliveryAgent = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({

        fullName: "",
        nric: "",
        contactNumber: "",
        email: "",
        vehicleNumber: "",
        vehicleType: "",
        availabilityStatus: true, // Default to available
        postalCode: "",
        driverLicenseFile: null, // File upload
        vehicleOwnership: "self", // Default selection: Owned by them
        ownerFullName: "",
        vrcFile: null // Vehicle Registration Certificate upload
    });

    const [fileError, setFileError] = useState("");
    const [fileName, setFileName] = useState("");
    const [vrcFileName, setVrcFileName] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const { user } = useContext(UserContext);
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Handle input change
    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    // Handle dialog close and navigate
    const handleCloseDialog = () => {
        setOpenDialog(false);
        navigate("/");
    };

    // Handle file upload
    const handleFileChange = (event, field) => {
        const file = event.target.files[0];

        if (file) {
            const validFileTypes = ["application/pdf", "image/jpeg", "image/png"];
            const maxFileSize = 2 * 1024 * 1024; // 2MB limit

            // Validate file type
            if (!validFileTypes.includes(file.type)) {
                setFileError("❌ Unsupported file format. Please upload a PDF or an image.");
                if (typeof toast !== "undefined") {
                    toast.error("❌ Unsupported file format.");
                }
                setFormData(prevState => ({ ...prevState, [field]: null }));
                return;
            }

            // Validate file size
            if (file.size > maxFileSize) {
                setFileError("❌ File size exceeds 2MB.");
                if (typeof toast !== "undefined") {
                    toast.error("❌ File size too large.");
                }
                setFormData(prevState => ({ ...prevState, [field]: null }));
                return;
            }

            setFileError(""); // Clear any previous errors
            if (field === "driverLicenseFile") {
                setFileName(file.name);
            } else if (field === "vrcFile") {
                setVrcFileName(file.name);
            }
            setFormData(prevState => ({ ...prevState, [field]: file }));
        }
    };
    // 🔍 Fetch vehicle details
    const handleCheckVehicle = async () => {
        if (!formData.vehicleNumber) {
            toast.error("❌ Please enter a vehicle number first!");
            return;
        }

        setLoading(true);
        try {
            const response = await http.get(`/DeliveryAgent/vehicle-info`, {
                params: { registrationNumber: formData.vehicleNumber },
            });

            setVehicleDetails(response.data);
            console.log("🚗 Vehicle Details:", response.data);
        } catch (error) {
            toast.error("❌ Failed to fetch vehicle details.");
            console.error("Vehicle API Error:", error);
        } finally {
            setLoading(false);
        }
    };


    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault(); // 🚀 Prevent default form submission

        // Validate required file uploads
        if (!formData.driverLicenseFile) {
            toast.error("❌ Please upload a valid Driver's License.");
            return;
        }

        if (formData.vehicleOwnership === "someoneElse" && !formData.vrcFile) {
            toast.error("❌ Please upload the Vehicle Registration Certificate.");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("jobRoleApplied", "DeliveryAgent");
            formDataToSend.append("fullName", formData.fullName);
            formDataToSend.append("nric", formData.nric);
            formDataToSend.append("contactNumber", formData.contactNumber);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("vehicleNumber", formData.vehicleNumber);
            formDataToSend.append("vehicleType", formData.vehicleType);
            formDataToSend.append("availabilityStatus", formData.availabilityStatus);
            formDataToSend.append("postalCode", formData.postalCode);
            formDataToSend.append("vehicleOwnership", formData.vehicleOwnership);
            formDataToSend.append("driverLicenseFile", formData.driverLicenseFile);
            formDataToSend.append("userId", user.id);

            // Append Vehicle Registration Certificate only if required
            if (formData.vehicleOwnership === "someoneElse") {
                formDataToSend.append("ownerFullName", formData.ownerFullName);
                formDataToSend.append("vrcFile", formData.vrcFile);
            }

            const response = await http.post("/DeliveryAgent/apply", formDataToSend, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("✅ Delivery Agent application submitted successfully!");
            console.log("✅ Response:", response.data);

            setTimeout(() => {
                navigate(`/application/${user.id}`);
            }, 2000);
        } catch (error) {
            toast.error("❌ Failed to apply as a Delivery Agent.");
            console.error("❌ Error:", error);
        }
    };


    return (
        <Box sx={{
            marginTop: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100vw'
        }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Apply Delivery Agent</Typography>
            <Box sx={{ maxWidth: '500px' }} component="form" onSubmit={handleSubmit}>


                <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="NRIC" name="nric" value={formData.nric} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} required sx={{ mb: 2 }} />

                {/* Vehicle Number Field + Check Button */}
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <TextField fullWidth label="Vehicle Number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required />
                    <Button variant="contained" color="secondary" onClick={handleCheckVehicle} disabled={loading} sx={{ ml: 2 }}>
                        {loading ? "Checking..." : "Check Vehicle Info"}
                    </Button>
                </Box>

                {/* Show Vehicle Details if Found */}
                {vehicleDetails && (
                    <Box sx={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "5px", mb: 2 }}>
                        <Typography variant="body1"><b>Make:</b> {vehicleDetails.makeDescription}</Typography>
                        <Typography variant="body1"><b>Model:</b> {vehicleDetails.modelDescription}</Typography>
                        <Typography variant="body1"><b>Year:</b> {vehicleDetails.registrationYear}</Typography>
                        <Typography variant="body1"><b>Tax Expiry:</b> {vehicleDetails.taxExpiry}</Typography>
                    </Box>
                )}

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required>
                        <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                        <MenuItem value="Car">Car</MenuItem>
                        <MenuItem value="Van">Van</MenuItem>
                    </Select>
                </FormControl>


                <TextField fullWidth label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} required sx={{ mb: 2 }} />

                <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(fileError)}>
                    <Box display="flex" alignItems="center">
                        <FormLabel>Upload Driver’s License</FormLabel>
                        <IconButton component="label">
                            <UploadFileIcon />
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, "driverLicenseFile")}
                            />
                        </IconButton>
                    </Box>
                    {fileName && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {fileName}
                        </Typography>
                    )}
                </FormControl>


                <Typography variant="h7" sx={{ color: "grey", mb: 1 }}>Is the Vehicle Owned by You?</Typography>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <RadioGroup row name="vehicleOwnership" value={formData.vehicleOwnership} onChange={handleChange}>
                        <FormControlLabel value="self" control={<Radio sx={{ color: "black", '&.Mui-checked': { color: "gray" } }} />} label="Yes, I own it" />
                        <FormControlLabel value="someoneElse" control={<Radio sx={{ color: "black", '&.Mui-checked': { color: "gray" } }} />} label="No, someone else" />
                    </RadioGroup>
                </FormControl>

                {formData.vehicleOwnership === "someoneElse" && (
                    <>
                        <TextField fullWidth label="Owner's Full Name" name="ownerFullName" value={formData.ownerFullName} onChange={handleChange} required sx={{ mb: 2 }} />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel>Upload Vehicle Registration Certificate</FormLabel>
                            <IconButton component="label">
                                <UploadFileIcon />
                                <input type="file" hidden onChange={(e) => handleFileChange(e, "vrcFile")} accept=".pdf,.jpg,.jpeg,.png" />
                            </IconButton>
                        </FormControl>
                    </>
                )}

                <Button type="submit" variant="contained" color="primary" fullWidth>Apply</Button>
                <Dialog open={openDialog} onClose={handleCloseDialog}>
                    <DialogTitle>Application Submitted</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Your application has been successfully submitted!</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} sx={{ color: 'white', backgroundColor: 'green' }}>
                            Return to Delivery Agents List
                        </Button>
                    </DialogActions>
                </Dialog>

                <ToastContainer />
            </Box>
            <ToastContainer />
        </Box>
    );
};

export default AddDeliveryAgent;
