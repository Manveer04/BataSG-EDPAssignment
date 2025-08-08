import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl, Paper } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddProduct() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [image, setImage] = useState(null);
    const [imageFile2, setImageFile2] = useState(null);
    const [imageFile3, setImageFile3] = useState(null);
    const [threeJsFile, setThreeJsFile] = useState(null);

    // Fetch categories from API
    useEffect(() => {
        http.get('/category')
            .then((res) => {
                setCategories(res.data);
            })
            .catch((err) => console.log("Error fetching categories:", err));
    }, []);

    const allowedColors = [
        'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Pink',
        'Purple', 'Orange', 'Brown', 'Cyan', 'Magenta'
    ];

    const onFileChange = (e, fileNumber) => {
        let file = e.target.files[0];
        if (file) {
            const isImage = file.name.endsWith(".jpg") || file.name.endsWith(".jpeg") || file.name.endsWith(".png")|| file.name.endsWith(".webp")
            const isThreeJsFile = file.name.endsWith(".glb") || file.name.endsWith(".gltf") || file.name.endsWith(".json");
    
            if (isImage && file.size > 1024 * 1024) { // 1MB limit for images
                toast.error('Maximum file size for images is 1MB');
                return;
            } else if (isThreeJsFile && file.size > 30 * 1024 * 1024) { // 30MB limit for Three.js files
                toast.error('Maximum file size for 3D models is 30MB');
                return;
            } else if (!isImage && !isThreeJsFile) {
                toast.error('Unsupported file format');
                return;
            }
    
            let formData = new FormData();
            formData.append('file', file);
    
            http.post('/file/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            .then((res) => {
                const uploadedFile = res.data.filename;
                if (fileNumber === 1) setImage(uploadedFile);
                if (fileNumber === 2) setImageFile2(uploadedFile);
                if (fileNumber === 3) setImageFile3(uploadedFile);
                if (fileNumber === 4) setThreeJsFile(uploadedFile);
                toast.success('File uploaded successfully!');
            })
            .catch(() => {
                toast.error('Error uploading file');
            });
        }
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            price: '',
            categoryId: '',
            image: '',
            imageFile2: '',
            imageFile3: '',
            color: '',
            threeJsFile: '' 
        },
        validationSchema: yup.object({
            name: yup.string().trim().min(3, 'Must be at least 3 characters').max(100, 'Must be at most 100 characters').required('Name is required'),
            description: yup.string().trim().min(3, 'Must be at least 3 characters').max(500, 'Must be at most 500 characters').required('Description is required'),
            price: yup.number().min(0.01, 'Price must be at least 0.01').required('Price is required'),
            categoryId: yup.string().required('Category is required'),
            color: yup.string()
                .test(
                    'is-valid-color',
                    'Color must be one of the predefined options',
                    (value) => value && allowedColors.includes(value)
                )
                .required('Color is required'),
        }),
        onSubmit: (values) => {
            values.image = image;
            values.imageFile2 = imageFile2;
            values.imageFile3 = imageFile3;
            values.threeJsFile = threeJsFile;
            console.log("Submitting Product Data:", values);
            http.post('/product', values)
                .then(() => {
                    toast.success('Product added successfully!');
                    navigate('/staffproduct');
                })
                .catch(() => {
                    toast.error('Error adding product');
                });
        },
    });

    return (
        <Box sx={{ mt: 11, marginLeft: "100px", marginBottom: "20px"}}>
            <Typography variant="h5" >Add Product</Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField label="Name" name="name" fullWidth margin="normal" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <TextField label="Description" name="description" fullWidth margin="normal" multiline rows={3} value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <TextField label="Price" name="price" type="number" fullWidth margin="normal" value={formik.values.price} onChange={formik.handleChange} onBlur={formik.handleBlur} />

                {/* Dropdown for Category Selection */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Category</InputLabel>
                    <Select
                        name="categoryId"
                        value={formik.values.categoryId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                    >
                        {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                                {category.category}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                                {color}
                            </MenuItem>
                        ))}
                    </Select>
                    {formik.touched.color && formik.errors.color && (
                        <Typography color="error" variant="caption">{formik.errors.color}</Typography>
                    )}
                </FormControl>


                {/* Image Upload Section */}
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" component="label">
                        Upload Image 1
                        <input hidden accept="image/*" type="file" onChange={(e) => onFileChange(e, 1)} />
                    </Button>
                    <Button variant="contained" component="label" sx={{ ml: 2 }}>
                        Upload Image 2
                        <input hidden accept="image/*" type="file" onChange={(e) => onFileChange(e, 2)} />
                    </Button>
                    <Button variant="contained" component="label" sx={{ ml: 2 }}>
                        Upload Image 3
                        <input hidden accept="image/*" type="file" onChange={(e) => onFileChange(e, 3)} />
                    </Button>
                </Box>

                {/* Image Previews */}
                <Box sx={{ mt: 2 }}>
                    {[image, imageFile2, imageFile3].map((file, index) =>
                        file && (
                            <Paper key={index} variant="outlined" sx={{ p: 2, textAlign: 'center', my: 1 }}>
                                <Typography variant="subtitle1">Image {index + 1} Preview</Typography>
                                <img alt="Uploaded" src={`${import.meta.env.VITE_FILE_BASE_URL}${file}`} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} />
                            </Paper>
                        )
                    )}
                </Box>

               {/* Three.js File Upload Section */}
               <Box sx={{ mt: 2 }}>
                    <Button variant="contained" component="label">
                        Upload Three.js File
                        <input hidden accept=".glb,.gltf,.json" type="file" onChange={(e) => onFileChange(e, 4)} />
                    </Button>
                    {threeJsFile && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Current 3D Model: {threeJsFile}
                        </Typography>
                    )}
                </Box>

                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Add</Button>
            </Box>
            <ToastContainer />
        </Box>
    );
}

export default AddProduct;
