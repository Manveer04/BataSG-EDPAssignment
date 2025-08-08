import React, { useState, useEffect, useContext } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
    Box,
    Button,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormLabel
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import UserContext from "../contexts/UserContext";
import http from '../http'; // Adjust the import based on your project structure

function AddFulfilmentStaff() {
    const [resumeFile, setResumeFile] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [fileError, setFileError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [distances, setDistances] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    // ✅ Step 1: Fetch Warehouses First (Without Distance)
                    http.get(`/Warehouse`)
                        .then((res) => {
                            setWarehouses(res.data); // Show warehouses first
                            setLoading(false);

                            // ✅ Step 2: Fetch Distances Separately
                            http.get(`/Warehouse/with-distance?userLat=${userLat}&userLng=${userLng}`)
                                .then((distanceRes) => {
                                    const updatedWarehouses = res.data.map(warehouse => {
                                        const found = distanceRes.data.find(d => d.warehouseId === warehouse.warehouseId);
                                        return {
                                            ...warehouse,
                                            distance: found ? found.distance : "Calculating...",
                                        };
                                    });
                                    setWarehouses(updatedWarehouses); // ✅ Update distances in the UI
                                })
                                .catch((err) => console.error("Error fetching distances:", err));
                        })
                        .catch((err) => {
                            console.error("Error fetching warehouses:", err);
                            setLoading(false);
                        });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    toast.error("Unable to get your location.");
                    setLoading(false);
                }
            );
        }
    }, []);


    // useEffect(() => {
    //     http.get('/Warehouse')
    //         .then((res) => setWarehouses(res.data))
    //         .catch((err) => console.error("Error fetching warehouses:", err));
    // }, []);

    const validationSchema = yup.object({
        fullName: yup.string().required('Full Name is required'),
        // password: yup.string()
        //     .required('Password is required')
        //     .min(8, 'Password must be at least 8 characters long')
        //     .matches(/[a-zA-Z]/, 'Password must contain at least one letter')
        //     .matches(/\d/, 'Password must contain at least one number'),
        nric: yup.string().required('NRIC is required'),
        email: yup.string().email('Invalid email format').required('Email is required'),
        contactNumber: yup.string().matches(/^\d+$/, 'Contact number must be digits only').required('Contact Number is required'),
        assignedArea: yup.string().required('Assigned Area is required'),
        warehouse: yup.string().required('Warehouse is required'),
        resume: yup.mixed().test('fileType', 'Unsupported File Format', value => {
            return value && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(value.type);
        }).test('fileSize', 'File Size is too large', value => {
            return value && value.size <= 2 * 1024 * 1024;
        })
    });

    const formik = useFormik({
        initialValues: {
            fullName: '',
            password: '',
            nric: '',
            email: '',
            contactNumber: '',
            assignedArea: '',
            warehouse: '',
            resume: null,
            userId: 0
        },
        validationSchema: validationSchema,
        onSubmit: async (data) => {
            console.log("🔍 Formik handleSubmit triggered with data:", data);
            console.log("❌ Formik Errors:", formik.errors); // Logs validation errors
            if (!user?.id) {
                toast.error("User ID is missing. Please log in again.");
                console.error("❌ User ID is missing. Cannot submit the form.");
                return;
            }

            if (!formik.values.resume) {
                console.error("❌ Resume file is missing.");
                toast.error("Resume file is required!", { position: toast.POSITION.BOTTOM_CENTER });
                return;
            }

            // Inside the onSubmit function
            const formData = new FormData();
            formData.append('JobRoleApplied', 'FulfilmentStaff');
            formData.append('FullName', data.fullName);
            formData.append('Email', data.email);
            formData.append('NRIC', data.nric);
            formData.append('ContactNumber', data.contactNumber);
            formData.append('PreferredAssignedArea', data.assignedArea);
            formData.append('PreferredWarehouse', data.warehouse);
            formData.append('ResumeFileName', formik.values.resume.name);
            formData.append('ResumeFile', formik.values.resume);
            formData.append('userId', user.id);

            // Correct the key to 'userId' and ensure user.id is correctly referenced

            console.log("📤 UserId from context:", user?.id); // Verify the user ID is correct

            // Log form data entries for debugging
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            console.log("📤 Sending form data to `/FulfilmentStaff/register`...");

            try {
                const response = await http.post("/FulfilmentStaff/register", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                console.log("✅ Form submission successful:", response.data);
                setOpenDialog(true);
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                if (error.response) {
                    console.error('⚠ Server Response:', error.response.data);
                    toast.error(`Server Error: ${error.response.data.message || 'An error occurred'}`);
                } else {
                    toast.error(`Network Error: ${error.message}`);
                }
            }
        }
    });


    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validFileTypes.includes(file.type)) {
                setFileError('Unsupported File Format');
                toast.error('❌ Unsupported File Format');
                formik.setFieldValue('resume', null);
            } else if (file.size > 2 * 1024 * 1024) {
                setFileError('File Size is too large');
                toast.error('❌ File Size is too large');
                formik.setFieldValue('resume', null);
            } else {
                setFileError('');
                setResumeFile(file);
                setResumePreview(URL.createObjectURL(file));
                formik.setFieldValue('resume', file); // ✅ Ensure Formik tracks the resume
            }
        }
    };


    const handleCloseDialog = () => {
        setOpenDialog(false);
        navigate(`/application/${user.id}`);
    };    

    return (
        <Box sx={{
            marginTop: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100vw'
        }}>
            <ToastContainer position="bottom-center" />
            <Typography variant="h5" sx={{ my: 2 }}>
                Apply Fulfilment Staff
            </Typography>
            <Box component="form" sx={{ maxWidth: '500px' }} onSubmit={(e) => {
                e.preventDefault();
                console.log("✅ Form submit event detected! Calling Formik handleSubmit...");
                formik.handleSubmit(e); // ✅ Pass event to Formik manually
            }}>

                <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Full Name"
                    name="fullName"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                    helperText={formik.touched.fullName && formik.errors.fullName}
                />
                {/* <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                /> */}
                <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="NRIC"
                    name="nric"
                    value={formik.values.nric}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.nric && Boolean(formik.errors.nric)}
                    helperText={formik.touched.nric && formik.errors.nric}
                />
                <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Contact Number"
                    name="contactNumber"
                    value={formik.values.contactNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
                    helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                />
                <FormControl fullWidth margin="dense" error={formik.touched.assignedArea && Boolean(formik.errors.assignedArea)}>
                    <InputLabel>Assigned Area</InputLabel>
                    <Select
                        name="assignedArea"
                        value={formik.values.assignedArea}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Assigned Area"
                    >
                        <MenuItem value="Picker">Picker</MenuItem>
                        <MenuItem value="Packer">Packer</MenuItem>
                        <MenuItem value="Dispatcher">Dispatcher</MenuItem>
                    </Select>
                    {formik.touched.assignedArea && formik.errors.assignedArea && (
                        <FormHelperText>{formik.errors.assignedArea}</FormHelperText>
                    )}
                </FormControl>
                <FormControl fullWidth margin="dense" disabled={loading || warehouses.length === 0}>
                    <InputLabel>
                        {loading || warehouses.length === 0 ? "Calculating your distance with our warehouses..." : "Preferred Warehouse"}
                    </InputLabel>
                    <Select
                        name="warehouse"
                        value={formik.values.warehouse || ''} // ✅ Ensure it's always a string, never undefined
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    >
                        {loading || warehouses.length === 0 ? (
                            <MenuItem disabled>
                                Calculating your distance with our warehouses...
                            </MenuItem>
                        ) : (
                            warehouses.map((warehouse) => (
                                <MenuItem key={warehouse.warehouseId} value={warehouse.warehouseId}>
                                    {warehouse.warehouseName} - {warehouse.address}
                                    {warehouse.distance ? ` (${warehouse.distance})` : " (Calculating...)"}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                    {formik.touched.warehouse && formik.errors.warehouse && (
                        <FormHelperText>{formik.errors.warehouse}</FormHelperText>
                    )}
                </FormControl>



                {/* <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Warehouse"
                    name="warehouse"
                    value={formik.values.warehouse}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.warehouse && Boolean(formik.errors.warehouse)}
                    helperText={formik.touched.warehouse && formik.errors.warehouse}
                /> */}
                <FormControl fullWidth margin="dense" error={formik.touched.resume && Boolean(formik.errors.resume)}>
                    <Box display="flex" alignItems="center">
                        <FormLabel>Upload Resume</FormLabel>
                        <IconButton color="black" component="label" sx={{ ml: 1 }}>
                            <UploadFileIcon />
                            <input type="file" hidden onChange={handleResumeChange} />
                        </IconButton>
                    </Box>
                    {resumeFile && (
                        <Typography variant="caption" display="block">
                            {resumeFile.name}
                        </Typography>
                    )}
                    {fileError && (
                        <FormHelperText error>{fileError}</FormHelperText>
                    )}
                    {formik.touched.resume && formik.errors.resume && (
                        <FormHelperText>{formik.errors.resume}</FormHelperText>
                    )}
                </FormControl>
                <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    type="submit"
                >
                    Submit
                </Button>


            </Box>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Submission Successful</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your submission of the the Fulfilment Staff Job Application is successful. Do check your email for updates.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ color: 'white', backgroundColor: 'green' }}>
                        View Application Status
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AddFulfilmentStaff;