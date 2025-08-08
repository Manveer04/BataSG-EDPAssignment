import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../http';
import { Search, Clear, FilterList, MoreVert } from '@mui/icons-material';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Menu, MenuItem, IconButton, Input } from '@mui/material';
import CustomerSidebar from "./CustomSidebar";

const C_Order = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserOrders = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                const response = await http.get("/api/order", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrders(response.data);
                setFilteredOrders(response.data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };
        fetchUserOrders();
    }, []);

    const mapStatus = (status) => {
        switch (status) {
            case 0: return "Processing";
            case 1: return "Shipped";
            case 2: return "Delivered";
            case 3: return "Cancelled";
            default: return "Unknown Status";
        }
    };

    const handleFilterClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterClose = (selectedStatus) => {
        setAnchorEl(null);
        if (selectedStatus) {
            setStatusFilter(selectedStatus);
            setFilteredOrders(
                selectedStatus === 'All'
                    ? orders
                    : orders.filter(order => mapStatus(order.orderStatus) === selectedStatus)
            );
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredOrders(orders);
            return;
        }

        const lowerQuery = query.toLowerCase();
        setFilteredOrders(
            orders.filter(order =>
                order.orderId.toString().includes(lowerQuery) ||
                order.email.toLowerCase().includes(lowerQuery) ||
                order.totalAmount.toString().includes(lowerQuery) ||
                new Date(order.orderDate).toLocaleString().toLowerCase().includes(lowerQuery)
            )
        );
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setFilteredOrders(orders);
    };

    const handleMenuOpen = (event, orderId) => {
        setMenuAnchor((prev) => ({ ...prev, [orderId]: event.currentTarget }));
    };

    const handleMenuClose = (orderId) => {
        setMenuAnchor((prev) => ({ ...prev, [orderId]: null }));
    };

    return (
        <Box sx={{ marginTop: '110px', textAlign: 'center', marginLeft: '17%', width: '90%' }}>
            <CustomerSidebar />
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#414B56" }}>Order History</Typography>

            {/* Search & Filter Section */}
            <Box sx={{ display: 'flex', marginTop: 2 }}>
                <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <IconButton color="info" onClick={handleClearSearch}>
                    <Clear />
                </IconButton>

                {/* Filter Button */}
                <IconButton color="info" onClick={handleFilterClick}>
                    <FilterList />
                </IconButton>

                {/* Filter Menu */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleFilterClose(null)}>
                    <MenuItem onClick={() => handleFilterClose('All')}>All</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('Processing')}>Processing</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('Shipped')}>Shipped</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('Delivered')}>Delivered</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('Cancelled')}>Cancelled</MenuItem>
                </Menu>
            </Box>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <Typography>No orders available.</Typography>
            ) : (
                <TableContainer component={Paper} sx={{ marginTop: 1, maxHeight: '472px', overflowY: 'auto' }}>
                    <Table>
                        <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: "#E5E5E5", zIndex: 99 }}>
                            <TableRow>
                                <TableCell><strong>Order ID</strong></TableCell>
                                <TableCell><strong>Order Date</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Total Amount</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.orderId}>
                                    <TableCell>{order.orderId}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleString()}</TableCell>
                                    <TableCell>{order.email}</TableCell>
                                    <TableCell>{mapStatus(order.orderStatus)}</TableCell>
                                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {/* MoreVert Icon Button */}
                                        <IconButton onClick={(event) => handleMenuOpen(event, order.orderId)}>
                                            <MoreVert />
                                        </IconButton>

                                        {/* Dropdown Menu */}
                                        <Menu
                                            anchorEl={menuAnchor[order.orderId]}
                                            open={Boolean(menuAnchor[order.orderId])}
                                            onClose={() => handleMenuClose(order.orderId)}
                                        >
                                            <MenuItem onClick={() => navigate(`/customerorderdetail/${order.orderId}`)}>
                                                View Details
                                            </MenuItem>
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

export default C_Order;
