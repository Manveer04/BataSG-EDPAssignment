import React, { useEffect, useState } from 'react';
import http from '../http';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BCard from '../assets/credit-card-back.png';
import Visa from '../assets/visa.png';
import Mastercard from '../assets/mastercard.png';
import '../css/Checkout.css';

const Payment = () => {
    const [contactNumber, setContactNumber] = useState('');
    const [email, setEmail] = useState('');
    const [shippingAddressId, setshippingAddressId] = useState('');
    const location = useLocation();
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [shippingFee, setShippingFee] = useState(3.20);
    const [discount, setDiscount] = useState(0.00);
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');
    const [error, setError] = useState('');
    const [discountpercent, setDiscountPercent] = useState(0);
    const [voucherid, setvoucherid] = useState(null); // Store discount percentage
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardBrand, setCardBrand] = useState(''); // Track card brand (Visa or Mastercard)
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.discount) {
            setDiscount(location.state.discount);
        }
        if (location.state?.discountpercent) {
            setDiscountPercent(location.state.discountpercent);
        }
        if (location.state?.voucherid) {
            setvoucherid(location.state.voucherid);
            console.log("Voucher ID: ", voucherid);
        }
    }, [location.state]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const contact = queryParams.get('contactNumber');
        const userEmail = queryParams.get('email');
        const shippingAddressId = queryParams.get("shippingAddressId");

        if (contact) {
            setContactNumber(contact);
        }

        if (userEmail) {
            setEmail(userEmail);
        }

        if (shippingAddressId) {
            setshippingAddressId(shippingAddressId);
        }
    }, [location]);

    // Fetch cart items from the backend
    useEffect(() => {
        http.get('/cartitem')
            .then((res) => {
                setCartItems(res.data);
                calculateSubtotal(res.data);
            })
            .catch((err) => console.error('Error fetching cart items:', err));
    }, []);

    const calculateSubtotal = (items) => {
        const total = items.reduce((sum, item) => {
            const price = parseFloat(item.product?.price || 0);
            return sum + item.quantity * price;
        }, 0);
        setSubtotal(total.toFixed(2)); // Set the initial subtotal
    };

    const handleBacktoCart = () => {
        navigate('/checkout');
    };

    // Format the card number with spaces every 4 digits
    const formatCardNumber = (value) => {
        value = value.replace(/\D/g, '');  // Remove all non-digit characters
        return value.replace(/(\d{4})(?=\d)/g, '$1 '); // Add space after every 4 digits
    };

    // Handle Card Number input and restrict to 16 digits
    const handleCardNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length <= 16) {
            setCardNumber(formatCardNumber(value));
            if (value.startsWith('4')) {
                setCardBrand('visa'); // Set to Visa
            } else if (value.startsWith('5')) {
                setCardBrand('mastercard'); // Set to Mastercard
            } else {
                setCardBrand(''); // Unknown card type
            }
        }
    };

    const handleNameOnCardChange = (e) => {
        const value = e.target.value;
        // Only allow alphabets and spaces
        const regex = /^[a-zA-Z\s]*$/;
        if (regex.test(value)) {
            setNameOnCard(value);
        }
    };

    // Handle Expiry Date input (MM/YY format)
    const handleExpiryDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters

        if (value.length >= 2) {
            // Insert the slash after the second digit (MM/YY format)
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }

        if (value.length <= 5) {
            setExpiryDate(value);
        }
    };


    // Handle CVV input (Only 3 digits)
    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length <= 3) {
            setCvv(value);
        }
    };

    // Validate input fields
    const validateFields = () => {
        if (!cardNumber || !expiryDate || !cvv || !nameOnCard) {
            setError("All fields are required.");
            return false;
        }

        // Validate Card Number (Only digits and 16 digits)
        if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
            setError("Card number must be 16 digits.");
            return false;
        }

        // Validate Expiry Date (MM/YY format and check if the date is in the future)
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            setError("Expiry date must be in MM/YY format.");
            return false;
        }
    
        const [month, year] = expiryDate.split('/').map(num => parseInt(num));
        const today = new Date();
        const expiryDateObj = new Date(`20${year}`, month - 1); // MM/YY to Date object
    
        if (month < 1 || month > 12) {
            setError("Month must be between 01 and 12.");
            return false;
        }
    
        if (expiryDateObj < today) {
            setError("Expiry date cannot be in the past.");
            return false;
        }

        // Validate CVV (Only digits)
        if (!/^\d{3}$/.test(cvv)) {
            setError("CVV must be 3 digits.");
            return false;
        }

        // Validate Name on Card (Only alphabets and spaces)
        if (!/^[a-zA-Z\s]*$/.test(nameOnCard)) {
            setError("Name on card must only contain letters and spaces.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateFields()) return;
        
        setIsSubmitting(true);
        setError('');
    
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
        const paymentData = {
            cardNumber: cleanCardNumber,
            expiryDate,
            cvv,
            amount: (parseFloat(subtotal) + parseFloat(shippingFee)).toFixed(2),
        };
    
        try {
            const response = await http.post('/api/payment/process-payment', paymentData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
    
            const paymentId = response.data.paymentId;
    
            // Create the order data
            const orderData = {
                contactNumber,
                email,
                shippingAddressId,
                paymentId,
                subtotal: parseFloat(subtotal),
                shippingFee: parseFloat(shippingFee),
                totalAmount: (parseFloat(subtotal) + parseFloat(shippingFee)-parseFloat(discount)).toFixed(2),
                discount: parseFloat(discount.toFixed(2)),
                voucherId: voucherid,  // Pass null if there's no voucher
            };
    
            console.log(orderData);  // Log orderData before sending it to the backend
    
            // Now create the order
            const orderResponse = await http.post('/api/order', orderData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

        // **Update Stock for each ordered item**
        // **Update Stock for each ordered item**
for (const item of cartItems) {
    const sizeKey = `size${item.shoeSize}`;  // Convert shoe size into stock field (e.g., size5)

    try {
        // Fetch current stock details
        const stockResponse = await http.get(`/stock/product/${item.productId}`);
        let updatedStock = stockResponse.data;

        console.log("Existing Stock Data:", updatedStock);
        console.log("Updating Stock for:", sizeKey);

        if (updatedStock[sizeKey] !== undefined) {
            updatedStock[sizeKey] = Math.max(0, updatedStock[sizeKey] - item.quantity); // Reduce stock

            console.log(`Updated ${sizeKey}: ${updatedStock[sizeKey]}`);

            // **Ensure the full stock object is sent in PUT request**
            const updatedStockPayload = {
                size5: updatedStock.size5,
                size6: updatedStock.size6,
                size7: updatedStock.size7,
                size8: updatedStock.size8,
                size9: updatedStock.size9,
                size10: updatedStock.size10,
                size11: updatedStock.size11,
                size12: updatedStock.size12,
                productId: item.productId // ✅ Ensure productId is included
            };
            
            console.log("🔼 Sending Stock Update Request...");
            console.log("Updated Stock Payload:", JSON.stringify(updatedStockPayload, null, 2));
            
            await http.put(`/stock/product/${item.productId}`, updatedStockPayload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            }).then((res) => {
                console.log("✅ Stock successfully updated:", res.data);
            }).catch((err) => {
                console.error("❌ Error updating stock:", err.response?.data || err);
            });
            

            console.log(`Stock updated for Product ID ${item.productId}, Size ${item.shoeSize}`);
        } else {
            console.error(`Stock key ${sizeKey} not found in database for Product ID ${item.productId}`);
        }
    } catch (err) {
        console.error(`Error updating stock for Product ID ${item.productId}`, err);
    }
}



            // **Increment Voucher Usage Count if a Voucher is Used**
            if (voucherid !== null) {
                try {
                    await http.put(`/voucher/${voucherid}/incrementUsage`, null, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                    });
                    console.log(`Voucher ${voucherid} usage incremented.`);
                } catch (err) {
                    console.error("Error updating voucher usage:", err);
                }
            }
            console.log("Order created successfully:", orderResponse.data);
            console.log(voucherid);
    
            // Redirect to the order confirmation page
            navigate("/loading", {
                state: {
                    orderId: orderResponse.data.orderId, // Pass orderId here
                },
            });
        } catch (error) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (errorData.errors) {
                    // Display detailed error message to the user
                    const errorMessages = Object.entries(errorData.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
                        .join(" ");
                    setError(errorMessages);
                } else {
                    setError('An unknown error occurred while creating the order.');
                }
            } else {
                setError('An error occurred while processing your payment.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    
    


    return (
        <div className="checkout-container">
            <div className="checkout-left">
                <button className='back-button' onClick={handleBacktoCart}>
                    <ArrowBackIcon />
                </button>
                <h2>Payment Information</h2>
                {error && <div className="error-message">{error}</div>}
                <form className="contact-form" onSubmit={handleSubmit}>
                    <label style={{ marginTop: "10px" }}>Credit Card Information</label>
                    <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        required
                    />
                    {cardBrand === 'visa' && <img src={Visa} alt="Visa" className="card-icon" />}
                    {cardBrand === 'mastercard' && <img src={Mastercard} alt="Mastercard" className="card-icon" />}

                    <input
                        type="text"
                        placeholder="Expiration date (MM/YY)"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        required
                    />
                    <input
                        type="text"
                        placeholder="CVV"
                        value={cvv}
                        onChange={handleCvvChange}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Name on Card"
                        value={nameOnCard}
                        onChange={handleNameOnCardChange}  // Use the new handler
                        required
                    />
                    <button className="continue-button" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : "Confirm Payment"}
                    </button>
                </form>
            </div>

            <div className="checkout-right">
                <h2>Order Review</h2>
                {cartItems.map((item) => (
                    <div className="order-item" key={item.cartItemId}>
                        <img src={`${import.meta.env.VITE_FILE_BASE_URL}${item.product?.image}`} alt={item.product?.name} className="order-item-image" />
                        <div className="order-item-details">
                            <p><span>{item.product?.name}</span></p>
                            <p><span>Colour:</span> {item.product?.color}</p>
                            <p><span>Size:</span> {item.shoeSize}</p>
                            <p><span>Quantity:</span> {item.quantity}</p>
                            <p className='itemprice'>${(item.product?.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
                <div className="order-summary">
                    <p style={{ fontWeight: "normal"}}>Subtotal: <span style={{ marginLeft: "300px"}}>${subtotal}</span></p>
                    <p style={{ fontWeight: "normal"}}>Shipping: <span style={{ marginLeft: "296px"}}>${shippingFee.toFixed(2)}</span></p>
                    {/* Only display Promo Code if discountpercent is not 0 */}
                    {discountpercent !== 0 && (
                            <p style={{ fontWeight: "normal" }}>
                                Promo Code ({discountpercent}%): <span style={{ marginLeft: "220px"}}>-${discount.toFixed(2)}</span>
                            </p>
                        )}
                    <p style={{ fontSize: "20px"}}>Total: <span style={{ marginLeft: "310px"}}>${(parseFloat(subtotal) + parseFloat(shippingFee)-parseFloat(discount)).toFixed(2)}</span></p>
                </div>
            </div>
        </div>
    );
};

export default Payment;
