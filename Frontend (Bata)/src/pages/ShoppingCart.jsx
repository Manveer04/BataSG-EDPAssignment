import React, { useEffect, useState } from 'react';
import '../ShoppingCart.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import http from '../http';
import { useNavigate } from 'react-router-dom';

const ShoppingCart = ({ setCartCount }) => {
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [originalSubtotal, setOriginalSubtotal] = useState(0); // Store the original subtotal
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0); // Store discount percentage
    const [voucherid, setvoucherid] = useState(null); // Store discount percentage
    const [promoMessage, setPromoMessage] = useState(''); // Store promo code message
    const [shippingFee, setShippingFee] = useState(3.20); // Set your shipping fee
    const [promoCodeApplied, setPromoCodeApplied] = useState(false); // Track if promo code is applied
    const [totalAmount, setTotalAmount] = useState(0); // Track the total amount
    const [discountpercent, setdiscountpercent] = useState(0); // Track the total amount
    const navigate = useNavigate();

    useEffect(() => {
        http.get('/cartitem')
            .then((res) => {
                console.log("Cart items response:", res.data);
                setCartItems(res.data);
                calculateSubtotal(res.data);

                const totalQuantity = res.data.reduce((sum, item) => sum + item.quantity, 0);
                setCartCount(totalQuantity);
            })
            .catch((err) => console.error('Error fetching cart items:', err));
    }, [setCartCount]);

    const calculateSubtotal = (items) => {
        const total = items.reduce((sum, item) => {
            const price = parseFloat(item.product?.price || 0);
            return sum + item.quantity * price;
        }, 0);
        setSubtotal(total.toFixed(2));
        setOriginalSubtotal(total.toFixed(2)); // Save original subtotal
        calculateTotalAmount(total); // Calculate the total amount
    };

    // Calculate the total amount (subtotal + shipping fee - discount)
    const calculateTotalAmount = (subtotal) => {
        const total = (parseFloat(subtotal) + shippingFee - discount).toFixed(2);
        setTotalAmount(total);
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
                            ci.cartItemId === cartItemId
                                ? { ...ci, quantity: res.data.quantity, shoeSize: res.data.shoeSize }
                                : ci
                        );
                        setCartItems(updatedItems);
    
                        // Recalculate the subtotal immediately
                        const newSubtotal = updatedItems.reduce((sum, item) => {
                            const price = parseFloat(item.product?.price || 0);
                            return sum + item.quantity * price;
                        }, 0);
                        setSubtotal(newSubtotal.toFixed(2));
                        setOriginalSubtotal(newSubtotal.toFixed(2)); // Update the original subtotal
    
                        // Recalculate the total amount with the updated subtotal
                        calculateTotalAmount(newSubtotal);
    
                        // Reset promo code and discount whenever the quantity changes
                        setPromoCode('');
                        setDiscount(0);
                        setPromoMessage('');
                        setPromoCodeApplied(false);
                        setdiscountpercent(0);
                        setvoucherid(null);
    
                        // Update the cart count
                        const totalQuantity = updatedItems.reduce((sum, ci) => sum + ci.quantity, 0);
                        setCartCount(totalQuantity);
                    })
                    .catch((err) => {
                        console.error("Error updating quantity:", err.response?.data || err);
                    });
            })
            .catch((err) => console.error("Error fetching stock details:", err));
    };
    

    const handleRemoveItem = (cartItemId) => {
        http.delete(`/cartitem/${cartItemId}`)
            .then(() => {
                const updatedItems = cartItems.filter((ci) => ci.cartItemId !== cartItemId);
                setCartItems(updatedItems);

                // Reset promo code and discount when item is removed
                setPromoCode('');
                setDiscount(0);
                setPromoMessage('');
                setPromoCodeApplied(false);
                setdiscountpercent(0);
                setvoucherid(null);
                calculateSubtotal(updatedItems);
                const totalQuantity = updatedItems.reduce((sum, ci) => sum + ci.quantity, 0);
                setCartCount(totalQuantity);
            })
            .catch((err) => console.error('Error removing cart item:', err));
    };

    const handlePromoCodeApply = () => {
        // Reset the subtotal to the original price when applying a new promo code
        setSubtotal(originalSubtotal);
        setDiscount(0); // Reset the discount
        setPromoMessage(''); // Reset promo code message
        setPromoCodeApplied(false); // Reset promo code applied flag

        http.get(`/voucher/validate?search=${promoCode}`)
            .then((res) => {
                const voucher = res.data;
                if (!voucher || !voucher.discountPercentage) {
                    alert('Invalid or expired promo code.');
                    return;
                }
                // Apply the new promo code discount

                console.log("Voucher:", voucher.voucherId);
                const discountAmount = (originalSubtotal * voucher.discountPercentage) / 100;
                setDiscount(discountAmount);
                setPromoMessage(`Promo Code: ${promoCode} - ${voucher.discountPercentage}% off`);
                setPromoCodeApplied(true); // Mark promo code as applied
                setdiscountpercent(voucher.discountPercentage);
                setvoucherid(voucher.voucherId);
                // Recalculate the total amount after applying the promo code
                calculateTotalAmount(originalSubtotal);

                alert(`Promo code applied! ${voucher.discountPercentage}% off`);
            })
            .catch((err) => {
                console.error('Error applying promo code:', err);
                alert('Error validating promo code.');
            });
    };

    const handleCheckout = () => {
        navigate('/checkout', {
            state: { 
                discount: discount, 
                discountpercent: discountpercent,
                voucherid: voucherid // Pass the discount percent
            }
        });
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    
    return (
        <div className="shopping-cart">
            <div className="heading">
                <h1>Shopping Cart</h1>
            </div>
            <div className="cart-container">
                <div className="cart-items">
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Original Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th>Add to Wishlist</th>
                                <th>Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.cartItemId}>
                                    <td>
                                        <div className="product-info">
                                            <img
                                                src={`${import.meta.env.VITE_FILE_BASE_URL}${item.product?.image}`}
                                                alt={item.product?.name}
                                                className="product-image"
                                            />
                                            <div className="product-details">
                                                <h4>{item.product?.name}</h4>
                                                <h5 className="sub-details">Color: {item.product?.color}</h5>
                                                <h5 className="sub-details">Size: {item.shoeSize}</h5>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${item.product?.price}</td>
                                    <td>
                                        <div className="quantity-container">
                                            <button
                                                className="quantity-button"
                                                onClick={() => handleQuantityChange(item.cartItemId, -1)}
                                            >
                                                <RemoveIcon />
                                            </button>
                                            <input
                                                type="text"
                                                className="quantity-input"
                                                value={item.quantity}
                                                readOnly
                                            />
                                            <button
                                                className="quantity-button"
                                                onClick={() => handleQuantityChange(item.cartItemId, 1)}
                                            >
                                                <AddIcon />
                                            </button>
                                        </div>
                                    </td>
                                    <td>${(item.quantity * parseFloat(item.product?.price || 0)).toFixed(2)}</td>
                                    <td>
                                        <button className="save-for-later">Wishlist</button>
                                    </td>
                                    <td>
                                        <button className="remove-item" onClick={() => handleRemoveItem(item.cartItemId)}>
                                            <DeleteIcon style={{ fontSize: 25 }} color='error' />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="cart-summary">
                    <h2 style={{ marginTop: "0px"}}>Order Summary</h2>
                    <div className="promo-code-section">
                        <h3>Have a Promo Code?</h3>
                        <div className="promo-code-input">
                            <input
                                type="text"
                                placeholder="Enter Promo Code"
                                className="promo-input"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <button className="promo-apply-btn" onClick={handlePromoCodeApply}>
                                Apply
                            </button>
                        </div>
                    </div>
                    {promoCodeApplied && <p className="promo-applied-message" style={{ color: "green", marginTop: "-10px", fontSize: "15px" }}>Promo code applied successfully!</p>}
                    <ul style={{marginTop: "-10px"}}>
                        <li>✔ Secure Payments</li>
                        <li>✔ Free Delivery On All Orders</li>
                        <li>✔ Free 30 Day Returns</li>
                    </ul>
                    <div className="subtotal">
                        <p className='subtotal-text'>
                            Subtotal (incl GST): <span style={{ marginLeft: "111px" }}>${subtotal}</span>
                        </p>
                        <p className='subtotal-text2'>
                            Shipping Fee: <span style={{ marginLeft: "155px" }}>${shippingFee.toFixed(2)}</span>
                        </p>
                        {discount > 0 && (
                            <p className='subtotal-text2' style={{marginTop: "-10px"}}>
                                Promo Code ({discountpercent}%): <span style={{ marginLeft: "101px" }}>- ${discount.toFixed(2)}</span>
                            </p>
                        )}
                        <p className='subtotal-text3'>
                            Total Amount: <span style={{ fontWeight: 'bold', marginLeft: "134px" }}>${(totalAmount-discount).toFixed(2)}</span>
                        </p>
                    </div>
                    <button className="checkout-btn" onClick={handleCheckout}>
                        Proceed To Checkout
                    </button>
                    <div className="button-container">
                        <button className="continue-shopping" onClick={handleContinueShopping}>
                            <ArrowBackIcon style={{ fontSize: 22, marginRight: 10 }} />
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingCart;
