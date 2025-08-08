import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../NewArrivals.css';
import { Card, CardContent, CardMedia, Typography, Button, CardActionArea, CardActions, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, InputAdornment, InputLabel, FormControl, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Visibility, Search, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import http from '../http';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CartSidebar from './CartSidebar';

const Products = ({ setCartCount }) => {
    const [products, setProducts] = useState([]);
    const [quickView, setQuickView] = useState(null);
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [filterOption, setFilterOption] = useState("latest");
    const [activeImage, setActiveImage] = useState(0);
    const [stock, setStock] = useState({});
    const [selectedSize, setSelectedSize] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [search, selectedCategory, filterOption]);

    const fetchProducts = () => {
        http.get(`/product?search=${search}`)
            .then((res) => {
                let filteredProducts = res.data;
                if (selectedCategory) {
                    filteredProducts = filteredProducts.filter(p => p.categoryId === selectedCategory);
                }
                switch (filterOption) {
                    case 'earliest':
                        filteredProducts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        break;
                    case 'priceLowHigh':
                        filteredProducts.sort((a, b) => a.price - b.price);
                        break;
                    case 'priceHighLow':
                        filteredProducts.sort((a, b) => b.price - a.price);
                        break;
                    case 'A-Z':
                        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                    case 'Z-A':
                        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                        break;
                    case 'bestSelling':
                        filteredProducts.sort((a, b) => b.amt_sold - a.amt_sold);
                        break;
                    default:
                        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                setProducts(filteredProducts);
            })
            .catch((err) => console.error('Error fetching products:', err));
    };

    const fetchCategories = () => {
        http.get('/category')
            .then(res => setCategories(res.data))
            .catch(err => console.error('Error fetching categories:', err));
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

        // Fetch the stock for the selected size
        const maxStock = stock[selectedSize];

        // Fetch cart items to check the existing quantity of the same product and shoe size
        http.get('/cartitem')
            .then((res) => {
                const cartItems = res.data;

                // Find if the same product and shoe size already exist in cart
                const existingCartItem = cartItems.find(
                    (item) => item.productId === productId && item.shoeSize === sizeNumber
                );

                const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;

                // Check if adding more will exceed stock
                if (existingQuantity >= maxStock) {
                    console.warn("Error: Cannot add more, stock limit reached.");
                    return; // Prevent adding to cart
                }

                console.log("Adding to cart - Product ID:", productId, "Quantity:", quantity, "Shoe Size:", sizeNumber);

                // Proceed with adding to cart if stock limit is not exceeded
                http.post('/cartitem', { productId, quantity: quantity, shoeSize: sizeNumber }) // ✅ Use extracted size
                    .then(() => {
                        handleCloseQuickView();
                        setIsCartOpen(true); // Open sidebar after successful POST

                        // Fetch the updated cart items and calculate the total quantity
                        http.get('/cartitem')
                            .then((res) => {
                                const totalQuantity = res.data.reduce((sum, item) => sum + item.quantity, 0); // Calculate total quantity
                                setCartCount(totalQuantity); // Update the badge count
                            })
                            .catch((err) => console.error('Error fetching cart items:', err));
                    })
                    .catch((err) => console.error('Error adding to cart:', err));
            })
            .catch((err) => console.error("Error fetching cart items:", err));
    };

    const handleQuickView = (product) => {
        setQuickView(product);
        setActiveImage(0);
        http.get(`/stock/product/${product.productId}`)
            .then(res => setStock(res.data || {}))
            .catch(err => console.error('Error fetching stock details:', err));
    };

    const handleCloseQuickView = () => {
        setQuickView(null);
        setActiveImage(0);
        setStock({});
        setSelectedSize("");
    };

    const handleImageChange = (direction) => {
        const images = [quickView?.image, quickView?.imageFile2, quickView?.imageFile3].filter(Boolean);
        let newIndex = activeImage + direction;
        if (newIndex < 0) newIndex = images.length - 1;
        else if (newIndex >= images.length) newIndex = 0;
        setActiveImage(newIndex);
    };

    const handleQuantityChange = (increment) => {
        if (!selectedSize || stock[selectedSize] === undefined) return;
        const maxStock = stock[selectedSize];

        // Fetch current cart items to check existing quantity for the same product & shoe size
        http.get('/cartitem')
            .then((res) => {
                const cartItems = res.data;

                // Find if the same product and shoe size already exist in cart
                const existingCartItem = cartItems.find(
                    (item) => item.productId === quickView.productId && item.shoeSize === parseInt(selectedSize.substring(4), 10)
                );

                const existingQuantity = existingCartItem ? existingCartItem.quantity : 0;
                const newQuantity = quantity + increment;

                // Check if total quantity in cart + new quantity exceeds stock
                if (existingQuantity + newQuantity > maxStock) {
                    console.warn("Error: Total quantity exceeds available stock.");
                    return;
                }

                // Update quantity if it does not exceed stock
                if (newQuantity >= 1) {
                    setQuantity(newQuantity);
                }
            })
            .catch((err) => console.error("Error fetching cart items:", err));
    };

    const handleCardClick = (id) => {
        navigate(`/productdetail/${id}`);
    };

    const handleCompareProducts = () => {
        navigate('/compareshoe'); // Navigate to CompareShoe page
    };


    return (
        <div className="new-arrivals" style={{ padding: '0' }}>
            <div className="title">
                <h1>New Arrivals</h1>
                <h3>Be the first fashionista to flaunt these new styles!</h3>
            </div>
            <div className="search-filter-bar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid black',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    height: "50px"
                }}
            >
                <TextField
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    variant="standard" // Use 'standard' to remove the default outline
                    InputProps={{
                        disableUnderline: true, // Removes underline
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        sx: { border: "none", marginLeft: "15px" }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { border: 'none' },
                            '&:hover fieldset': { border: 'none' },
                            '&.Mui-focused fieldset': { border: 'none' },
                        },
                        backgroundColor: 'transparent' // Optional
                    }}
                />

                <FormControl sx={{ borderLeft: '1px solid black', borderRadius: 0, minWidth: 200, width: 200, height: "45px"}}>
                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        displayEmpty
                        sx={{
                            width: 200,
                            "&.MuiOutlinedInput-root": {
                                "& fieldset": { border: "none" },
                                "&:hover fieldset": { border: "none" },
                                "&.Mui-focused fieldset": { border: "none" }
                            },
                            "& .MuiSelect-select": {
                                padding: "10px",
                            },
                            "&.Mui-focused": {
                                border: "none", // Removes the focus border
                                outline: "none",
                                boxShadow: "none"
                            }
                        }}
                    >
                        {/* Show this placeholder only if no category is selected */}
                        {!selectedCategory && (
                            <MenuItem disabled value="">
                                Filter by Category
                            </MenuItem>
                        )}
                        {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                                {category.category}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>


                <Select
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                    displayEmpty
                    variant="outlined" // Ensure it's outlined
                    sx={{
                        borderLeft: '1px solid black', // Keeps the left border
                        borderRadius: 0,
                        minWidth: 200,
                        width: 200,
                        "& .MuiOutlinedInput-notchedOutline": {
                            border: "none" // Removes the default border on click
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            border: "none"
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            border: "none"
                        },
                        "&.Mui-focused": {
                            borderLeft: '1px solid black', // Ensures the left border remains on focus
                            outline: "none",
                            boxShadow: "none"
                        }
                    }}
                >
                    <MenuItem value="latest">Filter by Latest</MenuItem>
                    <MenuItem value="earliest">Filter by Earliest</MenuItem>
                    <MenuItem value="priceLowHigh">Filter by Price (Low to High)</MenuItem>
                    <MenuItem value="priceHighLow">Filter by Price (High to Low)</MenuItem>
                    <MenuItem value="A-Z">Filter by A-Z</MenuItem>
                    <MenuItem value="Z-A">Filter by Z-A</MenuItem>
                    <MenuItem value="bestSelling">Filter by Best Selling</MenuItem>
                </Select>
                {/* Compare Products Button */}
                <Link to="/compareshoe" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        onClick={handleCompareProducts}
                        sx={{
                            borderLeft: '1px solid black',
                            borderRadius: 0,
                            backgroundColor: '#FF8C00',
                            color: 'white',
                            minWidth: 180,
                            height: '56px',
                            '&:hover': { backgroundColor: '#F57C00' }
                        }}
                    >
                        Compare Products
                    </Button>
                </Link>
            </div>
            <div className="new-arrivals-products">
                {products.map((product) => {
                    const imageUrl = `${import.meta.env.VITE_FILE_BASE_URL}${product.image}`;
                    return (
                        <Card key={product.productId} sx={{ width: 300, borderRadius: '10px', marginTop: '40px', boxShadow: '0 0px 6px rgba(0, 0, 0, 0.1)', position: 'relative', cursor: 'pointer' }} onClick={() => handleCardClick(product.productId)}>
                            <CardActionArea>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={imageUrl}
                                    alt={product.name}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/200';
                                    }}
                                />
                                <IconButton
                                    sx={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'white' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickView(product);
                                    }}
                                >
                                    <Visibility />
                                </IconButton>
                            </CardActionArea>
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '20px', fontWeight: 'bold', color: '#414B56' }}>
                                    {product.name}
                                </Typography>
                                <Typography sx={{ fontSize: '17px', fontWeight: 'bold', color: '#414B56' }}>
                                    ${product.price.toFixed(2)}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    sx={{
                                        backgroundColor: '#414B56',
                                        borderRadius: '30px',
                                        color: 'white',
                                        padding: '8px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        marginLeft: '5px',
                                        marginTop: '-9px',
                                        marginBottom: '10px',
                                        width: "130px",
                                        fontSize: "16px"
                                    }}
                                    onClick={handleCardClick}
                                >
                                    View
                                </Button>
                            </CardActions>
                        </Card>
                    );
                })}
            </div>
            {quickView && (
                <Dialog open={Boolean(quickView)} onClose={handleCloseQuickView} maxWidth="md" fullWidth>
                    <DialogTitle>{quickView.name}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <IconButton onClick={() => handleImageChange(-1)} sx={{ position: 'absolute', left: 0 }}>
                                <ArrowBackIos />
                            </IconButton>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="400"
                                    image={`${import.meta.env.VITE_FILE_BASE_URL}${[quickView.image, quickView.imageFile2, quickView.imageFile3].filter(Boolean)[activeImage]}`}
                                    alt={quickView.name}
                                />
                            </Card>
                            <IconButton onClick={() => handleImageChange(1)} sx={{ position: 'absolute', right: 0 }}>
                                <ArrowForwardIos />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            {[quickView.image, quickView.imageFile2, quickView.imageFile3].filter(Boolean).map((img, index) => (
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
                        <Typography variant="body1" sx={{ mt: 2 }}>Price: ${quickView.price}</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>Description: {quickView.description}</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>Category: {quickView.categoryId}</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>Color: {quickView.color}</Typography>
                        <Formik initialValues={{ size: '' }} onSubmit={values => console.log('Selected size:', values.size)}>
                            {({ values, setFieldValue }) => (
                                <Form>
                                    <Typography variant="h6" sx={{ mt: 2 }}>Select Size:</Typography>
                                    <ToggleButtonGroup
                                        value={values.size}
                                        exclusive
                                        onChange={(event, newValue) => {
                                            setFieldValue('size', newValue);
                                            setSelectedSize(newValue);
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
                                </Form>
                            )}
                        </Formik>

                        {selectedSize && stock[selectedSize] > 0 && (
                            <Box sx={{ width: "100%" }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'center', border: '1px solid #ccc', borderRadius: '8px', padding: '5px 15px', width: '100px' }}>
                                    <Button onClick={() => handleQuantityChange(-1)}>
                                        <RemoveIcon sx={{ color: 'black' }} />
                                    </Button>
                                    <Typography sx={{ fontSize: 20 }}>{quantity}</Typography>
                                    <Button onClick={() => handleQuantityChange(1)}>
                                        <AddIcon sx={{ color: 'black' }} />
                                    </Button>
                                </Box>
                                <Button
                                    sx={{
                                        backgroundColor: '#00B700',
                                        borderRadius: '30px',
                                        color: 'white',
                                        padding: '8px 15px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        marginLeft: '170px',
                                        marginTop: '-60px',
                                        marginBottom: '10px',
                                        width: "200px",
                                        height: "50px",
                                        fontSize: '18px'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(quickView.productId);  // ✅ Use quickView.productId instead
                                    }}

                                >
                                    Add to cart
                                </Button>
                            </Box>

                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseQuickView} color="primary">Close</Button>
                    </DialogActions>
                </Dialog>
            )}
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default Products;