import React, { useEffect, useState } from 'react';
import '../NewArrivals.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, CardActionArea } from '@mui/material';
import http from '../http';
import EditIcon from '@mui/icons-material/Edit';
import EditStockIcon from '@mui/icons-material/Storage'; // Icon for Edit Stock
import DownloadIcon from '@mui/icons-material/CloudDownload'; // Icon for Export
import ImportExportIcon from '@mui/icons-material/ImportExport'; // Icon for Import Stock
import CartSidebar from './CartSidebar';
import { ToastContainer, toast } from 'react-toastify';

const StaffProduct = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Display toast message if present in location state
        if (location.state?.toastMessage) {
            toast.success(location.state.toastMessage);
            // Clear the location state
            navigate(location.pathname, { replace: true }); // Replace history entry to remove state
        }
    }, [location.state, navigate]);

    useEffect(() => {
        http.get('/product')
            .then((res) => {
                console.log("Fetched Products:", res.data); // Debugging log
                setProducts(res.data);
            })
            .catch((err) => console.error('Error fetching products:', err));
    }, []);
    

    const handleEditProduct = (id) => {
        navigate(`/editproduct/${id}`);
    };

    const handleEditStock = (productId) => {
        console.log("Navigating to edit stock with productId:", productId); // Debugging log
        navigate(`/editstocks/${productId}`);
    };
       

    const handleCreateProduct = () => {
        navigate('/addproduct');
    };

    // Handle the stock export to Excel
    const handleExportStock = () => {
        http.get('/stock/export', { responseType: 'blob' })
            .then((response) => {
                // Create a URL for the file blob
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'StockData.xlsx');  // Specify file name
                document.body.appendChild(link);
                link.click();  // Trigger the download
                document.body.removeChild(link);  // Clean up
            })
            .catch((error) => {
                toast.error('Error exporting stock data');
                console.error(error);
            });
    };

    // Navigate to ImportStock page
    const handleImportStock = () => {
        navigate('/importstock');
    };

    return (
        <div className="new-arrivals" style={{marginTop: "90px"}}>
            <ToastContainer />
            <div className="title">
                <h1>Products</h1>
            </div>

            {/* Export Stock Button */}
            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    marginTop: '20px', // Adjust the margin-top to ensure it doesn't overlap
                    position: 'absolute',
                    top: '55px', // Position this button above the products
                    left: '48.5%',
                    '&:hover': {
                        backgroundColor: '#1565c0',
                    },
                }}
                onClick={handleExportStock}
                startIcon={<DownloadIcon />} // Add an icon for Export Stock
            >
                Export Stock to Excel
            </Button>

            {/* Import Stock Button */}
            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    marginTop: '20px',
                    position: 'absolute',
                    top: '55px', // Position this button above the products
                    left: '67%',  // Position this button next to the Export button
                    '&:hover': {
                        backgroundColor: '#1565c0',
                    },
                }}
                onClick={handleImportStock}
                startIcon={<ImportExportIcon />} // Add an icon for Import Stock
            >
                Import Stock
            </Button>

            {/* Add New Product Button */}
            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    position: 'absolute',
                    right: '8%',
                    top: '75px', // Position this button above the products
                    '&:hover': {
                        backgroundColor: '#1565c0',
                    },
                }}
                onClick={handleCreateProduct}
            >
                Add New Product
            </Button>

            <div className="new-arrivals-products" style={{ marginTop: "70px"}}>
                {products.map((product) => (
                    <div key={product.id} style={{ position: 'relative', marginBottom: '20px', marginTop: '20px'}}>
                        <Card
                            sx={{
                                width: 300,
                                height: 390,
                                borderRadius: '10px',
                                paddingTop: "0px",
                                boxShadow: '0 0px 6px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <EditIcon
                                sx={{
                                    marginLeft: '255px',
                                    marginTop: '15px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleEditProduct(product.productId)}
                            />
                            <CardActionArea>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={`${import.meta.env.VITE_FILE_BASE_URL}${product.image}`}
                                    alt={product.name}
                                />
                                <CardContent>
                                    <Typography
                                        gutterBottom
                                        variant="h6"
                                        component="div"
                                        sx={{ fontSize: '20px', fontWeight: 'bold', color: '#414B56' }}
                                    >
                                        {product.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '17px', fontWeight: 'bold', color: '#414B56' }}>
                                        ${product.price}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>

                        {/* Edit Stock Button */}
                        <Button
                            variant="contained"
                            sx={{
                                position: 'absolute',
                                bottom: '15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#1565c0',
                                },
                            }}
                            onClick={() => handleEditStock(product.productId)}
                            startIcon={<EditStockIcon />} // Optional: You can add an icon for Edit Stock
                        >
                            View Stock
                        </Button>
                    </div>
                ))}
            </div>

            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default StaffProduct;


// import React, { useEffect, useState } from 'react';
// import '../NewArrivals.css';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Card, CardContent, CardMedia, Typography, Button, CardActionArea, CardActions } from '@mui/material';
// import http from '../http';
// import EditIcon from '@mui/icons-material/Edit';
// import CartSidebar from './CartSidebar';
// import { ToastContainer, toast } from 'react-toastify';

// const StaffProduct = () => {
//     const navigate = useNavigate();
//     const [products, setProducts] = useState([]);
//     const [isCartOpen, setIsCartOpen] = useState(false);
//     const location = useLocation();

//     useEffect(() => {
//         // Display toast message if present in location state
//         if (location.state?.toastMessage) {
//             toast.success(location.state.toastMessage);
//             // Clear the location state
//             navigate(location.pathname, { replace: true }); // Replace history entry to remove state
//         }
//     }, [location.state, navigate]);

//     useEffect(() => {
//         http.get('/product')
//             .then((res) => setProducts(res.data))
//             .catch((err) => console.error('Error fetching products:', err));
//     }, []);

//     const handleEditProduct = (id) => {
//         navigate(`/editproduct/${id}`);
//     };

//     const handleCreateProduct = () => {
//         navigate('/createproduct');
//     };

//     return (
//         <div className="new-arrivals">
//             <ToastContainer />
//             <div className="title">
//                 <h1>Products</h1>
//             </div>
//             <Button
//                     variant="contained"
//                     sx={{
//                         backgroundColor: '#1976d2',
//                         color: 'white',
//                         right: '8%',
//                         position: 'absolute',
//                         '&:hover': {
//                             backgroundColor: '#1565c0',
//                         },
//                     }}
//                     onClick={handleCreateProduct}
//                 >
//                     Add New Product
//                 </Button>
//             <div className="new-arrivals-products">
//                 {products.map((product) => (
//                     <Card
//                         key={product.productId}
//                         sx={{
//                             width: 300,
//                             borderRadius: '10px',
//                             marginTop: '50px',
//                             boxShadow: '0 0px 6px rgba(0, 0, 0, 0.1)',
//                             position: 'relative',
//                         }}
//                     >
//                         <EditIcon
//                             sx={{
//                                 marginLeft: '260px',
//                                 marginTop: '10px',
//                                 cursor: 'pointer',
//                             }}
//                             onClick={() => handleEditProduct(product.productId)}
//                         />
//                         <CardActionArea>
//                             <CardMedia
//                                 component="img"
//                                 height="200"
//                                 image={`${import.meta.env.VITE_FILE_BASE_URL}${product.image}`}
//                                 alt={product.name}
//                             />
//                             <CardContent>
//                                 <Typography
//                                     gutterBottom
//                                     variant="h6"
//                                     component="div"
//                                     sx={{ fontSize: '20px', fontWeight: 'bold', color: '#414B56' }}
//                                 >
//                                     {product.name}
//                                 </Typography>
//                                 <Typography sx={{ fontSize: '17px', fontWeight: 'bold', color: '#414B56' }}>
//                                     ${product.price}
//                                 </Typography>
//                             </CardContent>
//                         </CardActionArea>
//                     </Card>
//                 ))}
//             </div>
//             <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
//         </div>
//     );
// };

// export default StaffProduct;
