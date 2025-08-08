import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../contexts/UserContext";
import http from "../http"; // Import your custom HTTP instance
import "../css/AccountInfo.css";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

const AccountInfo = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    points: "",
    tier: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

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
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          points: userData.points !== undefined ? userData.points : "",
          tier: userData.tier !== undefined ? userData.tier : "",
          address: userData.address || "",
        });

        setIs2FAEnabled(userData.is2FAEnabled || false); // Track 2FA status

        setMessage(""); // Clear any previous error messages
      } catch (error) {
        console.error(error);
        setMessage("Error fetching user data. Please try again later.");
      }
    };

    fetchUserData();
  }, []);

  const handleEnable2FA = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await http.post("api/user/enable-2fa", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response); // Log the whole response object

      if (response.data && response.data.qrCodeImage) {
        setQrCode(response.data.qrCodeImage); // Make sure QR code image is in the response
      } else {
        console.error("QR code not found in the response.");
        setMessage("Failed to get QR code.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to enable 2FA. Please try again.");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await http.post(
        "api/user/verify-2fa",
        { code: otpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIs2FAEnabled(true);
      setMessage(response.data.Message || "Two-factor authentication enabled successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Invalid OTP. Please try again.");
    }
  };

  const handleEditClick = () => {
    navigate("/edit-account");
  };

  const handleViewAddressesClick = () => {
    navigate("/view-address");
  };
  const handleAddAddressesClick = () => {
    navigate("/add-address");
  };
  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== "CONFIRM") {
      setMessage("You must type 'CONFIRM' to delete your account.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await http.delete("api/user/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error(error);
      setMessage("Failed to delete account. Please try again later.");
    }
  };

  const handleEnable2FARedirect = () => {
    navigate("/enable-2fa");
  };
  const handleDisable2FA = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await http.post(
        "api/user/disable-2fa",
        { code: otpCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIs2FAEnabled(false); // Update UI
      setMessage(response.data.Message || "Two-factor authentication disabled.");
      setShowDisableModal(false);
      setOtpCode(""); // Clear input
    } catch (error) {
      console.error(error);
      setMessage("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="account-info-container">
      <CustomerSidebar /> {/* Sidebar for customer account pages */}
      <h2>Account Information</h2>
      {message && <p className="error-message">{message}</p>}
      <div className="account-info-card">
        <div className="info-section">
          <div className="info-field">
            <label>Username:</label>
            <p>{formData.username || "Not provided"}</p>
          </div>
          <div className="info-field">
            <label>Email:</label>
            <p>{formData.email || "Not provided"}</p>
          </div>
          <div className="info-field">
            <label>Phone Number:</label>
            <p>{formData.phoneNumber || "Not set"}</p>
          </div>
          <div className="info-field">
            <label>Points:</label>
            <p>{formData.points !== "" ? formData.points : "Not set"}</p>
          </div>
          <div className="info-field">
            <label>Tier:</label>
            <p>{formData.tier !== "" ? formData.tier : "Not set"}</p>
          </div>
          <div className="info-field">
            <label>Address:</label>
            {formData.address === "View Addresses" ? (
              <button
                className="view-address-button"
                onClick={handleViewAddressesClick}
              >
                View Addresses
              </button>
            ) : (
              <button
                className="add-address-button"
                onClick={handleAddAddressesClick}
              >
                Add Address
              </button>
            )}
          </div>
          <div className="info-field">
            <label>Two-Factor Authentication (2FA):</label>
            {is2FAEnabled ? (
              <p
              className="twofa-status"
              style={{ cursor: "pointer", fontSize: "1.2rem" }}
              onClick={() => setShowDisableModal(true)}
            >
              ✅
            </p>
            ) : (
              <p className="twofa-status">
                <button className="enable-2fa-button" style={{height: "30px", cursor: "pointer", fontWeight: "600" }} onClick={handleEnable2FARedirect}>
                  Click here to enable 2FA
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="buttons-container">
        <button className="edit-button" onClick={handleEditClick}>
          Edit Information
        </button>
        <button className="delete-button" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete your account?</h3>
            <p>
              Please type <strong>CONFIRM</strong> below to proceed.
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type CONFIRM"
            />
            <button className="confirm-button" onClick={handleDeleteAccount}>
              Confirm
            </button>
            <button className="cancel-button" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    {showDisableModal && (
        <>
          {/* Background Dim Effect */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay
              zIndex: 999, // Behind the modal
            }}
            onClick={() => setShowDisableModal(false)} // Clicking outside closes modal
          ></div>
          {/* Disable 2FA Modal */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
              zIndex: 1000,
              textAlign: "center",
              width: "400px", // Bigger width
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Disable 2FA</h2>
            <p>Enter the 6-digit OTP code to confirm:</p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter OTP"
              maxLength="6"
              style={{
                padding: "10px",
                width: "90%",
                marginBottom: "15px",
                textAlign: "center",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
            <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={() => setShowDisableModal(false)}
                style={{
                  padding: "10px 15px",
                  background: "#5bc0de",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                style={{
                  padding: "10px 15px",
                  background: "#d9534f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountInfo;
