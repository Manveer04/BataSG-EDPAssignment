import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/C_ViewAddress.css"; // Import the CSS file

const ViewAddress = () => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await http.get("api/user/addresses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddresses(response.data);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch addresses.");
      }
    };

    fetchAddresses();
  }, []);

  const handleAddAddress = () => {
    navigate("/add-address");
  };

  const handleReturnToAccount = () => {
    navigate("/accountinfo");
  };

  const handleEditAddress = (id) => {
    navigate(`/edit-address/${id}`);
  };

  const handleDeleteAddress = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this address?");
    if (confirmed) {
      try {
        const token = localStorage.getItem("accessToken");
        await http.delete(`api/user/addresses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddresses((prevAddresses) =>
          prevAddresses.filter((address) => address.id !== id)
        );
        setError(""); // Clear any error messages
      } catch (error) {
        console.error(error);
        setError("Failed to delete address.");
      }
    }
  };

  return (
    <div className="view-address-page">
      <div className="view-address-container">
        <header className="view-address-header">
          <button className="return-button" onClick={handleReturnToAccount}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-arrow-right"
              viewBox="0 0 16 16"
              style={{ marginRight: "10px", strokeWidth: 2 }}
            >
              <path d="M4.146 7.854a.5.5 0 0 1 0 .708L8.293 12.5a.5.5 0 0 1 .707-.707L5.707 9H14.5a.5.5 0 0 1 0-1H5.707l3.293-3.146a.5.5 0 0 1-.707-.707L4.146 7.854z" />
            </svg>
            Return to Account Information
          </button>
          <h1 className="title">Addresses</h1>
          <button className="add-address-button" onClick={handleAddAddress}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="bi bi-plus"
              viewBox="0 0 16 16"
              style={{ marginRight: "5px" }}
            >
              <path d="M8 7V1h1v6h6v1H9v6H8V8H2V7h6z" />
            </svg>
            Add Address
          </button>
        </header>
        {error && <p className="error-message">{error}</p>}
        {addresses.length === 0 ? (
          <div>
            <p>No addresses found. Please add an address.</p>
          </div>
        ) : (
          <table className="address-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit Number</th>
                <th>Street</th>
                <th>Postal Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((address) => (
                <tr key={address.id}>
                  <td className="name">{address.name}</td>
                  <td className="unit-number">{address.unitNo}</td>
                  <td className="street">{address.street}</td>
                  <td className="postal-code">{address.postalCode}</td>
                  <td className="actions">
                    <button className="edit-button" onClick={() => handleEditAddress(address.id)}>
                      ✏️ Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteAddress(address.id)}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViewAddress;
