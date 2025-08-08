import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/C_AddAddress.css";

const AddAddress = () => {
  const [formData, setFormData] = useState({
    name: "house",
    unitNo: "15-40",
    street: "Yes",
    postalCode: "123456",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, unitNo, street, postalCode } = formData;

    // Input validation
    if (!/^[a-zA-Z0-9\s]+$/.test(name) || name.length > 50) {
      setError("Name must be alphanumeric and up to 50 characters.");
      setSuccess("");
      return;
    }
    if (!/^[a-zA-Z0-9\s`-]+$/.test(unitNo) || unitNo.length > 10) {
      setError("Unit number must be alphanumeric and up to 10 characters.");
      setSuccess("");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(street) || street.length > 100) {
      setError("Street must be alphanumeric and up to 100 characters.");
      setSuccess("");
      return;
    }
    if (!/^\d{6}$/.test(postalCode)) {
      setError("Postal code must be exactly 6 digits.");
      setSuccess("");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await http.post(
        "api/user/addresses",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(response.data.message || "Address added successfully!");
      setError("");
      setTimeout(() => navigate("/view-address"), 500);
    } catch (error) {
      console.error(error);
      setError("Failed to add address.");
      setSuccess("");
    }
  };

  return (
    <div className="add-address-container">
      <h2 className="add-address-title">Add New Address</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="add-address-form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="unitNo">Unit No:</label>
          <input
            type="text"
            name="unitNo"
            value={formData.unitNo}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="street">Street:</label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="postalCode">Postal Code:</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">Add Address</button>
      </form>
    </div>
  );
};

export default AddAddress;
