import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import http from "../http";
import UserContext from "../contexts/UserContext";
import Confetti from "react-confetti";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

const UserRewards = () => {
  const { user: contextUser } = useContext(UserContext);
  const [user, setUser] = useState(contextUser);
  const [eligibleRewards, setEligibleRewards] = useState([]);
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [progress, setProgress] = useState(0);
  const [pointsNeeded, setPointsNeeded] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const navigate = useNavigate();

  const handleGiftClick = (rewardId) => {
    navigate(`/giftreward/${rewardId}`);
  };

  const handleClick = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000); // Confetti lasts for 3 seconds
  };

  // Tier emoji for progress bar
  const tierTrophies = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleOpenDialog = (reward) => {
    setSelectedReward(reward); // Set the selected reward when button is clicked
    setOpen(true); // Open the dialog
  };

  const handleClose = () => {
    setOpen(false); // Close the dialog
    setSelectedReward(null); // Reset selected reward
  };

  const handleTierDialogOpen = () => {
    setTierDialogOpen(true);
  };

  const handleTierDialogClose = () => {
    setTierDialogOpen(false);
  };

  const handlePurchaseReward = async () => {
    if (!selectedReward) return;
    try {
      const pointsNeeded = Number(selectedReward.pointsNeeded);
      const currentPoints = Number(user.points);

      if (isNaN(currentPoints) || isNaN(pointsNeeded)) {
        throw new Error("Invalid points data: Points must be numeric.");
      }

      const updatedPoints = currentPoints - pointsNeeded;

      if (updatedPoints < 0) {
        toast.error("Insufficient points to redeem this reward.");
        return;
      }

      const requestPayload = {
        Id: user.id,
        Name: user.name,
        Email: user.email,
        Points: updatedPoints,
        Tier: user.tier,
      };

      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://localhost:7004/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Failed to update user points: ${responseText}`);
      }

      const updatedUser = await response.json();
      setUser((prevUser) => ({ ...prevUser, points: updatedPoints }));
      localStorage.setItem("userPoints", updatedPoints); // Save points to localStorage
      toast.success("Points updated successfully!");
      await fetchEligibleRewards();

      const redeemedRewardPayload = {
        Name: selectedReward.name,
        Description: selectedReward.description,
        PointsUsed: pointsNeeded,
        ImageFile: selectedReward.imageFile,
        RedeemedAt: new Date().toISOString(),
      };

      const redeemResponse = await fetch(
        "https://localhost:7004/redeemedreward",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(redeemedRewardPayload),
        }
      );

      if (!redeemResponse.ok) {
        const responseText = await redeemResponse.text();
        console.error("Failed to store redeemed reward:", responseText);
        throw new Error(`Failed to store redeemed reward: ${responseText}`);
      }

      toast.success("Reward redeemed successfully!");
      setRedeeming(false);
      handleClose();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      setRedeeming(false);
      toast.error(`Error redeeming reward: ${error.message}`);
    }
  };

  const fetchEligibleRewards = async () => {
    try {
      const authResponse = await http.get("api/user/auth");
      const userData = authResponse.data?.user;
      if (!userData) {
        throw new Error("User data not found.");
      }

      const { points, tier } = userData.user;
      const rewardsResponse = await http.get("/reward");
      const rewards = rewardsResponse.data;
      console.log(rewards);
      const eligible = rewards
        .filter((reward) => {
          if (tier === "Bronze" && reward.tierRequired === "Bronze")
            return true;
          if (
            tier === "Silver" &&
            ["Bronze", "Silver"].includes(reward.tierRequired)
          )
            return true;
          if (
            tier === "Gold" &&
            ["Bronze", "Silver", "Gold"].includes(reward.tierRequired)
          )
            return true;
          return false;
        })
        .filter((reward) => reward.pointsNeeded <= points);
      setEligibleRewards(eligible);
    } catch (error) {
      console.error("Error fetching eligible rewards:", error);
      toast.error(`Failed to fetch eligible rewards: ${error.message}`);
    }
  };

  // Function to calculate the user's tier based on points
  const calculateTier = (points) => {
    if (points <= 3000) {
      return "Bronze";
    } else if (points <= 5000) {
      return "Silver";
    } else {
      return "Gold";
    }
  };

  // Update the user state with the correct tier based on points
  useEffect(() => {
    console.log(user);
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await http.get("api/user/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = response.data.user.user;
        console.log(userData.user);
        // Set user data, including the points fetched from API response
        console.log("User data to be set:", {
          ...userData,
          points: userData.points,
          tier: calculateTier(userData.points),
        });
        setUser((prevUser) => ({
          ...userData,
          points: userData.points,
          tier: calculateTier(userData.points),
        }));

        console.log(user);
        // Always use userData.points for progress calculation
        const points = userData.points;

        // Calculate progress based on the tier and points range
        let progressPercent = 0;

        if (points <= 3000) {
          // Bronze tier progress (0 to 3000 points)
          progressPercent = (points / 3000) * 100;
        } else if (points <= 5000) {
          // Silver tier progress (3001 to 5000 points)
          progressPercent = ((points - 3000) / 2000) * 100;
        } else {
          // Gold tier progress (points > 5000)
          progressPercent = 100;
        }

        // Set the progress bar
        setProgress(progressPercent);

        // Set points needed for next tier based on current tier
        let pointsNeeded = 0;
        if (points <= 3000) {
          pointsNeeded = 3001 - points; // Points needed to reach Silver
        } else if (points <= 5000) {
          pointsNeeded = 5001 - points; // Points needed to reach Gold
        } else {
          pointsNeeded = 0; // Already in Gold, no points needed
        }

        setPointsNeeded(pointsNeeded);

        fetchEligibleRewards();

        const redeemedRewardsFromStorage = JSON.parse(
          localStorage.getItem("redeemedRewards") || "[]"
        );
        setRedeemedRewards(redeemedRewardsFromStorage);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data.");
      }
    };

    fetchUserData();
  }, []);

  // If user is not loaded
  if (!user) {
    return (
      <Box p={2}>
        <Typography variant="h6">Loading user data...</Typography>
      </Box>
    );
  }

  // Progress Bar and Points/Tier Display
  <Box sx={{ display: "flex", alignItems: "center", mt: 3 }}>
    <LinearProgress
      variant="determinate"
      value={progress} // Dynamic progress based on tier and points
      sx={{ borderRadius: 20, height: 20, flexGrow: 1 }}
    />
    <Typography variant="body2" sx={{ ml: 2 }}>
      {tierTrophies[user.tier]}
    </Typography>
  </Box>;
  {
    user.tier !== "Gold" ? (
      <Typography variant="body2" sx={{ mt: 2 }}>
        Points needed to next tier: <b>{pointsNeeded}</b>
      </Typography>
    ) : (
      <Typography variant="body2" sx={{ mt: 1 }}>
        You are in the highest tier!
      </Typography>
    );
  }

  if (!user) {
    return (
      <Box p={2}>
        <Typography variant="h6">Loading user data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        marginTop: "100px",
        marginBottom: "50px",
        justifyContent: "center",
        padding: "0",
        width: "80vw",
        marginLeft: "12%"
      }}
    >
      {/* Sidebar */}
      <CustomerSidebar /> {/* Sidebar for customer account pages */}
      <ToastContainer />

      {/* User Info Section */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, pt: 3 }}>
          Hello, {user.username}
        </Typography>

        {/* Row for Hello and Create Post Button */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            <b>Tier:</b> {user.tier}
          </Typography>
          <IconButton
            sx={{ ml: 1 }}
            onClick={handleTierDialogOpen} // Trigger the dialog open function
          >
            <InfoIcon fontSize="inherit" />
          </IconButton>
        </Box>

        {/* Available Points Box with Confetti Trigger */}
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
          onClick={handleClick} // Trigger confetti on box click
        >
          <Typography variant="body1">Available Points:</Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", fontSize: "4.5rem" }}
          >
            {user.points}
          </Typography>
        </Box>

        {/* Display Confetti if activated */}
        {confetti && <Confetti />}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ display: "flex", alignItems: "center", mt: 3 }}>
        <LinearProgress
          variant="determinate"
          value={progress} // Dynamic progress based on userData.points
          sx={{
            borderRadius: 20,
            height: 20,
            flexGrow: 1,
            border: "2px solid #4caf50", // Green border
            backgroundColor: "#e0e0e0", // Background for unfilled part
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#4caf50", // Green for progress
            },
          }}
        />
        <Typography variant="body2" sx={{ ml: 2 }}>
          {tierTrophies[user.tier]}
        </Typography>
      </Box>

      {user.tier !== "Gold" ? (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Points needed to next tier: <b>{pointsNeeded}</b>
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ mt: 1 }}>
          You are in the highest tier!
        </Typography>
      )}

      {/* Eligible Rewards */}
      <Box>
        <Typography variant="h5" sx={{ my: 3 }}>
          Eligible Rewards
        </Typography>

        {eligibleRewards.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You do not have any eligible rewards available at the moment.
              Purchase more products to earn points.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/product"
            >
              View Products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {eligibleRewards.map((reward) => (
              <Grid key={reward.Id} item xs={12}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    height: 200,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{ flex: "0 0 40%", overflow: "hidden", height: "100%" }}
                  >
                    {reward.imageFile ? (
                      <img
                        alt="reward"
                        src={`${import.meta.env.VITE_FILE_BASE_URL}${
                          reward.imageFile
                        }`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          border: "2px dashed #ccc",
                          borderRadius: 1,
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          No Image
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      padding: 2,
                      minHeight: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="h6">{reward.name}</Typography>
                    </Box>
                    <Typography
                      sx={{
                        wordWrap: "break-word",
                        overflow: "hidden",
                        whiteSpace: "pre-wrap",
                        mb: 1,
                      }}
                    >
                      <strong>Description:</strong> {reward.description}
                    </Typography>
                    <Typography>
                      <strong>Tier Required:</strong> {reward.tierRequired}
                    </Typography>

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: "green", color: "white" }}
                        onClick={() => handleOpenDialog(reward)}
                      >
                        {reward.pointsNeeded} Points
                      </Button>

                      <Button
                        variant="outlined"
                        sx={{ borderColor: "blue", color: "blue" }}
                        onClick={() => handleGiftClick(reward.id)}
                      >
                        Gift
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}

            {/* Dialog for confirming purchase */}
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {/* Check if the reward has already been redeemed */}
                  {redeemedRewards.includes(selectedReward?.Id) ? (
                    <Typography variant="body1" color="textSecondary">
                      You have already redeemed this reward.
                    </Typography>
                  ) : (
                    <Typography variant="body1">
                      Are you sure you want to redeem "
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{ fontWeight: "bold" }}
                      >
                        {selectedReward?.name}
                      </Typography>
                      " for{" "}
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{ fontWeight: "bold" }}
                      >
                        {selectedReward?.pointsNeeded} points?
                      </Typography>
                    </Typography>
                  )}
                </DialogContentText>
              </DialogContent>
              <DialogActions
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Button
                  onClick={handleClose}
                  sx={{
                    color: "white",
                    backgroundColor: "red",
                    "&:hover": {
                      backgroundColor: "darkred",
                    },
                    flex: 1,
                    marginRight: "8px",
                  }}
                >
                  <b>Cancel</b>
                </Button>
                <Button
                  onClick={handlePurchaseReward}
                  variant="contained"
                  color="primary"
                  sx={{
                    flex: 1,
                    marginLeft: "8px",
                  }}
                  disabled={
                    redeeming || redeemedRewards.includes(selectedReward?.Id)
                  }
                >
                  <b>Redeem</b>
                </Button>
              </DialogActions>
            </Dialog>
          </Grid>
        )}
      </Box>

      <Typography variant="h5" sx={{ my: 2 }}>
        View Redeemed Rewards
      </Typography>

      <Button
        variant="contained"
        color="success"
        component={RouterLink}
        to="/redeemedreward"
        sx={{ marginBottom: 4 }}
      >
        View Redeemed Rewards
      </Button>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h5" sx={{ my: 3 }}>
          Play Game
        </Typography>
        {user.tier === "Bronze" && (
          <IconButton sx={{ ml: 1 }} onClick={handleDialogOpen}>
            <InfoIcon fontSize="inherit" />
          </IconButton>
        )}
      </Box>

      <Button
        variant="contained"
        color={user.tier === "Bronze" ? "disabled" : "primary"}
        component={RouterLink}
        to={user.tier !== "Bronze" ? "/rewardgame" : "#"}
        sx={{
          marginBottom: 4,
          backgroundColor: user.tier === "Bronze" ? "grey" : "primary.main",
          cursor: user.tier === "Bronze" ? "not-allowed" : "pointer",
        }}
        disabled={user.tier === "Bronze"}
      >
        Play Game
      </Button>

      {/* Game Info Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Access Restricted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography variant="body1">
              Only Silver and Gold tier users can access this game.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tier Info Dialog */}
      <Dialog open={tierDialogOpen} onClose={handleTierDialogClose}>
        <DialogTitle>Tier Information</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography variant="body1">
              Your current tier is <b>{user.tier}</b>.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <b>Tier Ranges:</b>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Bronze:</b> 0 to 3000 points
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Silver:</b> 3001 to 5000 points
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Gold:</b> 5001+ points
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              <b>Tier Benefits:</b>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {user.tier === "Bronze" &&
                "You are just starting out! Earn points and unlock rewards."}
              {user.tier === "Silver" &&
                "You've reached Silver! Enjoy more rewards and opportunities."}
              {user.tier === "Gold" &&
                "You're at the highest tier! Enjoy exclusive rewards and benefits."}
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTierDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRewards;
