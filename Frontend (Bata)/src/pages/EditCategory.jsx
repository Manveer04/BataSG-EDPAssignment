import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';

function EditCategory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const [initialValues, setInitialValues] = useState({ category: '' });

    // Fetch categories from API
    useEffect(() => {
        http.get('/category')
            .then((res) => {
                console.log("Fetched Categories:", res.data); // ✅ Debugging
                setCategories(res.data);
            })
            .catch((err) => console.log("Error fetching categories:", err));
    }, []);

    useEffect(() => {
        http.get(`/category/${id}`).then((res) => setInitialValues(res.data));
    }, [id]);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validationSchema: yup.object({
            category: yup.string()
                .matches(/^[A-Za-z]+$/, 'Category must only contain uppercase and lowercase letters')
                .min(3, 'Must be at least 3 characters')
                .max(20, 'Must be at most 20 characters')
                .required('Category is required'),
        }),
        onSubmit: (values) => {
            http.put(`/category/${id}`, values)
                .then(() => navigate('/category'))
                .catch(console.error);
        },
    });

    const handleDelete = () => {
        http.delete(`/category/${id}`).then(() => navigate('/category')).catch(console.error);
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ my: 2 }}>Edit Category</Typography>
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
                <Button type="submit" variant="contained">Update</Button>
                <Button variant="contained" color="error" onClick={() => setOpen(true)} sx={{ ml: 2 }}>Delete</Button>
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete this category?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default EditCategory;