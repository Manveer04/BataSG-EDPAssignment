import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Card, CardMedia, CardContent, IconButton, Button, Grid } from '@mui/material';
import { Formik, Form } from 'formik';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import http from '../http';
import CartSidebar from './CartSidebar';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [stock, setStock] = useState({});
    const [selectedSize, setSelectedSize] = useState("");
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        http.get(`/product/${id}`)
            .then(res => setProduct(res.data))
            .catch(err => console.error('Error fetching product details:', err));

        http.get(`/stock/product/${id}`)
            .then(res => setStock(res.data || {}))
            .catch(err => console.error('Error fetching stock details:', err));
    }, [id]);

    if (!product || !stock) {
        return <Typography>Loading...</Typography>;
    }

    const images = [product.image, product.imageFile2, product.imageFile3].filter(Boolean);

    const handleImageChange = (direction) => {
        let newIndex = activeImage + direction;
        if (newIndex < 0) newIndex = images.length - 1;
        else if (newIndex >= images.length) newIndex = 0;
        setActiveImage(newIndex);
    };

    const handleQuantityChange = (increment) => {
        if (!selectedSize || stock[selectedSize] === undefined) return;

        // Get the max stock for the selected size
        const maxStock = stock[selectedSize];

        // Fetch current cart items to check existing quantity for the same product & shoe size
        http.get('/cartitem')
            .then((res) => {
                const cartItems = res.data || [];

                // Find if the same product and shoe size already exist in the cart
                const existingCartItem = cartItems.find(
                    (item) => item.productId === product.productId && item.shoeSize === parseInt(selectedSize.substring(4), 10)
                );

                const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;
                const totalRequestedQuantity = existingQuantity + quantity + increment;

                if (totalRequestedQuantity > maxStock) {
                    console.warn("Error: Cannot exceed available stock.");
                    return;
                }

                // Proceed with updating quantity if within stock limit
                const newQuantity = quantity + increment;
                if (newQuantity >= 1) {
                    setQuantity(newQuantity);
                }
            })
            .catch((err) => console.error("Error fetching cart items:", err));
    };


    const handleAddToCart = (productId) => {
        if (!selectedSize) {
            console.error("Error: No shoe size selected.");
            return;
        }

        // Extract the number after "Size" (e.g., "Size10" → "10")
        const sizeNumber = parseInt(selectedSize.substring(4), 10);

        if (isNaN(sizeNumber)) {
            console.error("Error: Invalid shoe size format.");
            return;
        }

        // Fetch the cart items to check existing quantity for the same product and size
        http.get('/cartitem')
            .then((res) => {
                const cartItems = res.data || [];

                // Find if the same product and shoe size already exist in the cart
                const existingCartItem = cartItems.find(
                    (item) => item.productId === productId && item.shoeSize === sizeNumber
                );

                const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;
                const totalRequestedQuantity = existingQuantity + quantity;

                // Check stock availability for the selected size
                const maxStock = stock[selectedSize] || 0;

                if (totalRequestedQuantity > maxStock) {
                    console.warn("Error: Cannot exceed available stock.");
                    return;
                }

                console.log("Adding to cart - Product ID:", productId, "Quantity:", quantity, "Shoe Size:", sizeNumber);

                // Proceed with adding to the cart if stock is available
                http.post('/cartitem', { productId, quantity, shoeSize: sizeNumber })
                    .then(() => {
                        setIsCartOpen(true); // Open sidebar after successful POST
                        // Fetch the updated cart items and calculate the total quantity
                        http.get('/cartitem')
                            .then((res) => {
                                const totalQuantity = res.data.reduce((sum, item) => sum + item.quantity, 0);
                                setCartCount(totalQuantity); // Update the badge count
                            })
                            .catch((err) => console.error('Error fetching cart items:', err));
                    })
                    .catch((err) => console.error('Error adding to cart:', err));
            })
            .catch((err) => console.error("Error fetching cart items:", err));
    };



    return (
        <Box sx={{ minWidth: 1490, maxWidth: 1500, margin: 'auto', padding: 0, display: 'flex', gap: 4, marginTop: "100px" }}>
            {/* Left Section: Image Slider + Thumbnails inside Border */}
            <Box sx={{ flex: 1, border: '2px solid #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center', marginLeft: 10 }}>
                {/* MAIN IMAGE SLIDER */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <IconButton onClick={() => handleImageChange(-1)} sx={{ position: 'absolute', left: 0 }}>
                        <ArrowBackIos sx={{ color: 'black' }} />
                    </IconButton>
                    <Card>
                        <CardMedia
                            component="img"
                            height="400"
                            image={`${import.meta.env.VITE_FILE_BASE_URL}${images[activeImage]}`}
                            alt={product.name}
                        />
                    </Card>
                    <IconButton onClick={() => handleImageChange(1)} sx={{ position: 'absolute', right: 0 }}>
                        <ArrowForwardIos sx={{ color: 'black' }} />
                    </IconButton>
                </Box>

                {/* THUMBNAILS BELOW SLIDER */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    {images.map((img, index) => (
                        <img
                            key={index}
                            src={`${import.meta.env.VITE_FILE_BASE_URL}${img}`}
                            alt={`Thumbnail ${index}`}
                            onClick={() => setActiveImage(index)}
                            style={{
                                width: 80,
                                height: 80,
                                margin: '0 5px',
                                cursor: 'pointer',
                                border: activeImage === index ? '2px solid black' : 'none'
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Right Section: Product Details */}
            <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>{product.name}</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>Price: ${product.price.toFixed(2)}</Typography>
                <Typography variant="body1">Description: {product.description}</Typography>
                <Typography variant="body1">Category: {product.categoryId}</Typography>
                <Typography variant="body1">Colour: {product.color}</Typography>

                <Formik initialValues={{ size: '' }}>
                    {({ values, setFieldValue }) => (
                        <Form>
                            <Typography variant="h6" sx={{ mt: 2 }}>Select Size:</Typography>
                            <ToggleButtonGroup
                                value={values.size}
                                exclusive
                                onChange={(event, newValue) => {
                                    setFieldValue('size', newValue);
                                    setSelectedSize(newValue);
                                    console.log(newValue);
                                    setQuantity(1);
                                }}
                                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                            >
                                {Object.entries(stock).filter(([key]) => key.startsWith('size')).map(([size, quantity]) => (
                                    <ToggleButton
                                        key={size}
                                        value={size}
                                        disabled={quantity === 0}
                                        sx={{
                                            border: '1px solid #ccc',
                                            borderRadius: 0,
                                            padding: '10px 20px',
                                            width: '50px',
                                            marginRight: 1,
                                            mt: 1,
                                            backgroundColor: quantity === 0 ? '#f5f5f5' : 'white',
                                            color: quantity === 0 ? '#bdbdbd' : 'black',
                                            '&.Mui-selected': {
                                                backgroundColor: '#374151',
                                                color: '#fff',
                                                border: '1px solid #374151',
                                            },
                                            '&:hover': {
                                                backgroundColor: quantity === 0 ? '#f5f5f5' : '#ebebeb',
                                            }
                                        }}
                                    >
                                        {size.replace('size', '')}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>

                            {/* Show "Low Stock" Warning */}
                            {selectedSize && stock[selectedSize] < 4 && (
                                <Typography sx={{ color: 'red', mt: 1, fontWeight: 'bold'}}>
                                    Low Stock!
                                </Typography>
                            )}
                        </Form>
                    )}
                </Formik>

                {selectedSize && stock[selectedSize] > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'center', border: '1px solid #ccc', borderRadius: '8px', padding: '5px 15px', width: '120px' }}>
                        <Button onClick={() => handleQuantityChange(-1)}>
                            <RemoveIcon sx={{ color: 'black' }} />
                        </Button>
                        <Typography sx={{ mx: 2, fontSize: 20 }}>{quantity}</Typography>
                        <Button onClick={() => handleQuantityChange(1)}>
                            <AddIcon sx={{ color: 'black' }} />
                        </Button>
                    </Box>
                )}

                {/* Add to Cart & View 3D Buttons in Grid 6-6 */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                        <Button
                            sx={{
                                backgroundColor: '#00B700',
                                borderRadius: '30px',
                                color: 'white',
                                padding: '8px 15px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                // marginLeft: '170px',
                                // marginTop: '-60px',
                                // marginBottom: '10px',
                                width: "200px",
                                height: "50px",
                                fontSize: '18px'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product.productId);  // ✅ Use quickView.productId instead
                            }}

                        >
                            Add to cart
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        {product.threeJsFile ? (
                            <Link to={`/view3dmodel/${product.productId}`} style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        fontSize: 16,
                                        maxWidth: 250,
                                        marginLeft: -12,
                                        color: '#000000',
                                        borderColor: '#ccc',
                                        boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.2)', // Adds shadow
                                        transition: 'all 0.3s ease-in-out', // Smooth effect
                                        "&:hover": {
                                            boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)', // Stronger shadow on hover
                                            borderColor: '#888' // Darker border on hover
                                        }
                                    }}
                                >
                                    View 3D
                                </Button>

                            </Link>
                        ) : (
                            <Button
                                variant="outlined"
                                fullWidth
                                sx={{ fontSize: 16, maxWidth: 250, marginLeft: -12, color: '#aaa', borderColor: '#ccc' }}
                                disabled
                            >
                                View 3D
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Box>
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </Box>
    );
};

export default ProductDetail;
