import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Button, TextField, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CreateVoucher = () => {
    const navigate = useNavigate();

    // ✅ Validation schema with `maxUsage` (removed `usageCount`)
    const validationSchema = yup.object({
        code: yup
            .string()
            .trim()
            .min(5, 'Code must be at least 5 characters long')
            .max(30, 'Code cannot exceed 30 characters')
            .required('Voucher code is required'),
        discountPercentage: yup
            .number()
            .min(1, 'Discount must be at least 1%')
            .max(100, 'Discount cannot exceed 100%')
            .required('Discount percentage is required'),
        expiryDate: yup
            .date()
            .min(new Date(), 'Expiry date cannot be in the future')
            .required('Expiry date is required'),
        maxUsage: yup
            .number()
            .min(1, 'Max usage must be greater than 0')
            .required('Max usage is required'),
    });

    // ✅ Formik hook for form handling
    const formik = useFormik({
        initialValues: {
            code: '',
            discountPercentage: '',
            expiryDate: '',
            maxUsage: '', // ✅ New field added
            isActive: true,
        },
        validationSchema,
        onSubmit: (values, { resetForm }) => {
            const requestData = {
                ...values,
                usageCount: 0, // ✅ Always starts at 0 (not in the form)
            };

            http.post('/voucher', requestData)
                .then(() => {
                    navigate('/vouchers', { state: { toastMessage: 'Voucher created successfully!' } });
                    resetForm();
                })
                .catch((err) => {
                    console.error('Error creating voucher:', err);
                    toast.error('Failed to create voucher');
                });
        },
    });

    return (
        <Container maxWidth="sm" sx={{ mt: 4, marginTop: '90px', textAlign: 'center', marginLeft: '35%' }}>
            <ToastContainer />
            <Typography variant="h4" gutterBottom>
                Create Voucher
            </Typography>
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    mt: 2,
                }}
            >
                <TextField
                    fullWidth
                    label="Voucher Code"
                    name="code"
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.code && Boolean(formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                />
                <TextField
                    fullWidth
                    type="number"
                    label="Discount Percentage"
                    name="discountPercentage"
                    value={formik.values.discountPercentage}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.discountPercentage && Boolean(formik.errors.discountPercentage)}
                    helperText={formik.touched.discountPercentage && formik.errors.discountPercentage}
                />
                <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date"
                    name="expiryDate"
                    value={formik.values.expiryDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.expiryDate && Boolean(formik.errors.expiryDate)}
                    helperText={formik.touched.expiryDate && formik.errors.expiryDate}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    fullWidth
                    type="number"
                    label="Max Usage"
                    name="maxUsage"
                    value={formik.values.maxUsage}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.maxUsage && Boolean(formik.errors.maxUsage)}
                    helperText={formik.touched.maxUsage && formik.errors.maxUsage}
                />
                <Button
                    type="submit"
                    variant="contained"
                    sx={{
                        mt: 2,
                        backgroundColor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#1565c0',
                        },
                    }}
                >
                    Create Voucher
                </Button>
            </Box>
        </Container>
    );
};

export default CreateVoucher;
