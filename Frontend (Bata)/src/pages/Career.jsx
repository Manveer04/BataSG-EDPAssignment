import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Container, Button, List, ListItem } from '@mui/material';
import UserContext from '../contexts/UserContext';

function Career() {
    const { user } = useContext(UserContext); // Fixed missing `user`

    return (
        <Container sx={{ minHeight: '100vh', padding: '40px 20px'}}>
            <Box sx={{
                marginTop: '70px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', width: '97vw'
            }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Career Opportunities
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, width: '100%', maxWidth: 1200 }}>
                    <Box sx={{ my: 2, flex: '1 1 45%', maxWidth: '45%', textAlign: 'center', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                        <img src="src/assets/FulfilmentStaff.jpg" alt="Fulfillment Staff" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                        <Typography variant="h4" component="h2" gutterBottom>
                            <b>Fulfillment Staff</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Fulfillment staff are responsible for processing and packing orders, ensuring that all items are correctly picked, packed, and shipped. They work closely with inventory management to keep track of stock levels and ensure that orders are fulfilled accurately and efficiently.
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Key Responsibilities:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>Order Processing: Accurately picking and packing orders based on customer specifications.</li>
                                <li>Inventory Coordination: Communicating with inventory teams to track stock levels and replenish when necessary.</li>
                                <li>Quality Control: Checking items for damage or discrepancies before packaging.</li>
                                <li>Shipping Preparation: Labeling and preparing packages for shipment, ensuring compliance with shipping guidelines.</li>
                                <li>Returns Processing: Handling customer returns and ensuring items are processed for restocking or disposal as required.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Working Hours:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Fulfillment staff typically work in shifts, as many fulfillment centers operate 24/7 to meet customer demand. Shift patterns may include:
                            <ul>
                                <li>Morning Shifts: Typically from 6:00 AM to 2:00 PM.</li>
                                <li>Afternoon Shifts: Often from 2:00 PM to 10:00 PM.</li>
                                <li>Night Shifts: Running from 10:00 PM to 6:00 AM for overnight operations.</li>
                                <li>Overtime: During peak seasons (e.g., holiday periods), fulfillment staff may be required to work overtime, including weekends and holidays.</li>
                                <li>Part-Time/Full-Time: Fulfillment jobs can be part-time or full-time, with many centers offering flexible scheduling for employees.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Skills and Requirements:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>Attention to Detail: Ensuring that the correct items are picked and packed as per customer order.</li>
                                <li>Physical Stamina: The job may involve standing for long periods, lifting packages, and moving throughout the warehouse.</li>
                                <li>Teamwork: Collaborating with other staff, including supervisors and inventory teams.</li>
                                <li>Time Management: Meeting order fulfillment deadlines, especially during high-volume periods.</li>
                                <li>Basic Computer Skills: Using warehouse management systems (WMS) to update order statuses and stock levels.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Work Environment:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>Warehouse Setting: Fulfillment staff typically work in large warehouse or distribution centers.</li>
                                <li>Pace of Work: The pace can be fast, especially during peak seasons where high volumes of orders need to be fulfilled.</li>
                            </ul>
                        </Typography>
                        {user ? (
                            <Button
                                component={RouterLink}
                                to="/applyfulfilmentstaff"
                                variant="contained"
                                color="info"
                                sx={{ mt: 2, ':hover': { backgroundColor: 'grey', color: 'white' } }}
                            >
                                Apply Now!
                            </Button>
                        ) : (
                            <Typography variant="body1" color="error">
                                Please log in to apply.
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ my: 2, flex: '1 1 45%', maxWidth: '45%', textAlign: 'center', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                        <img src="src/assets/DeliveryAgent.jpg" alt="Delivery Agent" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                        <Typography variant="h4" component="h2" gutterBottom>
                            <b>Delivery Agent</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Delivery agents are responsible for delivering orders to customers in a timely and professional manner. They ensure that all deliveries are made accurately and efficiently, and provide excellent customer service.
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Key Responsibilities:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>Valid driver’s license with a clean driving record; additional certifications for larger vehicles may be required.</li>
                                <li>Strong time management to meet delivery schedules.</li>
                                <li>Proficiency in using GPS for efficient route planning.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Working Hours:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Delivery agents often work shifts, which may include early mornings, late evenings, weekends, and holidays, depending on customer demand and the company’s operating hours. Shift patterns may include:
                            <ul>
                                <li>Morning Shifts: Typically from 7:00 AM to 3:00 PM.</li>
                                <li>Afternoon Shifts: Often from 3:00 PM to 11:00 PM.</li>
                                <li>Flexible Hours: Part-time and full-time positions may be available, and many companies offer flexible working hours.</li>
                                <li>Overtime: During peak periods (e.g., holidays, sales events), delivery agents may be required to work overtime, including weekends and holidays.</li>
                                <li>On-Demand Services: Some delivery agents work on an on-demand or freelance basis, accepting delivery jobs as needed.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Skills and Requirements:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>Valid Driver's License: A clean driving record and valid driver's license are essential, especially for delivery agents handling motor vehicles. In some cases, additional certifications may be required for driving larger vehicles.</li>
                                <li>Time Management: Ensuring deliveries are made on schedule, especially during busy periods.</li>
                                <li>Navigation Skills: Proficiency in using GPS devices or apps to plan routes and make deliveries efficiently.</li>
                                <li>Customer Service Skills: Providing a positive customer experience, resolving any issues that arise during delivery, and maintaining a professional attitude.</li>
                            </ul>
                        </Typography>
                        <Typography variant="h6" component="h3" gutterBottom>
                            <b>Work Environment:</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <ul>
                                <li>On the Road: Delivery agents spend most of their time driving and delivering to various locations.</li>
                                <li>Fast-Paced: The job can be fast-paced, especially during peak seasons.</li>
                                <li>Weather Conditions: Work occurs in all weather conditions, from rain or shine</li>
                                <li>Customer Interactions: Agents represent the company, interacting professionally with customers and addressing inquiries or complaints.</li>
                            </ul>
                        </Typography>
                        {user ? (
                            <Button
                                component={RouterLink}
                                to="/applydeliveryagent"
                                variant="contained"
                                color="info"
                                sx={{ mt: 2, ':hover': { backgroundColor: 'grey', color: 'white' } }}>
                                Apply Now!
                            </Button>
                        ) : (
                            <Typography variant="body1" color="error">
                                Please log in to apply.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default Career;
