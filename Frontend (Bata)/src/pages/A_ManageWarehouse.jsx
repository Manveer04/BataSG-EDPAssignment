import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import http from "../http";
import { ToastContainer, toast } from "react-toastify";

function AdminWarehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [WarehouseName, setWarehouseName] = useState('');
  const [WarehouseAddress, setWarehouseAddress] = useState('');
  const [encodedEwt, setEncodedEwt] = useState('JTNDcCUzRVlvdXIlMjBMb2NhdGlvbiUzQyUyRnAlM0U'); // Default encoded value
  const [latitude, setlatitude] = useState(null);
  const [longitude, setlongitude] = useState(null); 
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressResults, setAddressResults] = useState([]); // To store API results
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Track visibility of dropdown
  const [searchTerm, setSearchTerm] = useState('');  // Track input field value
  const [selectedWarehouse, setSelectedWarehouse] = useState({
    warehouseId: "",
    warehouseName: "",
    address: "",
    postalCode: "",
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = () => {
    http.get("/Warehouse")
      .then((res) => setWarehouses(res.data))
      .catch((err) => console.error("Error fetching warehouses:", err));
  };

  const handleDialogOpen = (warehouse = { warehouseId: "", warehouseName: "", address: "", postalCode: "" }) => {
    setEditMode(!!warehouse.warehouseId);
    setSelectedWarehouse(warehouse);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedWarehouse({ warehouseId: "", warehouseName: "", address: "", postalCode: "" });
  };

  const handleInputChange = (e) => {
    setSelectedWarehouse({ ...selectedWarehouse, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    let warehouseData = { 
      warehouseId: selectedWarehouse.warehouseId,
      warehouseName: WarehouseName, 
      address: WarehouseAddress,
      postalCode: postalCode,
  };

  
    if (editMode) {
      console.log("Updating Warehouse:", warehouseData);
      
      http.put(`/Warehouse/${warehouseData.warehouseId}`, warehouseData)
        .then(() => {
          toast.success("Warehouse updated successfully");
          fetchWarehouses();
          handleDialogClose();
        })
        .catch((error) => {
          console.error("Error updating warehouse:", error);
          if (error.response) {
            console.error("Response Data:", error.response.data);
            toast.error(`Update error: ${error.response.data.message || "Unknown issue"}`);
          } else {
            toast.error("Failed to update warehouse. Check console.");
          }
        });
    } else {
      delete warehouseData.warehouseId;  // 🚀 Remove warehouseId on new warehouse creation
      console.log("Creating Warehouse:", warehouseData);
      
      http.post("/Warehouse", warehouseData)
        .then(() => {
          toast.success("Warehouse added successfully");
          fetchWarehouses();
          handleDialogClose();
        })
        .catch((error) => {
          console.error("Error adding warehouse:", error);
          if (error.response) {
            console.error("Response Data:", error.response.data);
            toast.error(`Create error: ${error.response.data.message || "Unknown issue"}`);
          } else {
            toast.error("Failed to create warehouse. Check console.");
          }
        });
    }
  };

  const handleAddressSearch = async (event) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    setShowMap(false); 

    if (!searchValue) {
        setAddressResults([]); // Clear the address list if search term is empty
        setShowMap(false); 
        setIsDropdownVisible(false); // Hide the dropdown
        setEncodedEwt('JTNDcCUzRVlvdXIlMjBMb2NhdGlvbiUzQyUyRnAlM0U'); // Reset to default
        return;
    }

    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${searchValue}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const authToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5OTFjODYzMzRiNGZkNTQzOTExM2JlYzkyMzIxZWUxNSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTczODczNjA4OCwiZXhwIjoxNzM4OTk1Mjg4LCJuYmYiOjE3Mzg3MzYwODgsImp0aSI6IkYyVnFaUkJMT0JOTldDemsiLCJ1c2VyX2lkIjo1ODQxLCJmb3JldmVyIjpmYWxzZX0.LHnZCd4qE7sE-oG85NOJqSiEtpCcm7x75VcY07gjelM';  // Replace with your access token

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `${authToken}`,
            },
        });

        const data = await response.json();
        setAddressResults(data.results || []);
        setIsDropdownVisible(data.results.length > 0); // Show dropdown only if results exist
    } catch (error) {
        console.error('Error fetching address data:', error);
    }
};

// Handle address selection
const handleAddressSelect2 = (address) => {
    console.log("Selected Address:", address);
    setPostalCode(address.POSTAL); // Set the postal code
    const formattedAddress = `${address.BLK_NO} ${address.ROAD_NAME}`;
    setWarehouseAddress(formattedAddress); // Set the selected address
    setSearchTerm(address.ADDRESS); 
    setlatitude(address.LATITUDE);
    setWarehouseName(address.BUILDING);
    setlongitude(address.LONGITUDE);
    setShowMap(true); 
    setIsDropdownVisible(false); // Hide the dropdown once an address is selected
    setAddressResults([]); // Clear the suggestions list
    // Encode the selected address and update the state
    const encodedValue = encodeSearchTerm(address.ADDRESS);
    setEncodedEwt(encodedValue);
};

const handleAddressSelect = (address) => {
    setSelectedAddress(address.id); // Set the selected address ID
    setSearchTerm(address.street);   // Auto-fill street
    setUnitNo(address.unitNo);   // Auto-fill unitNo
    setPostalCode(address.postalCode); // Auto-fill postal code
    setWarehouseName(address.BUILDING);
};

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this warehouse?")) {
      http.delete(`/Warehouse/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Include JWT token
        },
      })
        .then(() => {
          toast.success("Warehouse deleted successfully");
          fetchWarehouses(); // Refresh the list
        })
        .catch((error) => {
          console.error("Error deleting warehouse:", error);
          if (error.response && error.response.status === 401) {
            toast.error("Unauthorized: Please login as an admin.");
          } else {
            toast.error("Error deleting warehouse");
          }
        });
    }
  };

  return (
    <Box sx={{ p: 3, marginTop: "70px", textAlign: "center", paddingLeft: "350px" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Manage Warehouses</Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => handleDialogOpen()}>
        Add Warehouse
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Postal Code</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.warehouseId}>
                <TableCell>{warehouse.warehouseId}</TableCell>
                <TableCell>{warehouse.warehouseName}</TableCell>
                <TableCell>{warehouse.address}</TableCell>
                <TableCell>{warehouse.postalCode}</TableCell>
                <TableCell>
                  <Button variant="contained" color="warning" sx={{ mr: 1 }} onClick={() => handleDialogOpen(warehouse)}>
                    Edit
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleDelete(warehouse.warehouseId)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Adding/Editing Warehouse */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{editMode ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
        <DialogContent>
        <TextField
                        type="text"
                        placeholder="Address"
                        value={searchTerm}
                        onChange={handleAddressSearch}
                    />
                     {isDropdownVisible && addressResults.length > 0 && (
                        <div className="address-dropdown">
                            {addressResults.map((address, index) => (
                                <div key={index} onClick={() => handleAddressSelect2(address)} className="address-item2">
                                    <p>{address.ADDRESS}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Embed Google Map iframe only if showMap is true */}
                    {showMap && latitude && longitude && (
                        <div style={{ marginTop: "5px" }}>
                            <iframe
                            src={`https://www.onemap.gov.sg/minimap/minimap.html?mapStyle=Default&zoomLevel=17&latLng=${latitude},${longitude}&ewt=${encodedEwt}&popupWidth=200&showPopup=true`}
                            height="350"
                            width="550"
                            scrolling="no"
                            frameborder="0"
                            allowfullscreen="allowfullscreen"
                        ></iframe>
                        </div>
                    )}
          <TextField fullWidth margin="dense" label="Warehouse Name" name="warehouseName" value={WarehouseName} onChange={handleInputChange} />
          <TextField fullWidth margin="dense" label="Address" name="address" value={WarehouseAddress} onChange={handleInputChange} />
          <TextField fullWidth margin="dense" label="Postal Code" name="postalCode" value={postalCode} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="black">
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  );
}

export default AdminWarehouse;