import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Import your custom http instance
import UserContext from "../contexts/UserContext";
import "../css/C_Login.css"; // Import the CSS file

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleGoogleLogin = async (response) => {
    const tokenId = response.credential;
    try {
      const googleLoginResponse = await http.post(
        "/api/admin/google-login", // Admin Google login endpoint
        { tokenId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = googleLoginResponse.data;
      localStorage.setItem("accessToken", data.accessToken);
      setSuccess("Google login successful!");
      setUser(data.admin);
      console.log(data);
      setTimeout(() => navigate("/admin-accountinfo"), 500); // Navigate to admin dashboard
    } catch (error) {
      setError(
        error.response
          ? error.response.data
          : "An error occurred while logging in with Google."
      );
    }
  };

  useEffect(() => {
    const initGoogleLogin = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "650767967689-oejlte3dm8qr1ntq9hb7f1geic32qpgt.apps.googleusercontent.com",
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large" }
        );
      }
    };

    const script = document.querySelector(
      "script[src='https://accounts.google.com/gsi/client']"
    );
    if (!script) {
      const newScript = document.createElement("script");
      newScript.src = "https://accounts.google.com/gsi/client";
      newScript.async = true;
      newScript.defer = true;
      newScript.onload = initGoogleLogin;
      document.body.appendChild(newScript);
    } else {
      initGoogleLogin();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format.");
      return;
    }
    if (!formData.password) {
      setError("Password is required.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await http.post("/api/admin/login", formData); // Admin login endpoint
      const data = response.data;
      localStorage.setItem("accessToken", data.accessToken);
      setSuccess("Login successful!");
      setUser(data.admin);
      console.log(data);
      setFormData({ email: "", password: "" });
      setTimeout(() => navigate("/admin-accountinfo"), 500); // Navigate to admin dashboard
    } catch (error) {
      setError(
        error.response ? error.response.data : "An error occurred while logging in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Admin Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button className="login-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div id="google-signin-button" className="google-signin-button"></div>
    </div>
  );
};

export default AdminLogin;
