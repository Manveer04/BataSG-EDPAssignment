import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, Box, Typography, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import http from '../http';
import '../ShoppingCart.css';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

const CartSidebar = ({ isOpen, onClose, setCartCount  }) => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);

    useEffect(() => {
        if (isOpen) {
            http.get('/cartitem')
                .then((res) => {
                    setCartItems(res.data);
                    calculateSubtotal(res.data); // Calculate subtotal immediately after fetching cart items
                    console.log(res.data)
                    // Calculate total quantity for the cart badge
                    const totalQuantity = res.data.reduce((sum, item) => sum + item.quantity, 0);
                    setCartCount(totalQuantity);
                })
                .catch((err) => console.error('Error fetching cart:', err));
        }
    }, [isOpen]);

    const calculateSubtotal = (items) => {
        const total = items.reduce((sum, item) => {
            const price = parseFloat(item.product?.price || 0);
            return sum + item.quantity * price;
        }, 0);
        setSubtotal(total.toFixed(2));
    };

    const handleRemoveItem = (cartItemId) => {
        http.delete(`/cartitem/${cartItemId}`)
            .then(() => {
                const updatedItems = cartItems.filter((ci) => ci.cartItemId !== cartItemId);
                setCartItems(updatedItems);
                calculateSubtotal(updatedItems);

                // Update the total quantity for the cart badge
                const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                setCartCount(totalQuantity);
            })
            .catch((err) => console.error('Error removing cart item:', err));
    };

    const handleQuantityChange = (cartItemId, increment) => {
        const item = cartItems.find((ci) => ci.cartItemId === cartItemId);
        if (!item) return;
    
        const newQuantity = item.quantity + increment;
        if (newQuantity < 1) return;
    
        // Fetch stock details for the product size
        http.get(`/stock/product/${item.productId}`)
            .then((res) => {
                const stockData = res.data || {};
                const stockKey = `size${item.shoeSize}`;
                const maxStock = stockData[stockKey] || 0;
    
                // Ensure the total quantity in cart doesn't exceed stock limit
                if (newQuantity > maxStock) {
                    console.warn("Error: Cannot exceed available stock.");
                    return;
                }
    
                // ✅ Log the payload before making the request
                const payload = {
                    quantity: newQuantity,
                    shoeSize: item.shoeSize, // Ensure this is an integer
                };
                console.log("PUT request payload:", payload);
    
                // ✅ Fix: Send `shoeSize` properly formatted
                http.put(`/cartitem/${cartItemId}`, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .then((res) => {
                        console.log("Updated cart item response:", res.data);
                        const updatedItems = cartItems.map((ci) =>
                            ci.cartItemId === cartItemId ? { ...ci, quantity: res.data.quantity, shoeSize: res.data.shoeSize } : ci
                        );
                        setCartItems(updatedItems);
                        calculateSubtotal(updatedItems);
    
                        // Update the total quantity for the cart badge
                        const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                        setCartCount(totalQuantity);
                    })
                    .catch((err) => {
                        console.error("Error updating quantity:", err.response?.data || err);
                    });
            })
            .catch((err) => console.error("Error fetching stock details:", err));
    };
    
    
    

    const onCheckout = () => {
        console.log('Checkout clicked');
        // Navigate to checkout or perform checkout logic
        navigate(`/shoppingcart`);
    };

    const handleClose = () => {
        onClose(); // Close the sidebar
        window.location.reload(); // Refresh the page
    };

    return (
        <Drawer
            anchor="right"
            open={isOpen}
            onClose={handleClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: '350px',
                    padding: '16px',
                    paddingTop: '56px', // Add padding top to make space for the top bar
                },
            }}
        >
            <Box
            sx={{
                position: 'fixed',
                width: '350px',
                height: '40px',
                top: 0,
                backgroundColor: 'white',
                paddingTop: '16px',
            }}
            >
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                    Your Cart: {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Item
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}
                </Typography>
                <CloseOutlinedIcon
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: '0px',
                        top: '15px',
                        fontSize: 30,
                        cursor: 'pointer',
                    }}
                ></CloseOutlinedIcon>
            </Box>
            {cartItems.length === 0 ? (
                <Typography>Your cart is empty.</Typography>
            ) : (
                <Box sx={{
                    height: '570px',
                    width: '100%',
                    overflowY: 'auto',
                    paddingRight: '16px',
                }}
                >
                    {cartItems.map((item) => (
                        <Box
                            key={item.productId}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                borderBottom: '1px solid #ddd',
                                pb: 2,
                            }}
                        >
                            <img
                                src={`${import.meta.env.VITE_FILE_BASE_URL}${item.product?.image}`}
                                alt={item.product?.name}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '8px',
                                    marginRight: '16px',
                                }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold'}}>
                                    {item.product?.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555' }}>
                                    Color: {item.product?.color} | Size: {item.shoeSize}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mt: 1,
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        width: 'fit-content',
                                        padding: '2px', // Smaller padding
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => handleQuantityChange(item.cartItemId, -1)}
                                        sx={{
                                            padding: '4px', // Smaller padding for the button
                                        }}
                                    >
                                        <RemoveIcon fontSize="small" /> {/* Smaller icon size */}
                                    </IconButton>
                                    <Typography
                                        sx={{
                                            mx: 0.5, // Reduce horizontal margin
                                            fontSize: '0.85rem', // Smaller font size
                                        }}
                                    >
                                        {item.quantity}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleQuantityChange(item.cartItemId, 1)}
                                        sx={{
                                            padding: '4px', // Smaller padding for the button
                                        }}
                                    >
                                        <AddIcon fontSize="small" /> {/* Smaller icon size */}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    ${item.product?.price}
                                </Typography>
                                {item.product?.originalPrice && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            textDecoration: 'line-through',
                                            color: '#888',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        ${item.product?.originalPrice}
                                    </Typography>
                                )}
                                <IconButton
                                    size="small"
                                    color='error'
                                    onClick={() => handleRemoveItem(item.cartItemId)}
                                    sx={{ mt: 1 }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
            {/* Bottom Section */}
            {cartItems.length > 0 && (
                <Box
                    sx={{
                        position: 'fixed',
                        width: '350px',
                        height: '120px',
                        bottom: 0,
                        backgroundColor: 'white',
                        paddingTop: '16px',
                    }}
                >
                    <p className='subtotal-text'>
                        Subtotal (incl GST): <span style={{ fontWeight: 'bold'}}>${subtotal}</span>
                    </p>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            marginTop: '20px',
                            backgroundColor: '#00B700',
                            color: 'white',
                            borderRadius: '30px',
                            fontWeight: "bold"
                        }}
                        onClick={onCheckout}
                    >
                        View cart & Checkout
                    </Button>
                </Box>
            )}
        </Drawer>
    );
};

export default CartSidebar;
