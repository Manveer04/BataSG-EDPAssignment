import '../HomePage.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroImage from '../assets/HeroImage.png';
import Women from '../assets/Women.webp';
import Men from '../assets/Men.webp';
import http from '../http';
import Kids from '../assets/Kids.webp';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Card, CardContent, CardMedia, Typography, Button, CardActionArea, CardActions, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, InputAdornment, InputLabel, FormControl, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import XIcon from '@mui/icons-material/X';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate(); // Initialize the navigation hook

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = () => {
        http.get(`/product?search=${search}`)
            .then((res) => {
                setProducts(res.data);
            })
            .catch((err) => console.error('Error fetching products:', err));
    };
    const handleShopNowClick = () => {
        navigate('/newarrivals'); // Navigate to /newarrivals
    };
    const handleCardClick = (id) => {
        navigate(`/productdetail/${id}`);
    };
    // ✅ Function to navigate to the Women's category
    const handleWomenClick = () => {
        navigate('/product');
    };
    // ✅ Function to navigate to the Women's category
    const handleMenClick = () => {
        navigate('/product');
    };
    const handleKidClick = () => {
        navigate('/product');
    };

    return (
        <div className="homepage-container">
            <div className="image-container">
                <img src={HeroImage} alt="A pair of shoes" />
                <h1>EVERYONE <br /> DESERVES A <br /> PAIR OF <br /> SHOE</h1>
                <h2>Step into comfort, Walk in style.</h2>
                <button className='Shop' onClick={handleShopNowClick}>Shop Now</button>
            </div>
            {/* Shop Section */}
            <div className='homeshop'>
                <h1>Shop</h1>
                <div className="shop-cards">
                    <div className="shop-card">
                        <h2>WOMEN</h2>
                        <img src={Women} alt="Women Shoes" />
                        <button className="show-more-btn" onClick={handleWomenClick}>Show More</button>
                    </div>
                    <div className="shop-card">
                        <h2>MEN</h2>
                        <img src={Men} alt="Men Shoes" />
                        <button className="show-more-btn" onClick={handleMenClick}>Show More</button>
                    </div>
                    <div className="shop-card">
                        <h2>KIDS</h2>
                        <img src={Kids} alt="Kids Shoes" />
                        <button className="show-more-btn" onClick={handleKidClick}>Show More</button>
                    </div>
                </div>
            </div>
            <div className='featured'>
                <h1 style={{ textAlign: "center"}}>Featured Products</h1>
                <div className="new-arrivals-products">
                    {products.slice(0, 4).map((product) => {  // ✅ Only display 4 products
                        const imageUrl = `${import.meta.env.VITE_FILE_BASE_URL}${product.image}`;
                        return (
                            <Card key={product.productId} sx={{ width: 300, borderRadius: '10px', marginTop: '40px', boxShadow: '0 0px 6px rgba(0, 0, 0, 0.1)', position: 'relative', cursor: 'pointer' }}>
                                <CardActionArea onClick={() => handleCardClick(product.productId)}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={imageUrl}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/200';
                                        }}
                                    />
                                </CardActionArea>
                                <CardContent>
                                    <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '20px', fontWeight: 'bold', color: '#414B56' }}>
                                        {product.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '17px', fontWeight: 'bold', color: '#414B56' }}>
                                        ${product.price}
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
                                        onClick={() => handleCardClick(product.productId)} // ✅ Ensure correct navigation
                                    >
                                        View
                                    </Button>
                                </CardActions>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className='newsletter'>
                <h1>Join Our Newsletter</h1>
                <h2>Stay updated with our latest styles and exclusive offers</h2>
                <div className="subscription-bar">
                    <input
                        type="email"
                        className="subscription-input"
                        placeholder="Enter your email"
                    />
                    <button className="subscription-button">Subscribe</button>
                </div>
            </div>
            <footer className="footer">
                <div className="footer-container">
                    {/* Bata Info */}
                    <div className="footer-column">
                        <h4>Bata</h4>
                        <p>Quality footwear since 1894</p>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="/">About Us</a></li>
                            <li><a href="/careers">Careers</a></li>
                            <li><a href="/">Store Locator</a></li>
                            <li><a href="/">FAQs</a></li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div className="footer-column">
                        <h4>Customer Support</h4>
                        <ul>
                            <li><a href="/">Contact Us</a></li>
                            <li><a href="/">Shipping & Returns</a></li>
                            <li><a href="/">Size Guide</a></li>
                            <li><a href="/">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Connect With Us */}
                    <div className="footer-column">
                        <h4>Connect With Us</h4>
                        <div className="social-icons">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <FacebookOutlinedIcon style={{ fontSize: 26 }} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <XIcon />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <InstagramIcon />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p>&copy; 2025 Bata. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;