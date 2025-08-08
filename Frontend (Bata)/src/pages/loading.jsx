import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Loading.css';

const Loading = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve the orderId from the state passed to this page
    const { orderId } = location.state || {}; // Default to an empty object if no state is passed

    useEffect(() => {
        // Set a timeout of 3 seconds (3000ms)
        const timer = setTimeout(() => {
            // Navigate to the '/successfulorder' route after 3 seconds and pass the orderId to the next page
            navigate('/successfulorder', {
                state: { orderId } // Pass orderId to the next page
            });
        }, 3000);

        // Clear the timer if the component is unmounted before the timeout
        return () => clearTimeout(timer);
    }, [navigate, orderId]);  // Only re-run if orderId or navigate change

    return (
        <div style={{ textAlign: 'center' }} className="loading">
            <div className="loader"></div>
            <h1 style={{ marginTop: "30px", color: "#414B56" }}>Processing Your Order...</h1>
        </div>
    );
};

export default Loading;
