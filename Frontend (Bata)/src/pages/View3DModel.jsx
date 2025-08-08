import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Box, Typography, CircularProgress, Paper, Button } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import http from "../http";

const Model = ({ url, autoRotate }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={1.5} />;
};

const View3DModel = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [modelBgColor, setModelBgColor] = useState("#f5f5f5"); // Default 3D model background color
    const modelContainerRef = useRef(null);

    useEffect(() => {
        http.get(`/product/${id}`)
            .then((res) => {
                setProduct(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching product:", err);
                setLoading(false);
            });

        document.body.style.overflowX = "hidden";
        document.documentElement.style.overflowX = "hidden";

        return () => {
            document.body.style.overflowX = "auto";
            document.documentElement.style.overflowX = "auto";
        };
    }, [id]);

    if (loading) return <CircularProgress sx={{ display: "block", margin: "auto", mt: 5 }} />;
    if (!product || !product.threeJsFile) return <Typography sx={{ textAlign: "center", mt: 5 }}>No 3D model available.</Typography>;

    // Handle Fullscreen Mode
    const toggleFullscreen = () => {
        if (!isFullscreen) {
            modelContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <Box 
            ref={modelContainerRef}
            sx={{ 
                textAlign: "center", 
                mt: 0, 
                minHeight: "100vh", 
                width: "100vw", 
                maxWidth: "100vw", 
                overflow: "hidden",
                background: "linear-gradient(135deg, #fdfcfb, #f8f8ef)", // Soft Cream Background
                padding: isFullscreen ? 0 : 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            {!isFullscreen && (
                <Typography variant="h4" sx={{ mb: 2, color: "#4a3626", fontWeight: "bold", marginTop: 5 }}>
                    {product.name}
                </Typography>
            )}

            {/* 3D Model Container */}
            <Paper 
                elevation={8} 
                sx={{
                    width: isFullscreen ? "100vw" : "95%",
                    maxWidth: isFullscreen ? "100vw" : "1000px",
                    height: isFullscreen ? "100vh" : "500px",
                    margin: "auto",
                    padding: 0,
                    borderRadius: isFullscreen ? 0 : "12px",
                    backgroundColor: "#f9faf4",
                    color: "#4a3626",
                    boxShadow: isFullscreen ? "none" : "0px 10px 30px rgba(0,0,0,0.2)",
                    overflow: "hidden"
                }}
            >
                <Box 
                    sx={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center",
                        height: "100%",
                        width: "100%",
                        background: modelBgColor, // Dynamic 3D Model Background
                        borderRadius: "10px"
                    }}
                >
                    <Canvas camera={{ position: [0, 2, 5] }} style={{ width: "100%", height: "100%" }}>
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[5, 5, 5]} intensity={1.2} />
                        <Environment preset="studio" />
                        <OrbitControls autoRotate={autoRotate} enablePan={true} />
                        <Model url={`${import.meta.env.VITE_FILE_BASE_URL}${product.threeJsFile}`} autoRotate={autoRotate} />
                    </Canvas>
                </Box>
            </Paper>

            {/* Controls (Now Includes Background Color Picker) */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3, alignItems: "center" }}>
                {/* Rotation Toggle */}
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: "#b07d62",
                        color: "white",
                        "&:hover": { backgroundColor: "#8c5b47" },
                        fontSize: "16px",
                        textTransform: "none"
                    }}
                    onClick={() => setAutoRotate(!autoRotate)}
                >
                    {autoRotate ? "Stop Rotation" : "Start Rotation"}
                </Button>

                {/* Reset View */}
                <Button
                    variant="outlined"
                    sx={{
                        borderColor: "#b07d62",
                        color: "#b07d62",
                        "&:hover": { borderColor: "#8c5b47", color: "#8c5b47" },
                        fontSize: "16px",
                        textTransform: "none"
                    }}
                    onClick={() => window.location.reload()}
                >
                    Reset View
                </Button>

                {/* Background Color Picker */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ color: "#4a3626", fontSize: "14px" }}>Background:</Typography>
                    <input 
                        type="color" 
                        value={modelBgColor} 
                        onChange={(e) => setModelBgColor(e.target.value)} 
                        style={{ width: "40px", height: "40px", border: "none", cursor: "pointer" }}
                    />
                </Box>

                {/* Fullscreen Toggle */}
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: isFullscreen ? "#c44536" : "#b07d62",
                        color: "white",
                        "&:hover": { backgroundColor: isFullscreen ? "#a33228" : "#8c5b47" },
                        fontSize: "16px",
                        textTransform: "none"
                    }}
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />} 
                    {isFullscreen ? " Exit Fullscreen" : " Fullscreen"}
                </Button>
            </Box>
        </Box>
    );
};

export default View3DModel;
