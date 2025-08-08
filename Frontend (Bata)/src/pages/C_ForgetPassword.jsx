import React, { useState } from "react";
import http from "../http";
import emailjs from '@emailjs/browser';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setMessage("Please enter your email.");
            return;
        }
        try {
            setIsButtonDisabled(true);
            const response = await http.post("/api/user/forgot-password", { email });
            setMessage(response.data.message);
            console.log(response.data);
            handleForgetPassword(response.data);
        } catch (error) {
            setMessage("Error: " + (error.response?.data?.message || "Please try again."));
        }
        // Re-enable button after 30 seconds
        setTimeout(() => setIsButtonDisabled(false), 30000);
    };

    const handleForgetPassword = (password) => {
        const templateParams = {
            reply_to: password.email,
            resetlink: password.resetLink,
        };

        emailjs.send('service_l382v13', 'template_iupncdh', templateParams, 'OGwI4NsyrhcxVEpgC')
            .then((result) => {
                console.log('Email successfully sent!', result.status, result.text);
                setMessage("Link has been successfully sent to your email")
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
                console.log('Email already sent. Skipping.');
            });
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Forgot Password</h2>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
            />
            <button 
                onClick={handleForgotPassword} 
                style={{
                    ...styles.button,
                    backgroundColor: isButtonDisabled ? "#a5d6a7" : "#4CAF50",
                    cursor: isButtonDisabled ? "not-allowed" : "pointer",
                }}
                disabled={isButtonDisabled}
            >
                {isButtonDisabled ? "Please wait" : "Send Reset Link"}
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
        width: "100vw",
        backgroundColor: "#f4f4f4",
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
        width: "325px",
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
export default ForgotPassword;