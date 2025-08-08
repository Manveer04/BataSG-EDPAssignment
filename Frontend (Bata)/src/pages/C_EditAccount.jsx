import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/C_EditAccount.css";

const EditAccount = () => {
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Retrieve token
        const response = await http.get("api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data;
        setFormData({
          username: userData.username || "",
          phoneNumber: userData.phoneNumber || "",
        });
      } catch (error) {
        console.error(error);
        setMessage("Error fetching user data. Please try again later.");
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username.length < 3) {
      setMessage("Username must be at least 3 characters long.");
      return;
    }
    if (!/^\d{8}$/.test(formData.phoneNumber)) {
      setMessage("Phone number must be exactly 8 digits.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken"); // Retrieve token
      await http.put("api/user/update-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Account information updated successfully! Redirecting you back to view profile...");
      setTimeout(() => {
        navigate("/accountinfo");
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to update account information. Please try again.");
    }
  };

  return (
    <div className="edit-account-container">
      <h2>Edit Account Information</h2>
      {message && <p className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</p>}
      <form onSubmit={handleSubmit} className="edit-account-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">Save Changes</button>
      </form>
    </div>
  );
};

export default EditAccount;
