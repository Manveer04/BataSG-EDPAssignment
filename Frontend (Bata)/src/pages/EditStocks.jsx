import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditStocks = () => {
    const { productId } = useParams();  // Ensure correct retrieval of productId
    const [stock, setStock] = useState({
        size5: 0,
        size6: 0,
        size7: 0,
        size8: 0,
        size9: 0,
        size10: 0,
        size11: 0,
        size12: 0
    });

    useEffect(() => {
        if (!productId) {
            toast.error('Product ID is missing from the URL.');
            return;
        }

        console.log("Fetching stock for productId:", productId);

        http.get(`/stock/product/${productId}`)
            .then((res) => {
                if (res.data) {
                    setStock(res.data);
                } else {
                    toast.error('Stock data not found');
                }
            })
            .catch((err) => {
                console.error('Error fetching stock data:', err);
                toast.error('Error fetching stock data');
            });
    }, [productId]);

    return (
        <Box sx={{ maxWidth: 600, margin: '0 auto', mt: 5 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Stock Sizes for Product #{productId}</Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Size</strong></TableCell>
                                <TableCell><strong>Quantity</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(stock).map(([size, value]) => (
                                <TableRow key={size}>
                                    <TableCell>{size.charAt(0).toUpperCase() + size.slice(1)}</TableCell>
                                    <TableCell>{value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <ToastContainer />
        </Box>
    );
};

export default EditStocks;
