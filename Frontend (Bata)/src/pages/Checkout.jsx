import React, { useEffect, useState, useContext } from 'react';
import http from '../http';
import { useNavigate, useLocation  } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../css/Checkout.css';
import CloseIcon from '@mui/icons-material/Close';

const Checkout = () => {
    const [user, setUserData] = useState(null);  // Store user data
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [shippingFee, setShippingFee] = useState(3.20);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [unitNo, setUnitNo] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const location = useLocation();
    const [discount, setDiscount] = useState(0);
    const [discountpercent, setDiscountPercent] = useState(0);
    const [voucherid, setvoucherid] = useState(null); // Store discount percentage
    const [addressResults, setAddressResults] = useState([]); // To store API results
    const [latitude, setlatitude] = useState(null);
    const [longitude, setlongitude] = useState(null); 
    const [showMap, setShowMap] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Track visibility of dropdown
    const [searchTerm, setSearchTerm] = useState('');  // Track input field value
    const [encodedEwt, setEncodedEwt] = useState('JTNDcCUzRVlvdXIlMjBMb2NhdGlvbiUzQyUyRnAlM0U'); // Default encoded value
    const [contactNumberError, setContactNumberError] = useState('');
    const navigate = useNavigate();

    // Function to encode the search term
    const encodeSearchTerm = (text) => {
        // Wrap the text in <p> tags and encode it
        const wrappedText = `<p>${text}</p>`;
        // Convert to Base64
        const base64Encoded = btoa(wrappedText);
        // URL encode the Base64 string
        const urlEncoded = encodeURIComponent(base64Encoded);
        return urlEncoded;
    };
    
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


    // Fetch user data to get customerId
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const response = await http.get("/api/user/auth");
                    setUserData(response.data.user);
                    console.log("Authentication successful", response.data.user);
                } catch (error) {
                    console.error("Authentication failed", error);
                }
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const response = await http.get("api/user/addresses", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAddresses(response.data);
                console.log("Addresses:", response.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchAddresses();
    }, []);

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
        navigate('/shoppingcart');
    };

    const handleContinueToPayment = async (event) => {
        event.preventDefault();

        if (!email || !fullName || !contactNumber || !searchTerm || !postalCode || !unitNo) {
            alert('Please fill in all required fields.');
            return;
        }
    
        if (contactNumber.length !== 8) {
            alert('Phone number must be exactly 8 digits.');
            return;
        }
        
        // Create a new address directly without any condition
        const newAddress = {
            Name: fullName,
            UnitNo: unitNo,
            Street: searchTerm,
            PostalCode: postalCode,
            CustomerId: user.id, // Use the retrieved customer ID
        };

        try {
            const token = localStorage.getItem("accessToken");
            const response = await http.post(
                "api/user/addresses",
                newAddress,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Log the full response to inspect its structure
            console.log("Address creation response:", response.data);

            // Get the new address ID from the response
            const addressId = response.data.address.id; // 'id' is the addressId field in the response
            
            // Pass contactNumber, email, and newAddressId in URL query parameters
            setTimeout(() => {
                navigate(`/payment?contactNumber=${contactNumber}&email=${email}&shippingAddressId=${addressId}`, {
                    state: {
                        discount: discount,          // Pass discount value
                        discountpercent: discountpercent,
                        voucherid: voucherid // Pass discount percent value
                    }
                });
            }, 500); // Pass both contactNumber, email, and shippingAddressId
        } catch (error) {
            console.error(error);
            alert("Failed to add address.");
        }

        // Proceed to payment page
        navigate('/payment');
    };

    const openAddressModal = () => {
        setModalOpen(true);
    };

    const closeAddressModal = () => {
        setModalOpen(false);
    };

    // Fetch address suggestions from OneMap API
    const handleAddressSearch = async (event) => {
        const searchValue = event.target.value;
        setSearchTerm(searchValue);
        setShowMap(false); 

        if (!searchValue) {
            setAddressResults([]); // Clear the address list if search term is empty
            setShowMap(false); 
            setIsDropdownVisible(false); // Hide the dropdown
            setEncodedEwt('JTNDcCUzRVlvdXIlMjBMb2NhdGlvbiUzQyUyRnAlM0U'); // Reset to default
            return;
        }

        const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${searchValue}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
        const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTFjODYzMzRiNGZkNTQzOTExM2JlYzkyMzIxZWUxNSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTczODczNjA4OCwiZXhwIjoxNzM4OTk1Mjg4LCJuYmYiOjE3Mzg3MzYwODgsImp0aSI6IkYyVnFaUkJMT0JOTldDemsiLCJ1c2VyX2lkIjo1ODQxLCJmb3JldmVyIjpmYWxzZX0.LHnZCd4qE7sE-oG85NOJqSiEtpCcm7x75VcY07gjelM';  // Replace with your access token

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `${authToken}`,
                },
            });

            const data = await response.json();
            setAddressResults(data.results || []);
            setIsDropdownVisible(data.results.length > 0); // Show dropdown only if results exist
        } catch (error) {
            console.error('Error fetching address data:', error);
        }
    };

    // Handle address selection
    const handleAddressSelect2 = (address) => {
        setPostalCode(address.POSTAL); // Set the postal code
        setSearchTerm(address.ADDRESS); // Set search term to the full address
        setlatitude(address.LATITUDE);
        setlongitude(address.LONGITUDE);
        setShowMap(true); 
        setIsDropdownVisible(false); // Hide the dropdown once an address is selected
        setAddressResults([]); // Clear the suggestions list
        // Encode the selected address and update the state
        const encodedValue = encodeSearchTerm(address.ADDRESS);
        setEncodedEwt(encodedValue);
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address.id); // Set the selected address ID
        setSearchTerm(address.street);   // Auto-fill street
        setUnitNo(address.unitNo);   // Auto-fill unitNo
        setPostalCode(address.postalCode); // Auto-fill postal code
    };

    // Only allow alphabetic characters for full name
    const handleFullNameChange = (e) => {
        const value = e.target.value;
        const regex = /^[a-zA-Z\s]*$/; // Only allow alphabets and spaces
        if (regex.test(value)) {
            setFullName(value);
        }
    };

    // Only allow digits for phone number
    const handlePhoneNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Allow only numbers
    
        if (value.length > 8) return; // Prevent input beyond 8 digits
    
        setContactNumber(value);
    
        if (value.length !== 8) {
            setContactNumberError('Phone number must be exactly 8 digits.');
        } else {
            setContactNumberError('');
        }
    };

    // Only allow digits for postal code
    const handlePostalCodeChange = (e) => {
        const value = e.target.value;
        const regex = /^[0-9]*$/; // Only allow digits
        if (regex.test(value)) {
            setPostalCode(value);
        }
    };

    return (
        <div className="checkout-container">
            <div className="checkout-left">
                <button className='back-button' onClick={handleBacktoCart}>
                    <ArrowBackIcon />
                </button>
                <h2 style={{ fontWeight: "bold"}}>Contact Information</h2>
                <label className='existaddress' onClick={openAddressModal}>Existing address</label>
                <form className="contact-form" onSubmit={handleContinueToPayment}>
                    <label>Email</label>
                    <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />

                    <label style={{ marginTop: "10px" }}>Shipping Information</label>
                    <input type="text" placeholder="Full Name" value={fullName} onChange={handleFullNameChange} required />
                    <input
                        type="text"
                        placeholder="Address"
                        value={searchTerm}
                        onChange={handleAddressSearch}
                    />
                     {isDropdownVisible && addressResults.length > 0 && (
                        <div className="address-dropdown">
                            {addressResults.map((address, index) => (
                                <div key={index} onClick={() => handleAddressSelect2(address)} className="address-item2">
                                    <p>{address.ADDRESS}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Embed Google Map iframe only if showMap is true */}
                    {showMap && latitude && longitude && (
                        <div style={{ marginTop: "5px" }}>
                            <iframe
                            src={`https://www.onemap.gov.sg/minimap/minimap.html?mapStyle=Default&zoomLevel=17&latLng=${latitude},${longitude}&ewt=${encodedEwt}&popupWidth=200&showPopup=true`}
                            height="350"
                            width="550"
                            scrolling="no"
                            frameborder="0"
                            allowfullscreen="allowfullscreen"
                        ></iframe>
                        </div>
                    )}
                    <input type="text" placeholder="Unit Number, Apartment, Suite, etc." value={unitNo} onChange={e => setUnitNo(e.target.value)} />
                    <input type="text" placeholder="Postal code" value={postalCode} onChange={handlePostalCodeChange} required />
                    <input 
                    type="text" 
                    placeholder="Phone number" 
                    value={contactNumber} 
                    onChange={handlePhoneNumberChange} 
                    required
                    maxLength={8} // Prevent input beyond 8 digits
                />
                {contactNumberError && <p className="error-message">{contactNumberError}</p>}

                    <div className='check'>
                        <input type="checkbox" required />
                        <p>I agree to Bata's <a href="https://www.bata.com.sg/pages/terms-conditions-website" target='_blank'>Terms & Conditions</a> and <a href="https://www.bata.com.sg/pages/privacy-policy" target='_blank'>Privacy Policy</a></p>
                    </div>
                    <button className="continue-button" type="submit">Continue to Payment</button>
                </form>

                {/* Modal for address selection */}
                {modalOpen && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2 style={{ marginRight: 0 }}>Select an Address</h2>
                            <CloseIcon style={{position: "absolute", marginTop: "-60px", marginLeft: "230px", fontSize: "40px", cursor: "pointer"}} onClick={closeAddressModal} />
                            {addresses.length > 0 && (
                                <div className="address-selection">
                                    {addresses.map((address) => (
                                        <div key={address.id} className="address-item">
                                            <input
                                                type="radio"
                                                name="address"
                                                value={address.id}
                                                checked={selectedAddress === address.id}
                                                onChange={() => handleAddressSelect(address)}  // Add this line for autofill
                                                className="address-radio"
                                            />
                                            <label>
                                                <span className="address-name">{address.name}</span><br />
                                                <span className="address-details">
                                                    {address.street}, {address.unitNo}, {address.postalCode}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="checkout-right">
                <h2 style={{ fontWeight: "bold"}}>Order Review</h2>
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

export default Checkout;
