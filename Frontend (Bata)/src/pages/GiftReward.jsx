import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Box, Typography, Button, Card, Grid, TextField } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function GiftReward() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: contextUser, setUser } = useContext(UserContext);
  const [user, setLocalUser] = useState(contextUser); // Local state for reactivity
  const [reward, setReward] = useState(null);
  const [recipientUsername, setRecipientUsername] = useState(""); // State for recipient username

  useEffect(() => {
    http
      .get(`/reward/${id}`)
      .then((res) => setReward(res.data))
      .catch((err) => console.error("Failed to fetch reward:", err));
  }, [id]);

  const handleConfirmGift = () => {
    if (!recipientUsername) {
      toast.error("Please enter a username to gift the reward to.", { position: "top-right" });
      return;
    }
  
    // Check if the recipient username exists
    http
      .get(`/redeemedreward/check-username/${recipientUsername}`)
      .then((res) => {
        // Now we're sure we are getting the recipient's customer ID from the response
        const recipientCustomerId = res.data.customerId;
  
        if (!recipientCustomerId) {
          toast.error("Recipient username not found.", { position: "top-right" });
          return;
        }
  
        // Check if the current user has enough points to gift the reward
        const updatedPoints = user.points - reward.pointsNeeded;
        if (updatedPoints < 0) {
          toast.error("Insufficient points to gift this reward.", { position: "top-right" });
          return;
        }
  
        // Update the points of the user who is gifting the reward
        http
          .put(`/api/user/update`, {
            Id: user.id,
            Name: user.name,
            Email: user.email,
            Points: updatedPoints,
            Tier: user.tier,
          })
          .then(() => {
            setUser((prev) => ({ ...prev, points: updatedPoints }));
            setLocalUser((prev) => ({ ...prev, points: updatedPoints }));
            localStorage.setItem("userPoints", updatedPoints);
  
            // Prepare payload for the redeemed reward
            const payload = {
              Name: reward.name,
              Description: reward.description,
              PointsUsed: reward.pointsNeeded,
              ImageFile: reward.imageFile,
              RedeemedAt: new Date().toISOString(),
              CustomerId: recipientCustomerId, // Correct customer ID for the recipient
              OriginalCustomerId: user.id,    // Sender's ID
              IsGifted: true
            };
  
            // Post the redeemed reward data to the backend
            return http.post(`/redeemedreward`, payload);
          })
          .then(() => {
            toast.success("Reward gifted successfully!", { position: "top-right" });
            setTimeout(() => navigate("/userrewards"), 3000);
          })
          .catch((err) => {
            console.error("Failed to gift reward:", err);
            toast.error(err.response?.data || "An error occurred while gifting the reward.", {
              position: "top-right",
            });
          });
      })
      .catch((err) => {
        console.error("Failed to check username:", err);
        toast.error("Username doesn't exist.", { position: "top-right" });
      });
  };  

  const handleCancel = () => {
    navigate("/userrewards");
  };

  if (!reward) return <Typography>Loading...</Typography>;

  return (
    <Box
      sx={{
        marginTop: "100px",
        marginBottom: "50px",
        justifyContent: "center",
        padding: "0",
        marginLeft: "15%",
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, pt: 3 }}>
        Gift Reward
      </Typography>

      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button variant="outlined" component={Link} to="/userrewards">
          Back to Rewards
        </Button>
      </Grid>

      <Card sx={{ padding: 3 }}>
        {reward.imageFile ? (
          <Box sx={{ aspectRatio: "16/9", overflow: "hidden", mb: 2 }}>
            <img
              alt="reward"
              src={`${import.meta.env.VITE_FILE_BASE_URL}${reward.imageFile}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
              border: "2px dashed #ccc",
              borderRadius: 1,
              backgroundColor: "#f5f5f5",
              mb: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Image
            </Typography>
          </Box>
        )}

        <Typography variant="h4">{reward.name}</Typography>
        <Typography variant="body1">
          <strong>Description:</strong> {reward.description}
        </Typography>
        <Typography variant="body1">
          <strong>Points Needed:</strong> {reward.pointsNeeded}
        </Typography>
        <Typography variant="body1">
          <strong>Tier Required:</strong> {reward.tierRequired}
        </Typography>
      </Card>

      <TextField
        label="Username to Gift To"
        variant="outlined"
        fullWidth
        value={recipientUsername}
        onChange={(e) => setRecipientUsername(e.target.value)}
        sx={{ mt: 2 }}
      />

      <Grid container justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={handleCancel} sx={{ mr: 2 }}>
          Cancel
        </Button>
        <Button variant="contained" color="success" onClick={handleConfirmGift}>
          Confirm Gift
        </Button>
      </Grid>

      <ToastContainer />
    </Box>
  );
}

export default GiftReward;
