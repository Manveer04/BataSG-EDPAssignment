import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/AccountInfo.css"; 

const AdminAccountInfo = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Retrieve token
        console.log(token);
        const response = await http.get("/api/admin/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response);
        // Populate the formData with user details from the response
        const userData = response.data;
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
        });

        setMessage(""); // Clear any previous error messages
      } catch (error) {
        console.error(error);
        setMessage("Error fetching admin data. Please try again later.");
      }
    };

    fetchUserData();
  }, []);

  const handleEditClick = () => {
    navigate("/admin/edit-account");
  };
  const handleViewAddressesClick = () => {
    navigate("/admin/view-address");
  };
  const handleAddAddressesClick = () => {
    navigate("/admin/add-address");
  };

  return (
    <div className="account-info-container">
      <h2>Admin Account Information</h2>
      {message && <p className="error-message">{message}</p>}
      <div className="account-info-card">
        <div className="info-section">
          <div className="info-field">
            <label>Username:</label>
            <p>{formData.username || "Not provided"}</p>
          </div>
          <div className="info-field">
            <label>Email:</label>
            <p>{formData.email || "Not provided"}</p>
          </div>
          <div className="info-field">
            <label>Phone Number:</label>
            <p>{formData.phoneNumber || "Not set"}</p>
          </div>
        </div>
      </div>
      <button className="edit-button" onClick={handleEditClick}>
        Edit Information
      </button>
    </div>
  );
};

export default AdminAccountInfo;
