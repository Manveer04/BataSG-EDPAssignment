import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http";
import { jwtDecode } from "jwt-decode";
import { Box, Typography, List, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import BarcodeScannerComponent from "react-qr-barcode-scanner"
// import QrReader from "react-qr-reader";
import 'react-toastify/dist/ReactToastify.css';
import '../css/BarcodeScanning.css';
import DeliveryRouteMap from "../pages/DeliveryRoute"; // Import the new component


const SManageOrder = () => {
  const [allShippedOrders, setAllShippedOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [scanningStatus, setScanningStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannedSuccess, setIsScannedSuccess] = useState(false);
  const [successcanorderid, setSuccessScanOrderId] = useState("");



  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const staffId = decoded.nameid;

        const [assignedResponse, unassignedResponse] = await Promise.all([
          http.get(`/api/Order/GetOrdersByDeliveryAgent/${staffId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          http.get(`/api/Order/unassigned-shipped-orders`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const assignedOrders = assignedResponse.data.message !== "No Orders with Agent" ? assignedResponse.data : [];
        const unassignedOrders = unassignedResponse.data.message !== "No unassigned shipped orders found." ? unassignedResponse.data : [];

        setAllShippedOrders([...assignedOrders, ...unassignedOrders]);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAWGu_ttZhiRdqdAQe3PgCE4VZmJivPIiE&libraries=geometry,places";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("Google Maps API script loaded successfully.");
      };

      script.onerror = () => {
        console.error("Error loading Google Maps API script.");
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    console.log("allShippedOrders updated:", allShippedOrders);
  }, [allShippedOrders]);

  const handlePackOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const endpoint = `/api/Order/addOrderToDeliveryAgent/${selectedOrder}`;
      await http.put(endpoint, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update the order status locally
      setAllShippedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === selectedOrder ? { ...order, orderStatus: 2 } : order
        )
      );

      setOpenDialog(false);
    } catch (error) {
      console.error("Error marking order as delivered:", error);
    }
  };

  // const handlePackOrderScanned = async (orderId) => {
  //   const token = localStorage.getItem("accessToken");
  //   if (!token) return;

  //   try {
  //     // Update the order status locally
  //     setAllShippedOrders((prevOrders) =>
  //       prevOrders.map((order) =>
  //         order.orderId === orderId ? { ...order, orderStatus: 2 } : order
  //       )
  //     );

  //   } catch (error) {
  //     console.error("Error marking order as delivered:", error);
  //   }
  // };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDialog = (orderId) => {
    setSelectedOrder(orderId);
    setOpenDialog(true);
  };

  const fetchOrdersAfterScanned = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const staffId = decoded.nameid;

      const [assignedResponse, unassignedResponse] = await Promise.all([
        http.get(`/api/Order/GetOrdersByDeliveryAgent/${staffId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        http.get(`/api/Order/unassigned-shipped-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const assignedOrders = assignedResponse.data.message !== "No Orders with Agent" ? assignedResponse.data : [];
      const unassignedOrders = unassignedResponse.data.message !== "No unassigned shipped orders found." ? unassignedResponse.data : [];

      setAllShippedOrders([...assignedOrders, ...unassignedOrders]);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  };

  // const getCoordinates = async (address) => {
  //   const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  //   const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vaW50ZXJuYWwtYWxiLW9tLXByZGV6aXQtaXQtbmV3LTE2MzM3OTk1NDIuYXAtc291dGhlYXN0LTEuZWxiLmFtYXpvbmF3cy5jb20vYXBpL3YyL3VzZXIvcGFzc3dvcmQiLCJpYXQiOjE3NDAwNzAxOTEsImV4cCI6MTc0MDMyOTM5MSwibmJmIjoxNzQwMDcwMTkxLCJqdGkiOiJGS21QeXBoR2hsTlBncUU4Iiwic3ViIjoiMDEwYzY3ODQ4OTdiNDJlYmFlYzA5MDExZGJiNjg5YWQiLCJ1c2VyX2lkIjo2MDM3LCJmb3JldmVyIjpmYWxzZX0.loMQ4Iol3YSRn94mxMyseom2umoFdWocAC4a_uNrr1U';  // Replace with your access token
  //   try {
  //     const response = 
  //     await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         "Authorization": `Bearer ${authToken}`,
  //         "Accept": "application/json"
  //       }
  //     })
  //       .then(response => {
  //         if (!response.ok) {
  //           throw new Error(`HTTP error! Status: ${response.status}`);
  //         }
  //         return response.json();
  //       })
  //       .then(data => console.log("✅ OneMap API Response:", data))
  //       .catch(error => console.error("❌ Error:", error));

  //     const data = response;
  //     if (data.found > 0) {
  //       const result = data.results[0];
  //       return {
  //         latitude: result.LATITUDE,
  //         longitude: result.LONGITUDE,
  //       };
  //     } else {
  //       throw new Error('Address not found');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching coordinates:', error);
  //     throw error;
  //   }
  // };

  const getCoordinates = async (address) => {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vaW50ZXJuYWwtYWxiLW9tLXByZGV6aXQtaXQtbmV3LTE2MzM3OTk1NDIuYXAtc291dGhlYXN0LTEuZWxiLmFtYXpvbmF3cy5jb20vYXBpL3YyL3VzZXIvcGFzc3dvcmQiLCJpYXQiOjE3NDAwNzAxOTEsImV4cCI6MTc0MDMyOTM5MSwibmJmIjoxNzQwMDcwMTkxLCJqdGkiOiJGS21QeXBoR2hsTlBncUU4Iiwic3ViIjoiMDEwYzY3ODQ4OTdiNDJlYmFlYzA5MDExZGJiNjg5YWQiLCJ1c2VyX2lkIjo2MDM3LCJmb3JldmVyIjpmYWxzZX0.loMQ4Iol3YSRn94mxMyseom2umoFdWocAC4a_uNrr1U';  // Replace with your access token
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ OneMap API Response:", data);

      if (data.found > 0) {
        const result = data.results[0];
        return {
          latitude: result.LATITUDE,
          longitude: result.LONGITUDE,
        };
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw error;
    }
  };

  const handleShowNavigation = async (order) => {
    const { latitude, longitude } = await getCurrentLocation();
    const { latitude: destLat, longitude: destLon } = await getCoordinates(order.shippingAddress.fullAddress);
    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${latitude}%2C${longitude}&end=${destLat}%2C${destLon}&routeType=drive`;
    const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vaW50ZXJuYWwtYWxiLW9tLXByZGV6aXQtaXQtbmV3LTE2MzM3OTk1NDIuYXAtc291dGhlYXN0LTEuZWxiLmFtYXpvbmF3cy5jb20vYXBpL3YyL3VzZXIvcGFzc3dvcmQiLCJpYXQiOjE3NDAwNzAxOTEsImV4cCI6MTc0MDMyOTM5MSwibmJmIjoxNzQwMDcwMTkxLCJqdGkiOiJGS21QeXBoR2hsTlBncUU4Iiwic3ViIjoiMDEwYzY3ODQ4OTdiNDJlYmFlYzA5MDExZGJiNjg5YWQiLCJ1c2VyX2lkIjo2MDM3LCJmb3JldmVyIjpmYWxzZX0.loMQ4Iol3YSRn94mxMyseom2umoFdWocAC4a_uNrr1U';  // Replace with your access token

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${authToken}`,  // API token for authorization
        }
      });

      const data = await response.json();
      setRouteData(data);
    } catch (error) {
      console.error('Error fetching route data:', error);
    }
  };

  const renderOrders = (orders) => (
    <List>
      {orders.map((order) => (
        <Box key={order.orderId} sx={{ border: "1px solid #ccc", borderRadius: "8px", mb: 2, p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Order #{order.orderId}</Typography>
              <Typography variant="body2" sx={{ color: "gray" }}>{order.shippingAddress.fullAddress}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" sx={{ color: order.orderStatus === 1 ? "orange" : "green" }}>
                {order.orderStatus === 1 ? "⏳ Shipped" : "✅ Delivered"}
              </Typography>
              <Typography variant="body2">{new Date(order.orderDate).toLocaleString()}</Typography>
            </Box>
          </Box>
          {order.orderItems.map((item) => (
            <Box key={item.orderItemId} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">{item.productName}</Typography>
              <Typography variant="body2">x{item.quantity}</Typography>
              <Typography variant="body2">SGD {item.price.toFixed(2)}</Typography>
              <Typography variant="body2">SGD {(item.price * item.quantity).toFixed(2)}</Typography>
            </Box>
          ))}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              sx={{ backgroundColor: order.orderStatus === 2 ? "gray" : "green", color: "white" }}
              onClick={() => handleOpenDialog(order.orderId)}
              disabled={order.orderStatus === 2}
            >
              {order.orderStatus === 2 ? "Completed" : "Mark as Delivered"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleShowNavigation(order)}
              sx={{ ml: 1 }}
            >
              Show Navigation
            </Button>
          </Box>
        </Box>
      ))}
    </List>
  );

  const handleScan = async (barcode) => {
    if (!barcode || isProcessing) return;
    const scannedOrderId = parseInt(barcode.replace(/\D/g, ""), 10);
    setSuccessScanOrderId(scannedOrderId);
  
    const token = localStorage.getItem("accessToken");
    if (!token) return;
  
    const beepSound = new Audio("/beep.mp3"); // Path to beep sound file
  
    setScanningStatus(`🔍 Scanning barcode: ${barcode}...`);
    setIsProcessing(true); // Start processing state
  
    try {
      const response = await http.put(`/api/Order/ScanAWBBarcode/${barcode}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200) {
        beepSound.play();
        const { OrderId } = response.data;
        setSuccessOrderId(OrderId);
        setIsScannedSuccess(true);
        setScanningStatus(`✅ Order #${scannedOrderId} delivered! 🎉`);
  
        // Update the order status locally
        setAllShippedOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderId === scannedOrderId ? { ...order, orderStatus: 2 } : order
          )
        );
  
        // Keep the success message visible for 2 seconds
        setTimeout(() => {
          setScanningStatus("");
          setIsScannedSuccess(false);
          setIsProcessing(false);
        }, 2000); // ✅ Keep success message for 2 seconds
      } else {
        setScanningStatus("❌ Failed to mark order as delivered.");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setScanningStatus("❌ Order already scanned.");
      } else {
        setScanningStatus("❌ Error processing barcode.");
      }
      setIsProcessing(false); // Reset processing state on error
    }
  };


  return (
    <Box sx={{ marginTop: "90px", marginLeft: "4%", width: "94vw" }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>📦 Manage Orders</Typography>

      {/* Toggle Scanning Mode */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setScanning(!scanning)}
        disabled={isProcessing}
        sx={{
          mb: 2,
          background: scanning ? "white" : "white",
          "&:hover": { background: scanning ? "gray" : "gray" }
        }}
      >
        {scanning ? "🛑 Stop Scanning" : "📸 Scan Barcode"}
      </Button>

      {/* Scanning Window with Animation */}
      {scanning && (
        <Box className="scanner-container">
          <Box className="scanner-line"></Box>
          <BarcodeScannerComponent
            width="100%"
            height={350}
            onUpdate={(err, result) => {
              if (result) handleScan(result.text);
            }}
          />
        </Box>
      )}
      

      {/* Scanning Status & Success Effect */}
      {scanningStatus && (
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            mt: 2,
            color: isScannedSuccess ? "green" : "red",
            fontWeight: "bold"
          }}
        >
          {scanningStatus}
        </Typography>
      )}
      {renderOrders(allShippedOrders)}

      {/* <Button
        variant="contained"
        color="secondary"
        onClick={handleShowNavigation}
        sx={{ mt: 2 }}
      >
        Show Navigation
      </Button> */}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Mark as Delivered
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to mark this order as delivered?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="red">
            Cancel
          </Button>
          <Button onClick={handlePackOrder} color="green" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Animation Dialog */}
      <Dialog open={isScannedSuccess}>
        <DialogTitle sx={{ textAlign: "center", color: "green" }}>🎉 Success!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: "center" }}>
            ✅ Order #{successcanorderid} has been delivered!
          </DialogContentText>
        </DialogContent>
      </Dialog>


      {routeData && (
        <DeliveryRouteMap
          routeGeometry={routeData.route_geometry}
          routeInstructions={routeData.route_instructions}
        />
      )}

    </Box>
  );
};

export default SManageOrder;