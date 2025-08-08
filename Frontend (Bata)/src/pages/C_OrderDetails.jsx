import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import http from '../http';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Typography, Divider, Grid, Paper, Button } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const OrderDetails = () => {
    const { id } = useParams();  // Get the orderId from the URL params
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const invoiceRef = useRef(null); // Ref for capturing invoice content

    const handleBacktoOrder = () => {
        navigate('/customerorder');
    };

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const response = await http.get(`/api/order/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,  // Pass token for authentication
                    },
                });
                setOrderDetails(response.data);
                console.log("Order details fetched successfully", response.data);
            } catch (err) {
                setError('Error fetching order details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);  // Re-fetch if the orderId changes

    const formatOrderDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0'); // Ensure day is 2 digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month and pad it if needed
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, '0'); // Ensure hours are 2 digits
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Ensure minutes are 2 digits
        const seconds = String(date.getSeconds()).padStart(2, '0'); // Ensure seconds are 2 digits

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };
    const handleDownloadInvoice = () => {
        const input = invoiceRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190; // A4 width (approx)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Invoice_${orderDetails.orderId}.pdf`);
        });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <Box sx={{ marginTop: '110px', width: '100%', marginLeft: '16%', width: '1120px' }}>
            <Box
                sx={{
                    width: "150px",
                    height: "80px",
                    position: "absolute",
                    right: "180px",
                    top: "130px",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: "column" // Stack children (icon & text) vertically
                }}
            >
                <Button
                    onClick={handleDownloadInvoice}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column', // Stack icon & text vertically
                        width: '100px',
                        height: '80px',
                        fontWeight: 'bold',
                        color: 'black',
                        textTransform: 'none', // Prevents uppercase text in button
                        gap: 1, // Adds spacing between icon and text
                    }}
                >
                    <PictureAsPdfIcon sx={{ fontSize: 35 }} />
                    <Typography variant="caption" sx={{ width: "120px", fontSize: "14px" }}>Download as PDF</Typography>
                </Button>
            </Box>
            <button className='back-button' onClick={handleBacktoOrder} style={{ marginTop: '10px' }}>
                <ArrowBackIcon />
            </button>
            <Paper sx={{ padding: '20px', boxShadow: 3 }}>
                <div ref={invoiceRef} style={{ padding: '20px', backgroundColor: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: "bold", color: "#333" }}>Invoice</Typography>
                    {/* Order Summary & Billing Details Headers */}
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555', marginTop: '10px' }}>
                                Order Summary
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#555', marginTop: '10px', marginRight: 48.3 }}>
                                Billing Details
                            </Typography>
                        </Grid>
                    </Grid>
                    <Divider sx={{ marginY: 2 }} />

                    {error && <Typography sx={{ color: 'red' }}>{error}</Typography>}

                    {orderDetails ? (
                        <>
                            <Grid container spacing={2}>
                                {/* Order Summary Information */}
                                <Grid item xs={12} md={6}>
                                    <Typography><strong>Order ID:</strong> {orderDetails.orderId}</Typography>
                                    <Typography><strong>Order Date:</strong> {formatOrderDate(orderDetails.orderDate)}</Typography>
                                    <Typography><strong>Status:</strong> {mapStatus(orderDetails.orderStatus)}</Typography>
                                    <Typography><strong>Full Name:</strong> {orderDetails.name}</Typography>
                                    <Typography><strong>Email:</strong> {orderDetails.email}</Typography>
                                    <Typography><strong>Shipping Address:</strong> {orderDetails.shippingAddress}, {orderDetails.unitNo}, {orderDetails.postalCode}</Typography>
                                    <Typography><strong>Contact Number:</strong> {orderDetails.contactNumber}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography><strong>Subtotal:</strong> ${orderDetails.subtotal.toFixed(2)}</Typography>
                                    <Typography><strong>Shipping Fee:</strong> ${orderDetails.shippingFee.toFixed(2)}</Typography>
                                    <Typography><strong>Discount:</strong> ${orderDetails.discount}</Typography>
                                </Grid>
                            </Grid>

                            {/* Divider for Order Items */}
                            <Divider sx={{ marginY: 2 }} />

                            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>Order Items</Typography>
                            {orderDetails.orderItems.length > 0 ? (
                                orderDetails.orderItems.map((item) => (
                                    <Grid container key={item.productId} spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Typography><strong>Product Name:</strong> {item.name}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography><strong>Size:</strong> {item.shoeSize}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography><strong>Quantity:</strong> {item.quantity}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography><strong>Price:</strong> ${(item.price).toFixed(2)}</Typography>
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Typography><strong>Total:</strong> ${(item.quantity * item.price).toFixed(2)}</Typography>
                                        </Grid>
                                    </Grid>
                                ))
                            ) : (
                                <Typography>No items in this order.</Typography>
                            )}
                            <Divider sx={{ marginY: 2 }} />
                            <Typography variant="h6" sx={{ textAlign: 'right' }}><strong>Total Amount: ${orderDetails.totalAmount.toFixed(2)}</strong></Typography>
                        </>
                    ) : (
                        <p>Loading order details...</p>
                    )}
                </div>
            </Paper>
        </Box>
    );
};

// Map numeric status to human-readable status
const mapStatus = (status) => {
    switch (status) {
        case 0:
            return "Processing";
        case 1:
            return "Shipped";
        case 2:
            return "Delivered";
        case 3:
            return "Cancelled";
        default:
            return "Unknown Status";
    }
};

export default OrderDetails;
