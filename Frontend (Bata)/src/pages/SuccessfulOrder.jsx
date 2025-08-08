import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Loading.css';

const SuccessfulOrder = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve the orderId from the state passed to this page
    const { orderId } = location.state || {}; // Default to an empty object if no state is passed

    useEffect(() => {
        // Set a timeout of 5 seconds (5000ms)
        const timer = setTimeout(() => {
            // Navigate to the '/successfulorder' route after 5 seconds
            navigate('/ordersummary', {
                state: { orderId } // Pass orderId to the next page
            });
        }, 2000);

        // Clear the timer if the component is unmounted before 5 seconds
        return () => clearTimeout(timer);
    }, [navigate, orderId]);  // Dependency array ensures the effect runs once when the component mounts

    return (
        <div style={{ textAlign: 'center' }} className="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="210" height="210" fill="#34db47" class="bi bi-check-circle" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#34db47"/>
            <path fill="white" d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
        </svg>
            <h1 style={{ marginTop: "30px", color: "#414B56" }}>Your Order was Successful!</h1>
        </div>
        
    );
};

export default SuccessfulOrder;