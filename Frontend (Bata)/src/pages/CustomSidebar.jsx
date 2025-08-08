// import React, { useState, useEffect, useContext } from "react";
// import { Drawer, List, ListItem, ListItemText, IconButton, Box, Typography } from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu";
// import { Link, useLocation } from "react-router-dom"; // Import useLocation
// import http from "../http";
// import UserContext from "../contexts/UserContext";

// const C_Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   const [message, setMessage] = useState("Loading...");
//   const { user } = useContext(UserContext);
//   const location = useLocation(); // Get current path

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("accessToken");

//         if (!token) {
//           setMessage("User is not logged in.");
//           return;
//         }

//         const response = await http.get("/api/user/profile", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log("📥 User Profile Response:", response.data);
//         setMessage(""); // Clear previous messages
//       } catch (error) {
//         console.error("❌ Error fetching user data:", error);
//         setMessage("Error fetching user data. Please try again later.");
//       }
//     };

//     fetchUserData();
//   }, []);

//   return (
//     <Box>
//       {/* Hamburger Button (Color Changes When Sidebar is Open) */}
//       <IconButton
//         onClick={() => setIsOpen(!isOpen)}
//         sx={{
//           position: "fixed",
//           top: 80,
//           left: isOpen ? 190 : 20,
//           transition: "left 0.3s ease-in-out",
//           zIndex: 1500,
//         }}
//       >
//         <MenuIcon />
//       </IconButton>

//       {/* Sidebar Drawer */}
//       <Drawer
//         anchor="left"
//         open={isOpen}
//         variant="persistent"
//         sx={{
//           "& .MuiDrawer-paper": {
//             width: 250,
//             marginTop: "73px",
//             paddingTop: "35px",
//             transition: "width 0.3s ease-in-out",
//           },
//         }}
//       >
//         <List>
//           {message && (
//             <ListItem>
//               <ListItemText
//                 primary={
//                   <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>
//                     {message}
//                   </Typography>
//                 }
//               />
//             </ListItem>
//           )}

//           {/* Sidebar List Items (Highlight if Active) */}
//           <ListItem
//             button
//             component={Link}
//             to="/accountinfo"
//             sx={{
//               backgroundColor: location.pathname === "/accountinfo" ? "#f5f5f5" : "white",
//               "&:hover": { backgroundColor: "#f5f5f5" },
//             }}
//           >
//             <ListItemText
//               primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>Account Information</Typography>}
//             />
//           </ListItem>

//           <ListItem
//             button
//             component={Link}
//             to="/userrewards"
//             sx={{
//               backgroundColor: location.pathname === "/userrewards" ? "#f5f5f5" : "white",
//               "&:hover": { backgroundColor: "#f5f5f5" },
//             }}
//           >
//             <ListItemText
//               primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>User Rewards</Typography>}
//             />
//           </ListItem>

//           <ListItem
//             button
//             component={Link}
//             to="/redeemedreward"
//             sx={{
//               backgroundColor: location.pathname === "/redeemedreward" ? "#f5f5f5" : "white",
//               "&:hover": { backgroundColor: "#f5f5f5" },
//             }}
//           >
//             <ListItemText
//               primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>Redeemed Rewards</Typography>}
//             />
//           </ListItem>

//           <ListItem
//             button
//             component={Link}
//             to="/change-password"
//             sx={{
//               backgroundColor: location.pathname === "/change-password" ? "#f5f5f5" : "white",
//               "&:hover": { backgroundColor: "#f5f5f5" },
//             }}
//           >
//             <ListItemText
//               primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>Change Password</Typography>}
//             />
//           </ListItem>

//           <ListItem
//             button
//             component={Link}
//             to="/customerorder"
//             sx={{
//               backgroundColor: location.pathname === "/customerorder" ? "#f5f5f5" : "white",
//               "&:hover": { backgroundColor: "#f5f5f5" },
//             }}
//           >
//             <ListItemText
//               primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>My Orders</Typography>}
//             />
//           </ListItem>

//           {user?.id && (
//             <ListItem
//               button
//               component={Link}
//               to={`/application/${user.id}`}
//               sx={{
//                 backgroundColor: location.pathname === `/application/${user.id}` ? "#f5f5f5" : "white",
//                 "&:hover": { backgroundColor: "#f5f5f5" },
//               }}
//             >
//               <ListItemText
//                 primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>Application Status</Typography>}
//               />
//             </ListItem>
//           )}
//         </List>
//       </Drawer>
//     </Box>
//   );
// };

// export default C_Sidebar;


// import React, { useState, useEffect, useContext } from "react";
// import { Drawer, List, ListItem, ListItemText, IconButton, Box, Typography } from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu";
// import { Link } from "react-router-dom";
// import http from "../http";
// import UserContext from "../contexts/UserContext";

// const C_Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   const [message, setMessage] = useState("Loading...");
//   const { user } = useContext(UserContext);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("accessToken");

//         if (!token) {
//           setMessage("User is not logged in.");
//           return;
//         }

//         const response = await http.get("/api/user/profile", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log("📥 User Profile Response:", response.data);
//         setMessage(""); // Clear previous messages
//       } catch (error) {
//         console.error("❌ Error fetching user data:", error);
//         setMessage("Error fetching user data. Please try again later.");
//       }
//     };

//     fetchUserData();
//   }, []);

//   return (
//     <Box>
//       {/* Hamburger Button */}
//       <IconButton
//         onClick={() => setIsOpen(!isOpen)}
//         sx={{
//           position: "fixed",
//           top: 80,
//           left: isOpen ? 190 : 20,
//           transition: "left 0.3s ease-in-out",
//           zIndex: 1500,
//         }}
//       >
//         <MenuIcon />
//       </IconButton>

//       {/* Sidebar Drawer */}
//       <Drawer
//         anchor="left"
//         open={isOpen}
//         variant="persistent"
//         sx={{
//           "& .MuiDrawer-paper": {
//             width: 250,
//             marginTop: "70px",
//             paddingTop: "35px",
//             transition: "width 0.3s ease-in-out",
//           },
//         }}
//       >
//         <List>
//           {message && (
//             <ListItem>
//               <ListItemText
//                 primary={
//                   <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" }}>
//                     {message}
//                   </Typography>
//                 }
//               />
//             </ListItem>
//           )}
//           <ListItem button component={Link} to="/accountinfo">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56", fontSize: "17px" }}>
//                   Account Information
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/userrewards">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56", fontSize: "17px" }}>
//                   User Rewards
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/redeemedreward">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56", fontSize: "17px" }}>
//                   Redeemed Rewards
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/change-password">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56", fontSize: "17px" }}>
//                   Change Password
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/customerorder">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56" , fontSize: "17px" }}>
//                   My Orders
//                 </Typography>
//               }
//             />
//           </ListItem>
//           {user?.id && (
//             <ListItem button component={Link} to={`/application/${user.id}`}>
//               <ListItemText
//                 primary={
//                   <Typography variant="body1" sx={{ fontWeight: "bold", color: "#414B56", fontSize: "17px" }}>    
//                     Application Status
//                   </Typography>
//                 }
//               />
//             </ListItem>
//           )}
//         </List>
//       </Drawer>
//     </Box>
//   );
// };

// export default C_Sidebar;


// import React, { useState, useEffect, useContext } from "react";
// import { Drawer, List, ListItem, ListItemText, IconButton, Box, Typography } from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu";
// import { Link } from "react-router-dom";
// import http from "../http";
// import UserContext from "../contexts/UserContext";

// const C_Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   const [message, setMessage] = useState("Loading...");
//   const { user } = useContext(UserContext);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("accessToken");

//         if (!token) {
//           setMessage("User is not logged in.");
//           return;
//         }

//         const response = await http.get("/api/user/profile", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log("📥 User Profile Response:", response.data);
//         setMessage(""); // Clear previous messages
//       } catch (error) {
//         console.error("❌ Error fetching user data:", error);
//         setMessage("Error fetching user data. Please try again later.");
//       }
//     };

//     fetchUserData();
//   }, []);

//   return (
//     <Box>
//       {/* Hamburger Button */}
//       <IconButton
//         onClick={() => setIsOpen(!isOpen)}
//         sx={{
//           position: "fixed",
//           top: 80,
//           left: isOpen ? 190 : 20,
//           transition: "left 0.3s ease-in-out",
//           zIndex: 1500,
//           color: isOpen ? "white" : "black", // Change color when sidebar is open
//         }}
//       >
//         <MenuIcon />
//       </IconButton>

//       {/* Sidebar Drawer */}
//       <Drawer
//         anchor="left"
//         open={isOpen}
//         variant="persistent"
//         sx={{
//           "& .MuiDrawer-paper": {
//             width: 250,
//             marginTop: "70px",
//             paddingTop: "35px",
//             transition: "width 0.3s ease-in-out",
//             backgroundColor: "#2c3e50",
//           },
//         }}
//       >
//         <List>
//           {message && (
//             <ListItem>
//               <ListItemText
//                 primary={
//                   <Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>
//                     {message}
//                   </Typography>
//                 }
//               />
//             </ListItem>
//           )}
//           <ListItem button component={Link} to="/accountinfo">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                   Account Information
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/userrewards">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                   User Rewards
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/redeemedreward">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                   Redeemed Rewards
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/change-password">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                   Change Password
//                 </Typography>
//               }
//             />
//           </ListItem>
//           <ListItem button component={Link} to="/customerorder">
//             <ListItemText
//               primary={
//                 <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                   My Orders
//                 </Typography>
//               }
//             />
//           </ListItem>
//           {user?.id && (
//             <ListItem button component={Link} to={`/application/${user.id}`}>
//               <ListItemText
//                 primary={
//                   <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "17px" }}>
//                     Application Status
//                   </Typography>
//                 }
//               />
//             </ListItem>
//           )}
//         </List>
//       </Drawer>
//     </Box>
//   );
// };

// export default C_Sidebar;


import React, { useState, useEffect, useContext } from "react";
import { Drawer, List, ListItem, ListItemText, IconButton, Box, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";
import http from "../http";
import UserContext from "../contexts/UserContext";

const C_Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("Loading...");
  const { user } = useContext(UserContext);
  const location = useLocation(); // Get current path

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setMessage("User is not logged in.");
          return;
        }

        const response = await http.get("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("📥 User Profile Response:", response.data);
        setMessage(""); // Clear previous messages
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        setMessage("Error fetching user data. Please try again later.");
      }
    };

    fetchUserData();
  }, []);

  return (
    <Box>
      {/* Hamburger Button */}
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: "fixed",
          top: 80,
          left: isOpen ? 190 : 20,
          transition: "left 0.3s ease-in-out",
          zIndex: 1500,
          color: isOpen ? "white" : "black", // Change color when sidebar is open
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: 250,
            marginTop: "70px",
            paddingTop: "35px",
            transition: "width 0.3s ease-in-out",
            backgroundColor: "#2c3e50",
          },
        }}
      >
        <List>
          {message && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>
                    {message}
                  </Typography>
                }
              />
            </ListItem>
          )}

          {/* Customer Sidebar Items */}
          {(user?.role === "customer" || !user) && (
            <>
              <ListItem
                button
                component={Link}
                to="/accountinfo"
                sx={{
                  backgroundColor: location.pathname === "/accountinfo" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Account Information</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/userrewards"
                sx={{
                  backgroundColor: location.pathname === "/userrewards" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>User Rewards</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/redeemedreward"
                sx={{
                  backgroundColor: location.pathname === "/redeemedreward" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Redeemed Rewards</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/change-password"
                sx={{
                  backgroundColor: location.pathname === "/change-password" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Change Password</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/customerorder"
                sx={{
                  backgroundColor: location.pathname === "/customerorder" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>My Orders</Typography>}
                />
              </ListItem>

              {user?.id && (
                <ListItem
                  button
                  component={Link}
                  to={`/application/${user.id}`}
                  sx={{
                    backgroundColor: location.pathname === `/application/${user.id}` ? "#34495e" : "transparent",
                    "&:hover": { backgroundColor: "#3b4a5a" },
                  }}
                >
                  <ListItemText
                    primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Application Status</Typography>}
                  />
                </ListItem>
              )}
            </>
          )}

          {/* Staff Sidebar Items */}
          {user?.role === "standard" && (
            <>
              <ListItem
                button
                component={Link}
                to="/stafforder"
                sx={{
                  backgroundColor: location.pathname === "/stafforder" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Manage Orders</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/rewards"
                sx={{
                  backgroundColor: location.pathname === "/rewards" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Create Rewards</Typography>}
                />
              </ListItem>

              <ListItem
                button
                component={Link}
                to="/addcategory"
                sx={{
                  backgroundColor: location.pathname === "/addcategory" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Add Category</Typography>}
                />
              </ListItem>

              {/* <ListItem
                button
                component={Link}
                to="/jobapplication"
                sx={{
                  backgroundColor: location.pathname === "/jobapplication" ? "#34495e" : "transparent",
                  "&:hover": { backgroundColor: "#3b4a5a" },
                }}
              >
                <ListItemText
                  primary={<Typography variant="body1" sx={{ fontWeight: "bold", color: "white" }}>Job Applications</Typography>}
                />
              </ListItem> */}
            </>
          )}
        </List>
      </Drawer>
    </Box>
  );
};

export default C_Sidebar;

