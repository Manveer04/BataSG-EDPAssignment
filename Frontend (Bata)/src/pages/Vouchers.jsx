import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import http from '../http';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ToastContainer, toast } from 'react-toastify';

const Vouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all vouchers
        fetchVouchers();
    }, []);

    useEffect(() => {
        // Display toast message if present in location state
        if (location.state?.toastMessage) {
            toast.success(location.state.toastMessage);
            // Clear the location state
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate]);

    const fetchVouchers = () => {
        http.get('/voucher')
            .then((res) => {
                setVouchers(res.data);
                console.log(res.data);
            })
            .catch((err) => {
                console.error('Error fetching vouchers:', err);
            });
    };

    const handleMenuOpen = (event, voucher) => {
        setAnchorEl(event.currentTarget);
        setSelectedVoucher(voucher);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedVoucher(null);
    };

    const handleEditVoucher = () => {
        if (selectedVoucher) {
            navigate(`/editvoucher/${selectedVoucher.voucherId}`);
        }
        handleMenuClose();
    };

    const handleDeleteVoucher = () => {
        if (selectedVoucher) {
            http.delete(`/voucher/${selectedVoucher.voucherId}`)
                .then(() => {
                    toast.success('Voucher deleted successfully!');
                    fetchVouchers();
                })
                .catch((err) => {
                    console.error('Error deleting voucher:', err);
                    toast.error('Failed to delete voucher.');
                });
        }
        handleMenuClose();
    };

    return (
        <Box sx={{ marginTop: '90px', textAlign: 'center', marginLeft: '16%', width: '90%' }}>
            <ToastContainer />
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#414B56" }}>Vouchers</Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/createvoucher')}
                sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    position: 'absolute',
                    right: '15%',
                    '&:hover': {
                        backgroundColor: '#1565c0',
                    },
                }}
            >
                Create Voucher
            </Button>
            {vouchers.length === 0 ? (
                <Typography>No vouchers available.</Typography>
            ) : (
                <TableContainer component={Paper} sx={{ marginTop: 6, maxHeight: '600px', overflowY: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Voucher Code</strong></TableCell>
                                <TableCell><strong>Discount (%)</strong></TableCell>
                                <TableCell><strong>Expiry Date</strong></TableCell>
                                <TableCell><strong>Is Active</strong></TableCell>
                                <TableCell><strong>Max Usage</strong></TableCell> {/* ✅ Added Max Usage */}
                                <TableCell><strong>Usage Count</strong></TableCell>
                                <TableCell><strong>Created By</strong></TableCell>
                                <TableCell><strong>Last Updated By</strong></TableCell>
                                <TableCell><strong></strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vouchers.map((voucher) => (
                                <TableRow key={voucher.voucherId}>
                                    <TableCell>{voucher.code}</TableCell>
                                    <TableCell>{voucher.discountPercentage}</TableCell>
                                    <TableCell>{new Date(voucher.expiryDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{voucher.isActive ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{voucher.maxUsage}</TableCell> {/* ✅ Added Max Usage */}
                                    <TableCell>{voucher.usageCount}</TableCell>
                                    <TableCell>{voucher.createdByStaffId}</TableCell>
                                    <TableCell>{voucher.lastUpdatedBy}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={(event) => handleMenuOpen(event, voucher)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl) && selectedVoucher?.voucherId === voucher.voucherId}
                                            onClose={handleMenuClose}
                                        >
                                            <MenuItem onClick={handleEditVoucher}>Edit Voucher</MenuItem>
                                            <MenuItem onClick={handleDeleteVoucher}>Delete Voucher</MenuItem>
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default Vouchers;
