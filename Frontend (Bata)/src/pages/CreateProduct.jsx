import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Grid2, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateProduct = () => {
    const navigate = useNavigate();
    const [imageFile, setImageFile] = useState(null);

    const allowedColors = [
        'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'pink', 
        'purple', 'orange', 'brown', 'cyan', 'magenta'
    ];

    const formik = useFormik({
        initialValues: {
            name: "",
            description: "",
            price: "",
            stock: 0,
            size: "",
            color: "",
        },
        validationSchema: yup.object({
            name: yup.string().trim()
                .min(3, 'Name must be at least 3 characters')
                .max(50, 'Name must be at most 50 characters')
                .required('Name is required'),
            description: yup.string().trim()
                .min(10, 'Description must be at least 10 characters')
                .max(300, 'Description must be at most 300 characters')
                .required('Description is required'),
            price: yup.string().trim()
                .matches(/^\d+(\.\d{1,2})?$/, 'Price must be a valid positive number')
                .required('Price is required'),
            stock: yup.number()
                .integer('Stock must be an integer')
                .min(0, 'Stock must be at least 0')
                .required('Stock is required'),
            size: yup
                .number()
                .typeError('Size must be a number')
                .min(1, 'Size must be at least 1')
                .max(13, 'Size must be at most 13')
                .required('Size is required'),          
            color: yup.string()
                .test(
                    'is-valid-color',
                    'Color must be one of the predefined options',
                    (value) => value && allowedColors.includes(value.toLowerCase())
                )
                .required('Color is required'),
        }),
        onSubmit: (data) => {
            if (!imageFile) {
                toast.error('Image is required');
                return;
            }

            data.image = imageFile;

            http.post("/product", data)
                .then((res) => {
                    navigate("/staffproduct", {
                        state: { toastMessage: 'Product created successfully!' }, // Pass the message
                    });
                })
                .catch((err) => {
                    const errorMessage = err.response?.data?.message || 'Error creating product';
                    toast.error(errorMessage);
                    console.error(err.response || err);
                });
        }
    });

    const onFileChange = (e) => {
        let file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                toast.error('Maximum file size is 1MB');
                return;
            }

            let formData = new FormData();
            formData.append('file', file);

            http.post('/file/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            .then((res) => {
                setImageFile(res.data.filename); // Assuming the response contains the filename
                toast.success('Image uploaded successfully!');
            })
            .catch((error) => {
                console.error(error.response);
                toast.error('Error uploading image');
            });
        }
    };

    return (
        <Box sx={{ marginTop: '90px', padding: '0 10%', marginBottom: '50px' }}>
            <Typography variant="h5" sx={{ my: 2 }}>
                Create Product
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                <Grid2 container spacing={2}>
                    <Grid2 item xs={12} md={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            autoComplete="off"
                            label="Product Name"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                        />
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            multiline minRows={3}
                            label="Description"
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                        />
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            label="Price"
                            name="price"
                            value={formik.values.price}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.price && Boolean(formik.errors.price)}
                            helperText={formik.touched.price && formik.errors.price}
                        />
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            label="Stock"
                            type="number"
                            name="stock"
                            value={formik.values.stock}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.stock && Boolean(formik.errors.stock)}
                            helperText={formik.touched.stock && formik.errors.stock}
                        />
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            label="Size"
                            name="size"
                            value={formik.values.size}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.size && Boolean(formik.errors.size)}
                            helperText={formik.touched.size && formik.errors.size}
                        />
                        <FormControl fullWidth margin="dense" variant="outlined">
                            <InputLabel id="color-select-label">Color</InputLabel>
                            <Select
                                labelId="color-select-label" // Link the label to the Select
                                id="color-select"           // Unique id for the Select component
                                name="color"
                                value={formik.values.color}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.color && Boolean(formik.errors.color)}
                                label="Color"               // Ensure the label text appears properly
                            >
                                {allowedColors.map((color) => (
                                    <MenuItem key={color} value={color}>
                                        {color.charAt(0).toUpperCase() + color.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formik.touched.color && formik.errors.color && (
                                <Typography color="error" variant="caption">{formik.errors.color}</Typography>
                            )}
                        </FormControl>

                    </Grid2>
                    <Grid2 item xs={12} md={6}>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button variant="contained" component="label">
                                Upload Image
                                <input hidden accept="image/*" type="file" onChange={onFileChange} />
                            </Button>
                            {imageFile && (
                                <Box sx={{ mt: 2 }}>
                                    <img
                                        alt="Product"
                                        src={`${import.meta.env.VITE_FILE_BASE_URL}${imageFile}`}
                                        style={{ maxWidth: '100%', maxHeight: '200px' }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Grid2>
                </Grid2>
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" type="submit" sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                        },
                    }}>
                        Create Product
                    </Button>
                </Box>
            </Box>

            <ToastContainer />
        </Box>
    );
};

export default CreateProduct;
