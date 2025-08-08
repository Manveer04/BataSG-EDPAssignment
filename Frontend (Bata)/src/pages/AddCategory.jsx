import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

function AddCategory() {
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            category: '',
        },
        validationSchema: yup.object({
            category: yup.string()
                .matches(/^[A-Za-z]+$/, 'Category must only contain uppercase and lowercase letters')
                .min(3, 'Must be at least 3 characters')
                .max(20, 'Must be at most 20 characters')
                .required('Category is required'),
        }),
        onSubmit: (values) => {
            http.post('/category', values)
                .then(() => navigate('/category'))
                .catch(console.error);
        },
    });

    return (
        <Box sx={{ marginTop: "90px", marginLeft: "100px"}}>
                              <CustomerSidebar /> {/* Sidebar for customer account pages */}
            <Typography variant="h5" sx={{ my: 2 }}>Add Category</Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                    label="Category"
                    name="category"
                    fullWidth
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                    helperText={formik.touched.category && formik.errors.category}
                    margin="normal"
                />
                <Button type="submit" variant="contained" sx={{mt: 2}}>Add</Button>
            </Box>
        </Box>
    );
}

export default AddCategory;