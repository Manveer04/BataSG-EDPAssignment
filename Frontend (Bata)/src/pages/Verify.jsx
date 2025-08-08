import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http"; // Your custom http instance
import "../css/Verify.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
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

  const handleOtpChange = (e) => {
    // Only allow numbers and limit the length to 6 characters
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only digits allowed
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage("OTP must be exactly 6 digits.");
      return;
    }

    try {
      const token = localStorage.getItem("access"); // Retrieve token
      const response = await http.post(
        "/api/user/verify-otp", // Adjust the API path
        { otp },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message === "OTP verification successful.") {
        setMessage("OTP Verified Successfully ✅");
        localStorage.setItem("accessToken", token);
        localStorage.removeItem("access");
        createCartIfNotExists();
        setTimeout(() => navigate("/accountinfo"), 500);
    } else {
        setMessage(response.data.message);
    }
  } catch (error) {
      const errorMsg = error.response?.data || "An error occurred. Please try again.";
      if (errorMsg.includes("Too many failed attempts")) {
          setMessage("Too many failed attempts. Try again in 1 minute.");
      } else {
          setMessage(errorMsg);
      }
  }
  };

  return (
    <div className="otp-container">
      <h2>Verify OTP</h2>
      <input
        type="text"
        value={otp}
        onChange={handleOtpChange}
        placeholder="Enter OTP"
        maxLength="6"
        className="otp-input"
      />
      <button onClick={verifyOtp} className="otp-button">Verify</button>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default VerifyOtp;
