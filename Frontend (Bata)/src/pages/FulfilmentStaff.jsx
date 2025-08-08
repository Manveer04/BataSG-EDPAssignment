import React, { useEffect, useState } from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import http from '../http';
import { Link as RouterLink } from 'react-router-dom';

import DeleteIcon from '@mui/icons-material/Delete';

const FulfilmentStaffPage = () => {
    const [staff, setStaff] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedfulfilStaffId, setSelectedStaffId] = useState(null);


    useEffect(() => {
        http.get('/FulfilmentStaff').then((res) => {
            setStaff(res.data);
        });
    }, []);

    const handleDelete = async () => {
        try {
            await http.delete(`/FulfilmentStaff/${selectedfulfilStaffId}`);
            setStaff(staff.filter(staffMember => staffMember.fulfilStaffId !== selectedfulfilStaffId));
            setOpenDialog(false);
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                console.error('Error headers:', error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
            console.error('Error config:', error.config);
        }
    };

    const handleOpenDialog = (staffId) => {
        setSelectedStaffId(staffId);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedStaffId(null);
    };

    return (
        <Box sx={{ p: 3 }} style={{
            marginTop: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', width: '97vw'
        }}>
            <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
                Fulfilment Staff
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Button
                component={RouterLink}
                to="/addfulfilmentstaff"
                sx={{
                    color: "black",
                    border: "2px solid black",  
                    padding: "8px 16px",
                    position: "absolute",
                    right: "25px" ,
                    borderRadius: "4px",       
                }}
            >
                Add Fulfilment Staff
            </Button>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="fulfilment staff table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Fulfill Staff ID</TableCell>
                            <TableCell>Staff ID</TableCell>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Contact Number</TableCell>
                            <TableCell>Assigned Area</TableCell>
                            <TableCell>Warehouse</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staff.map((staffMember) => (
                            <TableRow key={staffMember.staffId}>
                                <TableCell>{staffMember.fulfilStaffId}</TableCell>
                                <TableCell>{staffMember.staffId}</TableCell>
                                <TableCell>{staffMember.username}</TableCell>
                                <TableCell>{staffMember.email}</TableCell>
                                <TableCell>{staffMember.phoneNo}</TableCell>
                                <TableCell>
                                    {staffMember.assignedArea.includes(',')
                                        ? `${staffMember.assignedArea} (Preferred)`
                                        : staffMember.assignedArea}
                                </TableCell>
                                <TableCell>{staffMember.warehouse}</TableCell>
                                <TableCell>
                                    <IconButton
                                        color="secondary"
                                        onClick={() => handleOpenDialog(staffMember.fulfilStaffId)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this staff member?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="green">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FulfilmentStaffPage;