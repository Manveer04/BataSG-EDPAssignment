import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http";
import "../css/C_Enable2FA.css";

const Enable2FA = () => {
  const [qrCode, setQrCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [successMessage, setSuccess] = useState("");
  const [errorMessage, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await http.post("api/user/enable-2fa", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.qrCodeImage) {
          setQrCode(response.data.qrCodeImage);
        } else {
          setError("Failed to retrieve QR code.");
        }
      } catch (error) {
        console.error(error);
        setError("Failed to enable 2FA. Please try again.");
      }
    };

    fetchQrCode();
  }, []);

  const handleVerify2FA = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await http.post(
        "api/user/verify-2fa",
        { code: otpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.message) {
        setSuccess("Two-factor authentication enabled successfully!");
        setError(""); // Clear error
        setTimeout(() => navigate("/accountinfo"), 1000);
      }
    } catch (error) {
      console.error(error);
      setError("Invalid OTP. Please try again.");
      setSuccess(""); // Clear success message
    }
  };

  return (
    <div className="enable-2fa-container">
      <h2>Enable Two-Factor Authentication (2FA)</h2>
      
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="qr-code-section">
        {qrCode ? (
          <>
            <img src={qrCode} alt="QR Code for Google Authenticator" className="qr-code-image" />
            <p>Scan the QR code above using Google Authenticator.</p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter OTP from Google Authenticator"
            />
            <button className="verify-2fa-button" onClick={handleVerify2FA}>
              Verify & Enable 2FA
            </button>
          </>
        ) : (
          <p>Loading QR code...</p>
        )}
      </div>
    </div>
  );
};

export default Enable2FA;
