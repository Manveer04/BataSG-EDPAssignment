import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http";
import { jwtDecode } from "jwt-decode";
import { Box, Typography, List, Divider, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

const SManageOrder = () => {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isShipped, setIsShipped] = useState(false);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const staffId = decoded.nameid;

        const response = await http.get(`/api/Order/GetOrdersByFulfilmentStaff/${staffId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Assigned orders:", response.data);
        setAssignedOrders(response.data);
      } catch (error) {
        console.error("Error fetching assigned orders:", error);
      }
    };

    fetchAssignedOrders();
  }, []);

  const handlePackOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const endpoint = isShipped ? `/FulfilmentStaff/order/${selectedOrder}/unpack` : `/FulfilmentStaff/order/${selectedOrder}/pack`;
      await http.put(endpoint, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update the order status locally
      setAssignedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === selectedOrder ? { ...order, orderStatus: isShipped ? 0 : 1 } : order
        )
      );
      setOpenDialog(false);
    } catch (error) {
      console.error(`Error ${isShipped ? "unpacking" : "packing"} order:`, error);
    }
  };

  const handleDownloadAWB = async (orderId) => {
    const token = localStorage.getItem("accessToken");

    try {
      const response = await http.get(`/api/Order/GenerateAWB/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important to handle binary response
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `AWB_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading AWB:", error);
    }
  };


  const handleOpenDialog = (orderId, isShipped) => {
    setSelectedOrder(orderId);
    setIsShipped(isShipped);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Box sx={{ marginTop: "90px", marginLeft: "6%", width: "90vw", marginRight: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Assigned Orders</Typography>
      <List>
        {assignedOrders.map((order) => (
          <Box key={order.orderId} sx={{ border: "1px solid #ccc", borderRadius: "8px", mb: 2, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>Order #{order.orderId}</Typography>
                <Typography variant="body2" sx={{ color: "gray" }}>{order.email}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: order.orderStatus === 1 ? "green" : "orange" }}>
                  {order.orderStatus === 1 ? "✅ Shipped" : "⏳ Pending"}
                </Typography>
                <Typography variant="body2">{new Date(order.orderDate).toLocaleString()}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            {order.orderItems.map((item) => (
              <Box key={item.orderItemId} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ flex: "1 1 40%", textAlign: "left" }}>{item.productName}</Typography>
                <Typography variant="body2" sx={{ flex: "1 1 20%", textAlign: "center" }}>x{item.quantity}</Typography>
                <Typography variant="body2" sx={{ flex: "1 1 20%", textAlign: "right" }}>SGD {item.price.toFixed(2)}</Typography>
                <Typography variant="body2" sx={{ flex: "1 1 20%", textAlign: "right" }}>SGD {(item.price * item.quantity).toFixed(2)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>Total Amount: SGD  {order.totalAmount.toFixed(2)}</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog(order.orderId, order.orderStatus === 1)}
              >
                {order.orderStatus === 1 ? "📦 Unpack Order" : "📦 Pack Order"}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                sx={{ marginLeft: "10px" }}
                onClick={() => handleDownloadAWB(order.orderId)}
              >
                🖨️ Print AWB
              </Button>

            </Box>
          </Box>
        ))}
      </List>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {isShipped ? "Unpack Order" : "Pack Order"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to {isShipped ? "unpack" : "pack"} this order?
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

    </Box>
  );
};

export default SManageOrder;