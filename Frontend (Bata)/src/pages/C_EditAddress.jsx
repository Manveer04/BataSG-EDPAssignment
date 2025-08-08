import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import "../css/C_EditAddress.css"; // Import the CSS file

const EditAddress = () => {
  const { id } = useParams(); // Get the address ID from the URL
  const [address, setAddress] = useState({
    name: "",
    unitNo: "",
    street: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await http.get(`api/user/addresses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddress(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch address details.");
      }
    };

    fetchAddress();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { name, unitNo, street, postalCode } = address;

    if (!/^[a-zA-Z0-9\s]+$/.test(name) || name.length > 50) {
      setError("Name must be alphanumeric and up to 50 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9\s`-]+$/.test(unitNo) || unitNo.length > 10) {
      setError("Unit number must be alphanumeric and up to 10 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(street) || street.length > 100) {
      setError("Street must be alphanumeric and up to 100 characters.");
      return;
    }
    if (!/^\d{6}$/.test(postalCode)) {
      setError("Postal code must be exactly 6 digits.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      await http.put(`api/user/addresses/${id}`, address, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess("Address updated successfully.");
      setError(null);
      setTimeout(() => navigate("/view-address"), 1500); // Redirect after success
    } catch (err) {
      console.error(err);
      setError("Failed to update address. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate("/view-address"); // Navigate back to the View Addresses page
  };

  return (
    <div className="edit-address-container">
      <h2>Edit Address</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form className="edit-address-form" onSubmit={handleFormSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={address.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="unitNo">Unit Number</label>
          <input
            type="text"
            id="unitNo"
            name="unitNo"
            value={address.unitNo}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="street">Street</label>
          <input
            type="text"
            id="street"
            name="street"
            value={address.street}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="postalCode">Postal Code</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={address.postalCode}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="save-button">
            Save
          </button>
          <button type="button" className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAddress;
