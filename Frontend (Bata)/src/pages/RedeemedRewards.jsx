import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserContext from "../contexts/UserContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

dayjs.extend(utc);

const RedeemedRewards = () => {
  const { user: contextUser } = useContext(UserContext);
  const [user, setUser] = useState(contextUser);
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Fetch redeemed rewards
  const fetchRedeemedRewards = async () => {
    try {
      // Ensure user is defined before making the request
      if (!user || !user.id) {
        console.error("User is not defined or does not have an id.");
        return;
      }

      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://localhost:7004/redeemedreward", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch redeemed rewards.");
      }

      const rewards = await response.json();
      console.log(rewards); // Log the rewards to check the structure

      // Filter redeemed rewards by customerId (user.id)
      const userRewards = rewards.filter(
        (reward) => reward.customerId === user.id
      );
      setRedeemedRewards(userRewards);
    } catch (error) {
      console.error("Error fetching redeemed rewards:", error);
      toast.error(
        "There was an issue fetching redeemed rewards. Please try again later."
      );
    }
  };

  useEffect(() => {
    fetchRedeemedRewards();
  }, [user]);

  // Handle search input change
  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  // Handle sort option change
  const handleSortOptionChange = (event) => {
    setSortOption(event.target.value);
  };

  // Filter and sort rewards
  const filteredRewards = redeemedRewards
    .filter((reward) =>
      reward.name.toLowerCase().includes(searchInput.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "alphabetical") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "oldest") {
        return new Date(a.redeemedAt) - new Date(b.redeemedAt);
      } else {
        return new Date(b.redeemedAt) - new Date(a.redeemedAt);
      }
    });

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
      <CustomerSidebar /> {/* Sidebar for customer account pages */}
      <ToastContainer />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ my: 3, }}>
          Redeemed Rewards
        </Typography>
        <Button
          variant="contained"
          color="success"
          component={RouterLink}
          to="/userrewards"
        >
          Back to My Rewards
        </Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          label="Search Rewards"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchInputChange}
          sx={{ width: "40%" }}
        />
        <FormControl sx={{ width: "40%" }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortOption}
            onChange={handleSortOptionChange}
            label="Sort By"
          >
            <MenuItem value="alphabetical">Alphabetical</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="newest">Newest</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box>
        {filteredRewards.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              No rewards match your search criteria.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/products"
            >
              View Products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredRewards.map((reward) => (
              <Grid item xs={12} key={reward.Id}>
                <Card
                  sx={{ display: "flex", flexDirection: "row", height: 200 }}
                >
                  <Box
                    sx={{ flex: "0 0 40%", overflow: "hidden", height: "100%" }}
                  >
                    {reward.imageFile ? (
                      <img
                        alt="redeemed reward"
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
                  <Box sx={{ flex: 1, padding: 2 }}>
                    <Typography variant="h6">{reward.name}</Typography>
                    <Typography
                      variant="body2"
                      sx={{ wordWrap: "break-word", mb: 1 }}
                    >
                      <strong>Description:</strong> {reward.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Points Used:</strong> {reward.pointsUsed}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Redeemed At:</strong>{" "}
                      {dayjs(reward.redeemedAt).utcOffset(8).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}
                    </Typography>
                    {/* Display Gifted if the reward is gifted */}
                    {reward.isGifted && (
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mt: 1, color: "#000" }}
                      >
                        Gifted 🎁
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default RedeemedRewards;
