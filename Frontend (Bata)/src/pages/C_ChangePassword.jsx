import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/C_ChangePassword.css";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("New password and confirm password must match.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken"); // Retrieve token
      await http.put("api/user/change-password", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Password changed successfully! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage(error.response.data);
    }
  };

  return (
    <div className="change-password-container">
      <CustomerSidebar /> {/* Sidebar for customer account pages */}
      <h2>Change Password</h2>
      {message && <p className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</p>}
      <form onSubmit={handleSubmit} className="change-password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password:</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">Save Changes</button>
      </form>
    </div>
  );
};

export default ChangePassword;
