import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Input, IconButton, Button, Grid, Card, CardContent } from '@mui/material';
import { Search, Clear, Edit } from '@mui/icons-material';
import http from '../http';
import UserContext from '../contexts/UserContext';

function Category() {
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const { user } = useContext(UserContext);

    const fetchCategories = () => {
        http.get(`/category${search ? `?search=${search}` : ''}`).then((res) => setCategories(res.data));
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSearch = () => fetchCategories();
    const handleClear = () => {
        setSearch('');
        fetchCategories();
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ my: 2 }}>Categories</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
                <IconButton onClick={handleSearch}><Search /></IconButton>
                <IconButton onClick={handleClear}><Clear /></IconButton>
                {user && (
                <Link to="/addcategory">
                    <Button variant="contained">Add</Button>
                </Link>
                )}
            </Box>
            <Grid container spacing={2}>
                {categories.map((category) => (
                    <Grid item xs={12} md={6} lg={4} key={category.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{category.category}</Typography>
                                <Typography color="textSecondary">{new Date(category.createdAt).toLocaleString()}</Typography>
                                {user && (
                                    <Link to={`/editcategory/${category.id}`}>
                                        <IconButton><Edit /></IconButton>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default Category;