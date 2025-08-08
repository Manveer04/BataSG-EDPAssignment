import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import http from "../http";
const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // Ensure token is properly formatted
    const token = decodeURIComponent(searchParams.get("token")).replace(/ /g, "+");
    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }
        try {
            setIsButtonDisabled(true);
            const response = await http.post("/api/user/reset-password", { token, password });
            setMessage(response.data.message + " Redirecting you to login...");
            // Redirect after 2 seconds
            setTimeout(() => navigate("/login"), 2000);
        } catch (error) {
            setMessage("Error: " + (error.response?.data?.message || "Please try again."));
            setIsButtonDisabled(false);
        }
    };
    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Reset Password</h2>
            <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
            />
            <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
            />
            <button 
                onClick={handleResetPassword} 
                style={{
                    ...styles.button,
                    backgroundColor: isButtonDisabled ? "#a5d6a7" : "#4CAF50",
                    cursor: isButtonDisabled ? "not-allowed" : "pointer",
                }}
                disabled={isButtonDisabled}
            >
                {isButtonDisabled ? "Processing..." : "Reset Password"}
            </button>
            {message && <p style={{ ...styles.message, color: message.includes("Error") ? "red" : "green" }}>{message}</p>}
        </div>
    );
};
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "99vw",
        backgroundColor: "#f4f4f4",
        padding: "20px",
    },
    heading: {
        fontSize: "24px",
        marginBottom: "20px",
    },
    input: {
        width: "300px",
        padding: "12px",
        margin: "10px 0",
        border: "1px solid #ccc",
        borderRadius: "5px",
        fontSize: "16px",
    },
    button: {
        padding: "12px",
        border: "none",
        borderRadius: "5px",
        fontSize: "16px",
        fontWeight: "bold",
        color: "white",
        transition: "background-color 0.3s ease",
    },
    message: {
        marginTop: "10px",
        fontSize: "14px",
    },
};
export default ResetPassword;