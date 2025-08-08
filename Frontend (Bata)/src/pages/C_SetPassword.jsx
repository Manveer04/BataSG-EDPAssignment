import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../contexts/UserContext";
import http from "../http"; // Import your custom http instance
import "../css/C_SetPassword.css";

const SetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        const email = localStorage.getItem("email");
        const username = localStorage.getItem("username");
        if (!email || !username) {
            navigate("/login");
        }
    }, [navigate]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setError("Password must include at least one uppercase letter.");
            return;
        }
        if (!/[0-9]/.test(password)) {
            setError("Password must include at least one number.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const email = localStorage.getItem("email");
        const username = localStorage.getItem("username");

        try {
            // Use the custom http instance here
            const response = await http.post("/api/user/set-password", {
                email,
                username,
                password,
            });
            const data = response.data;
            setUser(data.user);
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.removeItem("email");
            localStorage.removeItem("username");
            createCartIfNotExists();


            navigate("/accountinfo");
        } catch (error) {
            setError("Failed to set password. Please try again.");
        }
    };

    return (
        <div className="set-password-container">
            <h2 className="set-password-title">Set Your Password</h2>
            <form className="set-password-form" onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div>
                    <label>Password</label>
                    <input
                        className="set-password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirm Password</label>
                    <input
                        className="set-password-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="set-password-button" type="submit">Set Password</button>
            </form>
        </div>
    );
};

export default SetPassword;
