import React, { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ImportStock = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setFile(selectedFile);
        } else {
            toast.error('Please select a valid Excel file.');
        }
    };

    // Handle file upload
    const handleImport = () => {
        if (!file) {
            toast.error('Please upload a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        // Make an API call to upload the Excel file and import the stock data
        http.post('/stock/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then((response) => {
                toast.success('Stock data imported successfully!');
            })
            .catch((error) => {
                toast.error('Error importing stock data');
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
                setFile(null); // Reset file after upload
            });
    };

    return (
        <Box sx={{ maxWidth: 600, margin: '0 auto', mt: 5 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Import Stock Data</Typography>
            <Box sx={{ mb: 2 }}>
                <TextField
                    type="file"
                    onChange={handleFileChange}
                    fullWidth
                    accept=".xlsx, .xls"
                    helperText="Please upload an Excel file"
                />
            </Box>
            <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                disabled={loading}
                sx={{ mt: 2 }}
            >
                {loading ? 'Importing...' : 'Import Stock Data'}
            </Button>
            <ToastContainer />
        </Box>
    );
};

export default ImportStock;
