import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
    Box,
    Button,
    TextField,
    Typography,
    Grid,
    FormControl,
    FormLabel,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import http from '../http'; // Adjust the import based on your project structure

function FulfilmentStaffReg() {
    const [resumeFile, setResumeFile] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [fileError, setFileError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const navigate = useNavigate();

    const validationSchema = yup.object({
        fullName: yup.string().required('Full Name is required'),
        nric: yup.string().required('NRIC is required'),
        email: yup.string().email('Invalid email format').required('Email is required'),
        contactNumber: yup.string().matches(/^\d+$/, 'Contact number must be digits only').required('Contact Number is required'),
        preferredArea: yup.array().min(1, 'Select at least one area').required('Preferred Assigned Area is required'),
        preferredWarehouse: yup.string().required('Preferred Warehouse is required'),
        resume: yup.mixed().required('Resume is required').test('fileType', 'Unsupported File Format', value => {
            return value && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(value.type);
        }).test('fileSize', 'File Size is too large', value => {
            return value && value.size <= 2 * 1024 * 1024;
        })
    });

    const formik = useFormik({
        initialValues: {
            fullName: '',
            nric: '',
            email: '',
            contactNumber: '',
            preferredArea: [],
            preferredWarehouse: '',
            resume: null
        },
        validationSchema: validationSchema,
        onSubmit: async (data) => {
            const formData = new FormData();
            formData.append('JobRoleApplied', 'Fulfilment Staff');
            formData.append('FullName', data.fullName);
            formData.append('Email', data.email);
            formData.append('NRIC', data.nric);
            formData.append('ContactNumber', data.contactNumber);
            formData.append('PreferredAssignedArea', data.preferredArea.join(', ')); // Assuming multiple areas can be selected
            formData.append('PreferredWarehouse', data.preferredWarehouse);
            formData.append('ResumeFileName', resumeFile.name);
            formData.append('ResumeFile', resumeFile);

            try {
                const response = await http.post("/FulfilmentStaff/register", formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log('Form data', response.data);
                setOpenDialog(true);
            } catch (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Error response:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);
                    toast.error(`Error: ${error.response.data.message || 'An error occurred'}`, { position: toast.POSITION.BOTTOM_CENTER });
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('Error request:', error.request);
                    toast.error('No response received from server', { position: toast.POSITION.BOTTOM_CENTER });
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error message:', error.message);
                    toast.error(`Error: ${error.message}`, { position: toast.POSITION.BOTTOM_CENTER });
                }
                console.error('Error config:', error.config);
            }
        }
    });

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validFileTypes.includes(file.type)) {
                setFileError('Unsupported File Format');
                toast.error('Unsupported File Format', { position: toast.POSITION.BOTTOM_CENTER });
                formik.setFieldValue('resume', null);
            } else if (file.size > 2 * 1024 * 1024) {
                setFileError('File Size is too large');
                toast.error('File Size is too large', { position: toast.POSITION.BOTTOM_CENTER });
                formik.setFieldValue('resume', null);
            } else {
                setFileError('');
                setResumeFile(file);
                setResumePreview(URL.createObjectURL(file));
                formik.setFieldValue('resume', file);
            }
        }
    };

    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        if (checked) {
            formik.setFieldValue('preferredArea', [...formik.values.preferredArea, name]);
        } else {
            formik.setFieldValue('preferredArea', formik.values.preferredArea.filter(value => value !== name));
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        navigate("/");
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
                Fulfilment Staff Registration
            </Typography>
            <Box component="form" sx={{ maxWidth: '500px' }} onSubmit={formik.handleSubmit}>
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
                <Typography sx={{ color: 'grey' }}>Preferred Assigned Area</Typography>
                <FormControl component="fieldset" fullWidth margin="dense" error={formik.touched.preferredArea && Boolean(formik.errors.preferredArea)}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formik.values.preferredArea.includes('Picker')}
                                onChange={handleCheckboxChange}
                                name="Picker"
                                sx={{
                                    '&.Mui-checked': {
                                        color: 'grey',
                                    },
                                }}
                            />
                        }
                        label="Picker"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formik.values.preferredArea.includes('Packer')}
                                onChange={handleCheckboxChange}
                                name="Packer"
                                sx={{
                                    '&.Mui-checked': {
                                        color: 'grey',
                                    },
                                }}
                            />
                        }
                        label="Packer"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formik.values.preferredArea.includes('Dispatcher')}
                                onChange={handleCheckboxChange}
                                name="Dispatcher"
                                sx={{
                                    '&.Mui-checked': {
                                        color: 'grey',
                                    },
                                }}
                            />
                        }
                        label="Dispatcher"
                    />
                    {formik.touched.preferredArea && formik.errors.preferredArea && (
                        <FormHelperText>{formik.errors.preferredArea}</FormHelperText>
                    )}
                </FormControl>
                <TextField
                    fullWidth
                    color='black'
                    margin="dense"
                    label="Preferred Warehouse (subject to availability)"
                    name="preferredWarehouse"
                    value={formik.values.preferredWarehouse}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.preferredWarehouse && Boolean(formik.errors.preferredWarehouse)}
                    helperText={formik.touched.preferredWarehouse && formik.errors.preferredWarehouse}
                />
                <FormControl fullWidth margin="dense" error={formik.touched.resume && Boolean(formik.errors.resume)}>
                    <Box display="flex" alignItems="center">
                        <FormLabel>Upload Resume</FormLabel>
                        <IconButton color="primary" component="label" sx={{ ml: 1, color: "grey" }}>
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
                <Button fullWidth variant="contained" sx={{ mt: 2 }} type="submit">
                    Submit
                </Button>
            </Box>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Submission Successful</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your application has been submitted successfully. Please check your email for updates on the job.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                <Button onClick={handleCloseDialog} sx={{ color: 'white', backgroundColor: 'green' }}>
                  Return to Homepage
                </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FulfilmentStaffReg;