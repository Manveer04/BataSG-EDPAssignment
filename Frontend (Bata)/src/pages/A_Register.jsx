import React, { useState } from "react";
import http from "../http"; // Import your custom HTTP instance
import "../css/C_Register.css";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Frontend Validation
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must include at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError("Password must include at least one number.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format.");
      return;
    }
    if (!/^\d{8}$/.test(formData.phoneNumber)) {
      setError("Phone number must be exactly 8 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      await http.post("/api/admin/register", { // Admin registration endpoint
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: "Admin", // Fixed role for admin users
      });

      setSuccess("Admin registered successfully!");
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        phoneNumber: "",
      });
    } catch (error) {
      setError(
        error.response ? error.response.data : "An error occurred while registering."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Admin Registration</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          className="register-input"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
        />
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          className="register-input"
          type="text"
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData({ ...formData, phoneNumber: e.target.value })
          }
        />
        <button className="register-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default AdminRegister;
