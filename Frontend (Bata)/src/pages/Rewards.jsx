import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Input,
  IconButton,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  AccountCircle,
  AccessTime,
  Search,
  Clear,
  Edit,
} from "@mui/icons-material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import global from "../global";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import CustomerSidebar from "./CustomSidebar"; // Import Customer Sidebar

dayjs.extend(utc);

function Rewards() {
  const [rewardList, setRewardList] = useState([]);
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // To control the dropdown
  const { user } = useContext(UserContext);

  const onSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const getRewards = () => {
    http
      .get("/reward")
      .then((res) => {
        setRewardList(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch rewards:", err);
      });
  };

  const searchRewards = () => {
    http
      .get(`/reward?search=${search}`)
      .then((res) => {
        setRewardList(res.data);
      })
      .catch((err) => {
        console.error("Failed to search rewards:", err);
      });
  };

  useEffect(() => {
    getRewards();
  }, []);

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      searchRewards();
    }
  };

  const onClickSearch = () => {
    searchRewards();
  };

  const onClickClear = () => {
    setSearch("");
    getRewards();
  };

  const handleSortMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorEl(null);
  };

  const handleSort = (sortType) => {
    const sortedList = [...rewardList];
    if (sortType === "alphabetical") {
      sortedList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === "id") {
      sortedList.sort((a, b) => a.id - b.id);
    }
    setRewardList(sortedList);
    handleSortClose();
  };

  return (
    <Box
      sx={{
        marginTop: "100px",
        marginBottom: "50px",
        justifyContent: "center",
        padding: "0",
        marginLeft: "11%",
        width: "80vw"
      }}
    >
                        <CustomerSidebar /> {/* Sidebar for customer account pages */}
      <Typography variant="h3" sx={{ my: 2 }}>
        Rewards
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Input
          value={search}
          placeholder="Search Rewards"
          onChange={onSearchChange}
          onKeyDown={onSearchKeyDown}
          sx={{ flexGrow: 1 }}
        />
        <IconButton color="primary" onClick={onClickSearch}>
          <Search />
        </IconButton>
        <IconButton color="primary" onClick={onClickClear}>
          <Clear />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        {user && (
          <Link to="/addreward">
            <Button variant="contained" color="info" >+ Add Reward</Button>
          </Link>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSortMenuClick}
          sx={{ ml: 2 }}
        >
          Sort
        </Button>

        {/* Sort Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSortClose}
        >
          <MenuItem onClick={() => handleSort("alphabetical")}>
            Sort by Alphabetical Order
          </MenuItem>
          <MenuItem onClick={() => handleSort("id")}>Sort by ID</MenuItem>
        </Menu>
      </Box>

      <Grid container spacing={2}>
        {rewardList.map((reward) => (
          <Grid item xs={12} md={6} lg={4} key={reward.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {reward.imageFile ? (
                <Box sx={{ aspectRatio: "16/9", overflow: "hidden" }}>
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
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No Image
                  </Typography>
                </Box>
              )}
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">{reward.name}</Typography>
                  <Link to={`/editreward/${reward.id}`}>
                    <IconButton
                      color="primary"
                      sx={{ padding: "4px", color: "black" }}
                    >
                      <Edit />
                    </IconButton>
                  </Link>
                </Box>

                {/* <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccountCircle sx={{ mr: 1 }} />
                  <Typography color="text.secondary">
                    Created by: {reward.user?.name || "Unknown User"}
                  </Typography>
                </Box> */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccessTime sx={{ mr: 1 }} />
                  <Typography color="text.secondary">
                    {dayjs(reward.createdAt)
                      .utcOffset(8)
                      .format(global.datetimeFormat)}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>ID:</strong> {reward.id}
                </Typography>

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
                  <strong>Points Needed:</strong> {reward.pointsNeeded}
                </Typography>

                <Typography>
                  <strong>Tier Required:</strong> {reward.tierRequired}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Rewards;
