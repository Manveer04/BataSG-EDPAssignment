import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Divider, Grid, Paper, Button } from '@mui/material';
import http from '../http';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const OrderSummary = () => {
    const [orderDetails, setOrderDetails] = useState(null);
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const emailSentRef = useRef(false); // Track if email has been sent
    const invoiceRef = useRef(null); // Ref for capturing invoice content


    // Retrieve the orderId from the state passed to this page
    const { orderId } = location.state || {}; // Default to an empty object if no state is passed

    useEffect(() => {
        if (!orderId) {
            setError('No order ID provided.');
            return;
        }

        // Fetch order details by ID
        http.get(`/api/order/${orderId}`)
            .then((response) => {
                setOrderDetails(response.data); // Set the order details in state
                console.log(response.data);

                // Send email only once
                if (!emailSentRef.current) {
                    handleSendInvoice(response.data);
                    emailSentRef.current = true; // Mark email as sent
                }
            })
            .catch((err) => {
                setError('Error fetching order details');
                console.error(err);
            });
    }, [orderId]); // Only runs when `orderId` changes

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

    const handleSendInvoice = (order) => {
        const templateParams = {
            to_name: order.name,
            reply_to: order.email,
            orderId: order.orderId,
            orderDate: formatOrderDate(order.orderDate),
            orderStatus: mapStatus(order.orderStatus),
            fullname: order.name,
            shippingAddress: `${order.shippingAddress}, ${order.unitNo}, ${order.postalCode}`,
            contactNumber: order.contactNumber,
            subtotal: order.subtotal.toFixed(2),
            shippingFee: order.shippingFee.toFixed(2),
            discount: order.discount ? order.discount.toFixed(2) : '0.00',
            totalAmount: order.totalAmount.toFixed(2),
            orderItems: order.orderItems.map(item => `${item.name}, Quantity: ${item.quantity}, Price: $${item.price.toFixed(2)}, Total Amount: $${(item.quantity * item.price).toFixed(2)}`).join('\n'),
        };

        emailjs.send('service_l382v13', 'template_nq9gsjw', templateParams, 'OGwI4NsyrhcxVEpgC')
            .then((result) => {
                console.log('Email successfully sent!', result.status, result.text);
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
                console.log('Email already sent. Skipping.');
            });
    };

    return (
        <Box sx={{ marginTop: '110px', width: '100%', marginLeft: '16%', width: '1120px', marginBottom: "30px"}}>
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
            <Button
                variant="contained"
                onClick={() => {
                    navigate(`/`);
                    window.location.reload(); // Refresh the page
                }}
                sx={{ width: '20%', marginTop: '30px', fontWeight: 'bold', marginLeft: '40%', height: '45px', backgroundColor: '#00B700', color: 'white' }}
            >
                Return to HomePage
            </Button>

        </Box>
    );
};

// Helper function to map order status to human-readable text
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

export default OrderSummary;
