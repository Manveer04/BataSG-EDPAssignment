import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [initialValues, setInitialValues] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: '',
        imageFile2: '',
        imageFile3: '',
        color: '',
        threeJsFile: '' 
    });
    const [categories, setCategories] = useState([]);
    const [image, setImage] = useState(null);
    const [imageFile2, setImageFile2] = useState(null);
    const [imageFile3, setImageFile3] = useState(null);
    const [threeJsFile, setThreeJsFile] = useState(null);

    // Fetch categories and product data
    useEffect(() => {
        http.get('/category')
            .then((res) => setCategories(res.data))
            .catch((err) => console.log("Error fetching categories:", err));

        // Fetch product data
        http.get(`/product/${id}`).then((res) => {
            setInitialValues(res.data);
            setImage(res.data.image);
            setImageFile2(res.data.imageFile2);
            setImageFile3(res.data.imageFile3);
            setThreeJsFile(res.data.threeJsFile);
        });
    }, [id]);

    const allowedColors = [
        'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Pink',
        'Purple', 'Orange', 'Brown', 'Cyan', 'Magenta'
    ];

    const onFileChange = (e, fileNumber) => {
        let file = e.target.files[0];
        if (file) {
            const isImage = file.name.endsWith(".jpg") || file.name.endsWith(".jpeg") || file.name.endsWith(".png")
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
        initialValues,
        enableReinitialize: true,
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

            http.put(`/product/${id}`, values).then(() => {
                toast.success('Product updated successfully!');
                navigate('/staffproduct');
            }).catch(() => {
                toast.error('Error updating product');
            });
        },
    });

    return (
        <Box sx={{ mt: 11, marginLeft: "100px", marginBottom: "20px"}}>
            <Typography variant="h5" sx={{ my: 2 }}>Edit Product</Typography>
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
                        labelId="color-select-label"
                        id="color-select"
                        name="color"
                        value={formik.values.color}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.color && Boolean(formik.errors.color)}
                        label="Color"
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

                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Update</Button>
            </Box>
            <ToastContainer />
        </Box>
    );
}

export default EditProduct;



// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Box, Typography, TextField, Button, Grid2, MenuItem, Select, FormControl, InputLabel, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
// import { useFormik } from 'formik';
// import * as yup from 'yup';
// import http from '../http';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const allowedColors = [
//     'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'pink',
//     'purple', 'orange', 'brown', 'cyan', 'magenta'
// ];

// const EditProduct = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [product, setProduct] = useState({
//         name: "",
//         description: "",
//         price: "",
//         stock: 0,
//         size: "",
//         color: "",
//         image: ""
//     });
//     const [imageFile, setImageFile] = useState(null);
//     const [isDialogOpen, setIsDialogOpen] = useState(false); // State for the dialog

//     useEffect(() => {
//         http.get(`/product/${id}`)
//             .then((res) => {
//                 setProduct(res.data);
//             })
//             .catch((err) => {
//                 console.error('Error fetching product:', err);
//                 toast.error('Error fetching product details');
//             });
//     }, [id]);

//     const formik = useFormik({
//         initialValues: product,
//         enableReinitialize: true, // Reinitialize form values when product data is fetched
//         validationSchema: yup.object({
//             name: yup.string().trim()
//                 .min(3, 'Name must be at least 3 characters')
//                 .max(50, 'Name must be at most 50 characters')
//                 .required('Name is required'),
//             description: yup.string().trim()
//                 .min(10, 'Description must be at least 10 characters')
//                 .max(300, 'Description must be at most 300 characters')
//                 .required('Description is required'),
//             price: yup.string().trim()
//                 .matches(/^\d+(\.\d{1,2})?$/, 'Price must be a valid positive number')
//                 .required('Price is required'),
//             stock: yup.number()
//                 .integer('Stock must be an integer')
//                 .min(0, 'Stock must be at least 0')
//                 .required('Stock is required'),
//             size: yup
//                 .number()
//                 .typeError('Size must be a number')
//                 .min(1, 'Size must be at least 1')
//                 .max(13, 'Size must be at most 13')
//                 .required('Size is required'),
//             color: yup.string()
//                 .test(
//                     'is-valid-color',
//                     'Color must be one of the predefined options',
//                     (value) => value && allowedColors.includes(value.toLowerCase())
//                 )
//                 .required('Color is required'),
//         }),
//         onSubmit: (values) => {
//             if (!imageFile && !product.image) {
//                 toast.error('Image is required');
//                 return;
//             }

//             const updatedProduct = { ...values };
//             if (imageFile) {
//                 updatedProduct.image = imageFile;
//             }

//             http.put(`/product/${id}`, updatedProduct)
//                 .then(() => {
//                     navigate('/staffproduct', {
//                         state: { toastMessage: 'Product updated successfully!' }, // Pass the message
//                     });
//                 })
//                 .catch((err) => {
//                     console.error('Error updating product:', err);
//                     toast.error('Error updating product');
//                 });
//         }
//     });

//     const handleDelete = () => {
//         http.delete(`/product/${id}`)
//             .then(() => {
//                 navigate('/staffproduct', {
//                     state: { toastMessage: 'Product deleted successfully!' }, // Pass the message
//                 });
//             })
//             .catch((err) => {
//                 console.error('Error deleting product:', err);
//                 toast.error('Error deleting product');
//             });
//     };

//     const onFileChange = (e) => {
//         let file = e.target.files[0];
//         if (file) {
//             if (file.size > 1024 * 1024) {
//                 toast.error('Maximum file size is 1MB');
//                 return;
//             }

//             let formData = new FormData();
//             formData.append('file', file);
//             http.post('/file/upload', formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data'
//                 }
//             })
//                 .then((res) => {
//                     setImageFile(res.data.filename);
//                 })
//                 .catch((err) => {
//                     console.error('Error uploading image:', err);
//                     toast.error('Error uploading image');
//                 });
//         }
//     };

//     const handleOpenDialog = () => {
//         setIsDialogOpen(true);
//     };

//     const handleCloseDialog = () => {
//         setIsDialogOpen(false);
//     };

//     return (
//         <Box sx={{ marginTop: '90px', padding: '0 10%', marginBottom: '50px' }}>
//             <Typography variant="h5" sx={{ my: 2 }}>
//                 Edit Product
//             </Typography>
//             <Box component="form" onSubmit={formik.handleSubmit}>
//                 <Grid2 container spacing={2}>
//                     <Grid2 item xs={12} md={6}>
//                         <TextField
//                             fullWidth
//                             margin="dense"
//                             autoComplete="off"
//                             label="Product Name"
//                             name="name"
//                             value={formik.values.name}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             error={formik.touched.name && Boolean(formik.errors.name)}
//                             helperText={formik.touched.name && formik.errors.name}
//                         />
//                         <TextField
//                             fullWidth
//                             margin="dense"
//                             autoComplete="off"
//                             multiline
//                             minRows={3}
//                             label="Description"
//                             name="description"
//                             value={formik.values.description}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             error={formik.touched.description && Boolean(formik.errors.description)}
//                             helperText={formik.touched.description && formik.errors.description}
//                         />
//                         <TextField
//                             fullWidth
//                             margin="dense"
//                             autoComplete="off"
//                             label="Price"
//                             name="price"
//                             value={formik.values.price}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             error={formik.touched.price && Boolean(formik.errors.price)}
//                             helperText={formik.touched.price && formik.errors.price}
//                         />
//                         <TextField
//                             fullWidth
//                             margin="dense"
//                             autoComplete="off"
//                             label="Stock"
//                             type="number"
//                             name="stock"
//                             value={formik.values.stock}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             error={formik.touched.stock && Boolean(formik.errors.stock)}
//                             helperText={formik.touched.stock && formik.errors.stock}
//                         />
//                         <TextField
//                             fullWidth
//                             margin="dense"
//                             autoComplete="off"
//                             label="Size"
//                             name="size"
//                             value={formik.values.size}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             error={formik.touched.size && Boolean(formik.errors.size)}
//                             helperText={formik.touched.size && formik.errors.size}
//                         />
//                         <FormControl fullWidth margin="dense" variant="outlined">
//                             <InputLabel id="color-select-label">Color</InputLabel>
//                             <Select
//                                 labelId="color-select-label"
//                                 id="color-select"
//                                 name="color"
//                                 value={formik.values.color}
//                                 onChange={formik.handleChange}
//                                 onBlur={formik.handleBlur}
//                                 error={formik.touched.color && Boolean(formik.errors.color)}
//                                 label="Color"
//                             >
//                                 {allowedColors.map((color) => (
//                                     <MenuItem key={color} value={color}>
//                                         {color.charAt(0).toUpperCase() + color.slice(1)}
//                                     </MenuItem>
//                                 ))}
//                             </Select>
//                             {formik.touched.color && formik.errors.color && (
//                                 <Typography color="error" variant="caption">{formik.errors.color}</Typography>
//                             )}
//                         </FormControl>
//                     </Grid2>
//                     <Grid2 item xs={12} md={6}>
//                         <Box sx={{ textAlign: 'center', mt: 2 }}>
//                             <Button variant="contained" component="label">
//                                 Upload Image
//                                 <input hidden accept="image/*" type="file" onChange={onFileChange} />
//                             </Button>
//                             {imageFile || product.image ? (
//                                 <Box sx={{ mt: 2 }}>
//                                     <img
//                                         alt="Product"
//                                         src={`${import.meta.env.VITE_FILE_BASE_URL}${imageFile || product.image}`}
//                                         style={{ maxWidth: '100%', maxHeight: '200px' }}
//                                     />
//                                 </Box>
//                             ) : null}
//                         </Box>
//                     </Grid2>
//                 </Grid2>
//                 <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
//                     <Button
//                         variant="contained"
//                         type="submit"
//                         sx={{
//                             backgroundColor: '#1976d2',
//                             color: 'white',
//                             '&:hover': {
//                                 backgroundColor: '#1565c0',
//                             },
//                         }}
//                     >
//                         Save Changes
//                     </Button>
//                     <Button
//                         variant="outlined"
//                         color="error"
//                         onClick={handleOpenDialog}
//                         sx={{
//                             '&:hover': {
//                                 color: 'white',
//                                 backgroundColor: '#E2001A',
//                             },
//                         }}
//                     >
//                         Delete Product
//                     </Button>
//                 </Box>
//             </Box>
//             <ToastContainer />

//             {/* Confirmation Dialog */}
//             <Dialog
//                 open={isDialogOpen}
//                 onClose={handleCloseDialog}
//                 aria-labelledby="alert-dialog-title"
//                 aria-describedby="alert-dialog-description"
//             >
//                 <DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
//                 <DialogContent>
//                     <DialogContentText id="alert-dialog-description">
//                         Are you sure you want to delete this product? This action cannot be undone.
//                     </DialogContentText>
//                 </DialogContent>
//                 <DialogActions>
//                     <Button onClick={handleCloseDialog} sx={{ color: 'gray' }}>
//                         Cancel
//                     </Button>
//                     <Button
//                         onClick={() => {
//                             handleCloseDialog();
//                             handleDelete();
//                         }}
//                         color="error"
//                         autoFocus
//                     >
//                         Delete
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// };

// export default EditProduct;
