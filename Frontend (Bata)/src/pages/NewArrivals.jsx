import React, { useEffect, useState } from 'react';
import '../NewArrivals.css';
import { Card, CardContent, CardMedia, Typography, Button, CardActionArea, CardActions } from '@mui/material';
import http from '../http';
import CartSidebar from './CartSidebar';
import { useNavigate } from 'react-router-dom';

const NewArrivals = ({ setCartCount }) => {
    const [products, setProducts] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const navigate = useNavigate(); // ✅ Use navigate hook
    
    useEffect(() => {
        http.get('/product')
            .then((res) => setProducts(res.data))
            .catch((err) => console.error('Error fetching products:', err));
    }, []);

    const handleAddToCart = (productId) => {
        http.post('/cartitem', { productId, quantity: 1 })
            .then(() => {
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
    };    


    return (
        <div className="new-arrivals">
            <div className="title">
                <h1>New Arrivals</h1>
                <h3>Be the first fashionista to flaunt these new styles!</h3>
            </div>
            <div className="new-arrivals-products">
                {products.map((product) => (
                    <Card key={product.productId} sx={{ width: 300, borderRadius: '10px', marginTop: '40px', boxShadow: '0 0px 6px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                        <CardActionArea onClick={() => navigate(`/productdetail/${product.productId}`)}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={`${import.meta.env.VITE_FILE_BASE_URL}${product.image}`}
                                alt={product.name}
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '20px', fontWeight: 'bold', color: '#414B56' }}>
                                    {product.name}
                                </Typography>
                                <Typography sx={{ fontSize: '17px', fontWeight: 'bold', color: '#414B56' }}>
                                    ${product.price}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                        <CardActions>
                            <Button
                                sx={{
                                    backgroundColor: '#00B700',
                                    borderRadius: '30px',
                                    color: 'white',
                                    padding: '8px 15px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    marginLeft: '5px',
                                    marginTop: '-9px',
                                    marginBottom: '10px',
                                }}
                                onClick={() => handleAddToCart(product.productId)}
                            >
                                Add to cart
                            </Button>
                        </CardActions>
                    </Card>
                ))}
            </div>
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default NewArrivals;
