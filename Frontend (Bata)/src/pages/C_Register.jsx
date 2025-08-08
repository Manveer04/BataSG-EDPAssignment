import React, { useState } from "react";
import http from "../http";
import { useNavigate } from "react-router-dom";
import "../css/C_Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
    role: "customer",
  });

  const [error, setError] = useState(""); // Single error message
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // *Validation function*
  const validateForm = (data) => {
    if (data.username.length < 3) return "Username must be at least 3 characters.";
    if (data.password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(data.password)) return "Password must include an uppercase letter.";
    if (!/[0-9]/.test(data.password)) return "Password must include a number.";
    if (data.password !== data.confirmPassword) return "Passwords do not match.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email format.";
    if (!/^\d{8}$/.test(data.phoneNumber)) return "Phone number must be exactly 8 digits.";
    return ""; // No errors
  };

  // *Handle input changes & validate live*
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Apply restrictions before updating state
    if (name === "username" && /[^a-zA-Z0-9]/.test(value)) return; // Prevent special characters
    if (name === "phoneNumber" && /[^0-9]/.test(value)) return; // Allow only numbers

    // Update the form data and error dynamically
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData, [name]: value };
      setError(validateForm(updatedFormData)); // Validate with updated state
      return updatedFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the current form data
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(""); // Clear any existing errors
    try {
      await http.post("/api/user/register", formData);
      setSuccess("Registration successful!");
      alert("Registration successful! Redirecting to login...");

      // Reset form data
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        phoneNumber: "",
        role: "customer",
      });

      setTimeout(() => navigate("/login"), 500);
    } catch (error) {
      setError(error.response?.data || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Register</h2>
      {error && <p className="error-message">{error}</p>} {/* Single error message */}
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          className="register-input"
          type="text"
          name="username"
          placeholder="Username (No special characters)"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          className="register-input"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          className="register-input"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <input
          className="register-input"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          className="register-input"
          type="text"
          name="phoneNumber"
          placeholder="Phone number (8 digits only)"
          maxLength="8"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
        <button className="register-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </button>
        {success && <p className="success-message">{success}</p>}
      </form>

      <p className="login-text">
        Have an account? <span onClick={() => navigate("/login")} className="login-link">Click here to Login</span>
      </p>
    </div>
  );
};

export default Register;