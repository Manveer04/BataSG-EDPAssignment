import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import HelpOutline from "@mui/icons-material/HelpOutline";
import { styled, keyframes } from "@mui/system";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import http from "../http";

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const WheelContainer = styled(Box)`
  position: relative;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WheelContent = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: conic-gradient(${({ colorSegments }) => colorSegments});
  border-radius: 50%;
  transition: transform 5s ease-out;
`;

const Pointer = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 40px solid #000;
  transform: translate(-50%, -50%) rotate(0deg);
  z-index: 2;
`;

const colors = [
  "red",
  "blue",
  "yellow",
  "red",
  "blue",
  "yellow",
  "red",
  "blue",
  "yellow",
  "red",
  "blue",
  "green",
];

const points = [50, 100, 200, 50, 100, 200, 50, 100, 200, 50, 100, 500];

const RewardGame = () => {
  const [spinning, setSpinning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [userData, setUserData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [pointsNeeded, setPointsNeeded] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [spinMessage, setSpinMessage] = useState("");
  const navigate = useNavigate();

  const calculateTier = (points) => {
    if (points <= 3000) return "Bronze";
    if (points <= 5000) return "Silver";
    return "Gold";
  };

  const updateUserPoints = async (newPoints) => {
    try {
      const token = localStorage.getItem("token");
      const requestPayload = { points: newPoints };

      const response = await http.put("api/user/update", requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const data = response.data;
        console.log("Points updated successfully:", data);
        setSuccessMessage("Points updated successfully!");
      } else {
        throw new Error(`Failed to update points. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating points:", error);
      setSuccessMessage("Error updating points.");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await http.get("api/user/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.user.user;

        setUserData(data);

        const points = data.points;

        let progressPercent = 0;

        if (points <= 3000) {
          progressPercent = (points / 3000) * 100;
        } else if (points <= 5000) {
          progressPercent = ((points - 3000) / 2000) * 100;
        } else {
          progressPercent = 100;
        }

        setProgress(progressPercent);

        let pointsNeeded = 0;
        if (points <= 3000) {
          pointsNeeded = 3001 - points;
        } else if (points <= 5000) {
          pointsNeeded = 5001 - points;
        } else {
          pointsNeeded = 0;
        }

        setPointsNeeded(pointsNeeded);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSpinResult = (result) => {
    setGameResult(result);
    setSpinning(false);

    if (userData) {
      const newPoints = userData.points + result;
      setUserData((prevData) => ({
        ...prevData,
        points: newPoints,
        tier: calculateTier(newPoints),
      }));
      updateUserPoints(newPoints);
      setConfetti(true);
    }
  };

  const handleHelpOpen = () => setHelpOpen(true);
  const handleHelpClose = () => setHelpOpen(false);

  const handleSpin = () => {
    if (spinning) return;
  
    const today = new Date().toDateString();
    const spinData = JSON.parse(localStorage.getItem("spinData")) || { date: today, count: 0 };
  
    if (spinData.date !== today) {
      // Reset count for a new day
      spinData.date = today;
      spinData.count = 0;
    }
  
    if (spinData.count >= 3) {
      setSpinMessage("You have reached the maximum spin limit for today. Come back tomorrow!");
      return;
    }
  
    // Increment spin count and save to localStorage
    spinData.count += 1;
    localStorage.setItem("spinData", JSON.stringify(spinData));
  
    setSpinMessage(`You have ${3 - spinData.count} spin(s) left today.`); // Show remaining spins
  
    setSpinning(true);
    setGameResult(null);
  
    const additionalRotation = Math.floor(Math.random() * 360);
    const totalRotation = rotation + additionalRotation + 360 * 5;
  
    const segmentAngle = 360 / colors.length;
    const preciseRotation = totalRotation % 360;
    const winningIndex = Math.floor((preciseRotation + segmentAngle / 2) / segmentAngle) % colors.length;
  
    setRotation(totalRotation);
  
    setTimeout(() => {
      const selectedPoints = points[winningIndex];
  
      console.log(`Final Rotation: ${preciseRotation}`);
      console.log(`Winning Index: ${winningIndex}, Color: ${colors[winningIndex]}, Points: ${selectedPoints}`);
  
      handleSpinResult(selectedPoints);
    }, 5000);
  };

  const colorSegments = colors
    .map(
      (color, i) =>
        `${color} ${i * (360 / colors.length)}deg ${
          (i + 1) * (360 / colors.length)
        }deg`
    )
    .join(", ");

  return (
    <Box
      sx={{
        marginLeft: "20%",
        marginTop: "7%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: 2,
        mb: 4
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate("/userrewards")}
        >
          Back to Rewards
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          onClick={handleHelpOpen}
          color="inherit"
          sx={{ marginLeft: 2 }}
        >
          <HelpOutline />
        </IconButton>
      </Box>

      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          marginTop: 2,
          marginBottom: 4,
        }}
      >
        Spin the Wheel
      </Typography>

      <Box
        sx={{
          textAlign: "center",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          transition: "background-color 0.3s, box-shadow 0.3s",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 1)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <Typography variant="body1">Available Points:</Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", fontSize: "4.5rem" }}
        >
          {userData ? userData.points : 0}
        </Typography>
      </Box>

      {confetti && <Confetti />}

      <Dialog open={helpOpen} onClose={handleHelpClose}>
        <DialogTitle>How to Play</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Instructions:
          </Typography>
          <ol>
            <li>Click the "Spin" button to start the game.</li>
            <li>The wheel will spin for a few seconds and then stop.</li>
            <li>
              After the wheel stops, you will see the result of your spin.
            </li>
            <li>Your points will be updated based on the wheel's result.</li>
          </ol>
          <Typography variant="body1" sx={{ fontWeight: "bold", mt: 2 }}>
            Points System:
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHelpClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ minWidth: 350, marginTop: "16px" }}>
        <WheelContainer>
          <WheelContent
            colorSegments={colorSegments}
            sx={{ transform: `rotate(${rotation}deg)` }}
          />
          <Pointer />
        </WheelContainer>
        <Button
          variant="contained"
          sx={{ marginTop: "16px", backgroundColor: "#007bff", color: "white"}}
          onClick={handleSpin}
        >
          Spin
        </Button>
      </Box>

      {spinMessage && (
  <Typography variant="body2" sx={{ color: spinMessage.includes("maximum") ? "red" : "green", marginTop: 2 }}>
    {spinMessage}
  </Typography>
)}

      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold", mt: 2 }}>
          Points System:
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
          {[
            { color: "green", points: 500 },
            { color: "yellow", points: 200 },
            { color: "blue", points: 100 },
            { color: "red", points: 50 },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="body2">{item.points} points</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {gameResult && !spinning && (
        <Box sx={{ textAlign: "center", marginTop: "16px" }}>
          <Typography variant="h6">You won {gameResult} points!</Typography>
        </Box>
      )}

      {successMessage && (
        <Typography variant="body2" sx={{ color: "green", marginTop: 2 }}>
          {successMessage}
        </Typography>
      )}
    </Box>
  );
};

export default RewardGame;
