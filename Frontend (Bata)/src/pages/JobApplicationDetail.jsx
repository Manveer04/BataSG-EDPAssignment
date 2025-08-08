import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Divider, Button, Paper, Grid, IconButton } from '@mui/material';
import http from '../http';
import { ArrowBack } from '@mui/icons-material';

const JobApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appRes, warehouseRes] = await Promise.all([
                    http.get(`/JobApplicant/${id}`),
                    http.get("/Warehouse")
                ]);

                console.log("📥 Job Application Response:", appRes.data);
                console.log("📦 Warehouse Response:", warehouseRes.data);

                setApplication(appRes.data);
                setWarehouses(warehouseRes.data);
            } catch (error) {
                console.error("❌ Error fetching application or warehouses:", error);
            }
        };

        fetchData();
    }, [id]);


    const handleAccept = async () => {
        try {
            const response = await http.put(`/FulfilmentStaff/${id}/approve`, { approved: true }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Accepted application with ID: ${id}`, response.data);
            navigate('/applications');
        } catch (error) {
            console.error(`Error accepting application with ID: ${id}`, error.response.data);
        }
    };

    const handleReject = async () => {
        try {
            const response = await http.put(`/FulfilmentStaff/${id}/reject`, { approved: false }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Rejected application with ID: ${id}`, response.data);
            navigate('/applications');
        } catch (error) {
            console.error(`Error rejecting application with ID: ${id}`, error.response.data);
        }
    };

    if (!application) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ p: 3, maxWidth: '800px', margin: 'auto', marginTop: '100px', marginLeft: '325px' }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => navigate('/jobapplication')}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ ml: 2 }}>Job Application Detail</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Applicant ID: {application.applicantId}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Full Name: {application.fullName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Email: {application.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">NRIC: {application.nric}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Contact Number: {application.contactNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Job Role Applied: {application.jobRoleApplied}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Preferred Assigned Area: {application.preferredAssignedArea}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">
                            Preferred Warehouse:{" "}
                            {warehouses.find(w => w.warehouseId === Number(application.preferredWarehouse))?.warehouseName || "Unknown Warehouse"}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6">Status: {application.status}</Typography>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="contained" color="primary" onClick={handleAccept}>
                        Approve
                    </Button>
                    <Button variant="contained" color="secondary" onClick={handleReject}>
                        Reject
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default JobApplicationDetail;