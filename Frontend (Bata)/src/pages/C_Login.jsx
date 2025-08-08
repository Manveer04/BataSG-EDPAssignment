import React, { useState, useEffect, useContext } from "react";
import { Typography, TextField, Button } from "@mui/material";
import http from '../http';
import { useNavigate } from "react-router-dom";
import UserContext from "../contexts/UserContext";
import axios from "axios";
import "../css/C_Login.css"; // Import the CSS file

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  const createCartIfNotExists = () => {
    http.get('/cart', {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
        .then(() => {
            console.log("Cart already exists.");
        })
        .catch((err) => {
            if (err.response?.status === 404) {
                // If the cart doesn't exist, create it
                http.post('/cart', {}, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                })
                    .then(() => {
                        console.log("Cart created successfully.");
                    })
                    .catch((error) => {
                        console.error("Error creating cart:", error);
                    });
            } else {
                console.error("Error checking cart existence:", err);
            }
        });
  };

  const handleGoogleLogin = async (response) => {
    const tokenId = response.credential;
    try {
      const googleLoginResponse = await http.post(
        "api/user/google-login",
        { tokenId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = googleLoginResponse.data;
      if (data.message === "User does not exist, please set a password.") {
        localStorage.setItem("email", data.email);
        localStorage.setItem("username", data.username);
        localStorage.setItem("accessToken", data.accessToken);
        createCartIfNotExists();
        setSuccess("Account does not exist. Please set a password.");
        setTimeout(() => navigate("/set-password"), 500);
      } else {
        createCartIfNotExists();
        setError("")
        setSuccess("Google login successful!");
        setUser(data.user); // Update user state
        console.log(data)
        if (data.user.is2FAEnabled) {
          localStorage.setItem("access", data.accessToken);
          setTimeout(() => navigate("/verify"), 500); // Redirect to authenticator page
        } else {
          localStorage.setItem("accessToken", data.accessToken);
          setTimeout(() => navigate("/accountinfo"), 500); // Redirect to normal account page
        }
      }
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
      const response = await http.post("api/user/login", formData);
      const data = response.data;
      setUser(data.user.user);
      console.log(data.user)
      createCartIfNotExists();
      setSuccess("Login successful!");
      setFormData({ email: "", password: "" });
      if (data.user.user.is2FAEnabled) {
        localStorage.setItem("access", data.accessToken);
        setTimeout(() => navigate("/verify"), 500); // Redirect to authenticator page
      } else {
        localStorage.setItem("accessToken", data.accessToken);
        setTimeout(() => navigate("/accountinfo"), 500); // Redirect to normal account page
      }
    } catch (error) {
      setError(
        error.response
          ? error.response.data
          : "An error occurred while logging in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
  <h2 className="login-title">Login</h2>
  <form className="login-form" onSubmit={handleSubmit}>
    <input
      className="login-input"
      type="text"
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
        <p className="forgot-password">
      <span onClick={() => navigate("/forget-password")} className="forgot-password-link">
        Forgot Password?
      </span>
    </p>
    <button className="login-button" type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Logging in..." : "Login"}
    </button>
  </form>
  {error && <p className="error-message">{error}</p>} {/* Display error */}
  {success && <p className="success-message">{success}</p>} {/* Display success */}


      <div id="google-signin-button" className="google-signin-button"></div>
      <p className="register-text">
        Don’t have an account? <span onClick={() => navigate("/register")} className="register-link">Click here to register</span>
      </p>
    </div>
  );
};

export default Login;
