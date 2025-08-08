import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import { Box, Button, TextField, Typography, Container } from '@mui/material';

const EditVoucher = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [originalMaxUsage, setOriginalMaxUsage] = useState(0);
    const [currentUsageCount, setCurrentUsageCount] = useState(0);

    useEffect(() => {
        // Fetch voucher data by ID
        http.get(`/voucher/${id}`)
            .then((res) => {
                const data = res.data;

                // Format expiry date to yyyy-MM-dd
                const formattedDate = format(new Date(data.expiryDate), 'yyyy-MM-dd');

                setOriginalMaxUsage(data.maxUsage);
                setCurrentUsageCount(data.usageCount);

                formik.setValues({
                    ...data,
                    expiryDate: formattedDate,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching voucher:', err);
                toast.error('Failed to load voucher data');
                setLoading(false);
            });
    }, [id]);

    // ✅ Validation schema with conditional maxUsage validation
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
            .min(new Date(), 'Expiry date cannot be in the past')
            .required('Expiry date is required'),
        maxUsage: yup
            .number()
            .min(1, 'Max usage must be greater than 0')
            .test('is-greater-when-usage-full', 'New max usage must be greater than the original when usage is full', function (value) {
                return currentUsageCount === originalMaxUsage ? value > originalMaxUsage : true;
            })
            .required('Max usage is required'),
        isActive: yup.boolean().required('Active status is required'),
    });

    const formik = useFormik({
        initialValues: {
            code: '',
            discountPercentage: '',
            expiryDate: '',
            maxUsage: '',
            isActive: true,
        },
        validationSchema,
        onSubmit: (values) => {
            const updatedValues = {
                ...values,
                isActive: values.isActive === "true" || values.isActive === true,
            };

            http.put(`/voucher/${id}`, updatedValues)
                .then(() => {
                    navigate('/vouchers', { state: { toastMessage: 'Voucher updated successfully!' } });
                })
                .catch((err) => {
                    console.error('Error updating voucher:', err);
                    toast.error('Failed to update voucher');
                });
        },
    });

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, marginTop: '90px', textAlign: 'center', marginLeft: '37%' }}>
            <ToastContainer />
            <Typography variant="h4" gutterBottom>
                Edit Voucher
            </Typography>
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    mt: 6,
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
                <TextField
                    fullWidth
                    select
                    label="Is Active"
                    name="isActive"
                    value={formik.values.isActive}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.isActive && Boolean(formik.errors.isActive)}
                    helperText={formik.touched.isActive && formik.errors.isActive}
                    SelectProps={{
                        native: true,
                    }}
                >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                </TextField>
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
                    Save Changes
                </Button>
            </Box>
        </Container>
    );
};

export default EditVoucher;
