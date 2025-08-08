import React, { useEffect, useState } from "react";
import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Typography, Grid, Snackbar, Alert, IconButton } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import http from "../http";

const Compare = () => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [compareMode, setCompareMode] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState({});

    useEffect(() => {
        http.get("/product")
            .then((res) => {
                // Ensure consistency by mapping `productId` correctly
                const updatedProducts = res.data.map((p) => ({
                    ...p,
                    id: p.productId, // Map `productId` to `id` for uniformity
                }));
                setProducts(updatedProducts);
            })
            .catch((err) => console.error("Error fetching products:", err));
    }, []);

    const handleSelectProduct = (product) => {
        if (selectedProducts.some((p) => p.productId === product.productId)) {
            setSelectedProducts(selectedProducts.filter((p) => p.productId !== product.productId));
        } else if (selectedProducts.length < 2) {
            setSelectedProducts([...selectedProducts, product]);
            setActiveImageIndex((prev) => ({ ...prev, [product.productId]: 0 }));
        } else {
            setToastMessage("⚠ You can only select up to 2 products!");
            setToastOpen(true);
        }
    };

    const handleCompare = () => {
        if (selectedProducts.length === 2) {
            setCompareMode(true);
        }
    };

    const handleReset = () => {
        setSelectedProducts([]);
        setCompareMode(false);
    };

    const handleImageChange = (productId, direction, images) => {
        setActiveImageIndex((prev) => {
            const newIndex = (prev[productId] || 0) + direction;
            return {
                ...prev,
                [productId]: newIndex < 0 ? images.length - 1 : newIndex >= images.length ? 0 : newIndex,
            };
        });
    };

    const handleThumbnailClick = (productId, index) => {
        setActiveImageIndex((prev) => ({ ...prev, [productId]: index }));
    };

    return (
        <Box sx={{ width: "123.1%", height: "100%", textAlign: "center", background: "#f5f5f5", paddingBottom: "5%", paddingTop: "100px" }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                Compare Products
            </Typography>

            {!compareMode ? (
                <>
                    <Grid container spacing={3} justifyContent="center" sx={{}}>
                        {products.map((product) => (
                            <Grid item key={product.productId} xs={12} sm={6} md={4}>
                                <Card
                                    onClick={() => handleSelectProduct(product)}
                                    sx={{
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        transition: "0.3s",
                                        margin: 4,
                                        border: selectedProducts.some((p) => p.productId === product.productId)
                                            ? "3px solid blue"
                                            : "none",
                                        boxShadow: selectedProducts.some((p) => p.productId === product.productId)
                                            ? "0px 0px 10px rgba(0, 0, 255, 0.5)"
                                            : "0px 4px 8px rgba(0, 0, 0, 0.1)",
                                    }}
                                >
                                    <CardActionArea>
                                        <CardMedia
                                            component="img"
                                            height="250"
                                            sx={{objectFit: "cover"}}
                                            image={`${import.meta.env.VITE_FILE_BASE_URL}${product.image}`}
                                            alt={product.name}
                                        />
                                        <CardContent>
                                            <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: "bold", color: "#414B56" }}>
                                                {product.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: "16px", fontWeight: "bold", color: "#414B56" }}>
                                                ${product.price.toFixed(2)}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)" }}>
                        <Button
                            variant="contained"
                            onClick={handleCompare}
                            sx={{
                                fontSize: "18px",
                                padding: "10px 35px",
                                borderRadius: "5px",
                                backgroundColor: "#FF9800",
                                color: "white",
                                fontWeight: "bold",
                                boxShadow: "0px 5px 20px rgba(255, 152, 0, 0.7)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    backgroundColor: "#F57C00",
                                    boxShadow: "0px 5px 25px rgba(255, 87, 34, 0.9)",
                                    transform: "scale(1.05)",
                                },
                            }}
                            disabled={selectedProducts.length !== 2}
                        >
                            Compare
                        </Button>
                    </Box>
                </>
            ) : (
                <>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 5, mt: 5}}>
                        {selectedProducts.map((product) => {
                            const images = [
                                product.image,
                                product.imageFile2,
                                product.imageFile3,
                            ].filter(Boolean);

                            return (
                                <Box key={product.productId} sx={{ width: "500px", textAlign: "center", background: "white", padding: 3, borderRadius: 2 , border: "1px solid black"}}>
                                    
                                    <Box sx = {{border: "1px solid gray", borderRadius: 2, padding: 2}}>
                                        <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                            <IconButton
                                                onClick={() => handleImageChange(product.productId, -1, images)}
                                                sx={{ position: "absolute", left: 0 }}
                                            >
                                                <ArrowBackIos />
                                            </IconButton>

                                            <CardMedia
                                                component="img"
                                                height="300"
                                                image={`${import.meta.env.VITE_FILE_BASE_URL}${images[activeImageIndex[product.productId] || 0]}`}
                                                alt={product.name}
                                                sx={{ objectFit: "contain" }}
                                            />

                                            <IconButton
                                                onClick={() => handleImageChange(product.productId, 1, images)}
                                                sx={{ position: "absolute", right: 0 }}
                                            >
                                                <ArrowForwardIos />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
                                            {images.map((img, index) => (
                                                <img
                                                    key={index}
                                                    src={`${import.meta.env.VITE_FILE_BASE_URL}${img}`}
                                                    alt={`Thumbnail ${index}`}
                                                    onClick={() => handleThumbnailClick(product.productId, index)}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        cursor: "pointer",
                                                        border: activeImageIndex[product.productId] === index ? "2px solid blue" : "2px solid transparent",
                                                        borderRadius: "5px",
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                    <Box sx={{ textAlign: "left", mt: 2, width: "500px" }}>
                                        <Typography variant="h4" sx={{fontWeight: "bold"}}>{product.name}</Typography>
                                        <Typography variant="h6">Price: ${product.price.toFixed(2)}</Typography>
                                        <Typography variant="h6">Description: {product.description}</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    <Box sx={{ mt: 4 }}>
                        <Button variant="contained" color="secondary" onClick={handleReset} sx={{ fontSize: "16px", padding: "10px 25px" }}>
                            Compare Again
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default Compare;
