import './App.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Button, InputBase } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import MyTheme from './themes/MyTheme';
import HomePage from './pages/HomePage';
import NewArrivals from './pages/NewArrivals';
import ShoppingCart from './pages/ShoppingCart';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import StaffProduct from './pages/StaffProduct';
import CartSidebar from './pages/CartSidebar';
import CreateVoucher from './pages/CreateVoucher';
import EditVoucher from './pages/EditVoucher';
import Vouchers from './pages/Vouchers';
import http from './http';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/system';
import UserContext from './contexts/UserContext';
import BataLogo from '../src/assets/Bata_Logo.png';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Login from './pages/C_Login';
import Register from './pages/C_Register';
import AccountInfo from './pages/C_AccountInfo';
import SetPassword from './pages/C_SetPassword';
import EditAccount from './pages/C_EditAccount';
import ViewAddress from './pages/C_ViewAddress';
import AddAddress from './pages/C_AddAddress';
import EditAddress from './pages/C_EditAddress';
import StaffLogin from './pages/S_Login';
import StaffRegister from './pages/S_Register';
import StaffAccountInfo from './pages/S_AccountInfo';
import UsersPage from './pages/S_Users';
import Rewards from "./pages/Rewards";
import AddReward from "./pages/AddReward";
import EditReward from "./pages/EditReward";
import UserRewards from "./pages/UserRewards";
import RewardGame from "./pages/RewardGame";
import RedeemedRewards from "./pages/RedeemedRewards";
import Badge from '@mui/material/Badge';
import AdminAccountInfo from './pages/A_AccountInfo';
import AdminLogin from './pages/A_Login';
import AdminRegister from './pages/A_Register';
import Enable2FA from './pages/C_Enable2FA';
import LoginOptions from './pages/LoginOption';
import { jwtDecode } from "jwt-decode"; // ✅ Correct way
import Checkout from './pages/Checkout';
import Payment from './pages/Payment'
import S_Order from './pages/S_Order'
import Loading from './pages/loading'
import Sorder from './pages/SuccessfulOrder'
import SDashboard from './pages/S_Dashboard'
import OrderSummary from './pages/OrderSummary'
import C_Order from './pages/C_Order'
import C_OrderDetails from './pages/C_OrderDetails'
import S_OrderDetails from './pages/S_OrderDetails'
import VerifyOtp from './pages/Verify';
import ChangePassword from './pages/C_ChangePassword';
import GiftReward from "./pages/GiftReward";
import AdminWarehouse from "./pages/A_ManageWarehouse";
import ApplicationStatus from "./pages/ApplicationStatus";
import JobApplicationDetail from './pages/JobApplicationDetail';
import JobApplicationsPage from './pages/JobApplication';
import AddDeliveryAgent from './pages/AddDeliveryAgent';
import AddFulfilmentStaff from './pages/AddFulfilmentStaff';
import Careers from './pages/Career';
import UsersPage2 from './pages/A_Users';
import ProductDetail from './pages/ProductDetail';
import StaffsPage from './pages/A_Staffs';
import ForgotPassword from './pages/C_ForgetPassword';
import ResetPassword from './pages/C_ResetPassword';

// Song Hui
import AddCategory from './pages/AddCategory';
import Category from './pages/Category';
import Editcategory from './pages/EditCategory';
import ImportStock from './pages/ImportStock';
import EditStock from './pages/EditStocks';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import View3DModel from './pages/View3DModel';
import Compare from './pages/Compare';

import S_ManageOrder from './pages/S_ManageOrder';
import S_FulfilmentStaffDashboard from './pages/S_FulfilmentStaffDashboard';
import S_DeliveryAgentDashboard from './pages/S_DeliveryAgentDashboard';
import S_ManageDelivery from './pages/S_ManageDelivery';


const useStyles = makeStyles({
  customContainer: {
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
    marginLeft: '0 !important',
    marginRight: '0 !important',
    width: '100vw !important',
    boxSizing: 'border-box !important',
  },
});

const SearchBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f1f1f1',
  borderRadius: '40px',
  padding: '2px 10px',
  marginLeft: '30px',
  width: '200px',
  height: '35px',
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  flex: 1,
}));

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0); // State for cart count
  const classes = useStyles();
  const [isCartOpen, setIsCartOpen] = useState(false); // State for cart sidebar

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const token = localStorage.getItem("access");
      if (!accessToken && !token) {
        return;  // Neither accessToken nor token exists
      }

      // You can use the token if either accessToken or token exists
      const validToken = accessToken || token;
  
  
      try {
        const decoded = jwtDecode(validToken); // Decode the token
        console.log(decoded)
        const role = decoded.role; // Extract the role (assuming your backend includes it)
  
        let response;
        if (role === "customer") {
          response = await http.get("/api/user/auth"); // Fetch user details
          setUser(response.data.user.user);
        } else if (role === "standard") {
          response = await http.get("/api/staff/auth"); // Fetch staff details
          setUser(response.data.staff);
        } else if (role === "Admin") {
          response = await http.get("/api/admin/auth"); // Fetch staff details
          setUser(response.data.admin);
        }else {
          response = await http.get("/api/staff/auth");
        }
        } catch (error) {
          console.error("Authentication failed", error);
        }
    };
    fetchUser();
  }, []);
  useEffect(() => {
    
    if (user?.role == "customer") {
      // Fetch the cart items to update the badge count
      http.get('/cartitem', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
        .then((res) => {
          // Calculate the total quantity from the cart items
          const totalQuantity = res.data.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalQuantity); // Update the cart count with total quantity
        })
        .catch((err) => console.error('Error fetching cart items:', err));
    }
  }, [user]); // Re-run this effect whenever the user changes
  
  console.log(user)
  const logout = () => {
    localStorage.clear();
    setUser(null)
    window.location = "/";
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <ThemeProvider theme={MyTheme}>
          <AppBar position="fixed" className="AppBar" sx={{ width: '100vw', paddingLeft: '3%', paddingRight: '3%'}}>
          <Container maxWidth={false}>
              <Toolbar disableGutters={true}>
                <Link to="/">
                  <img src={BataLogo} alt="Bata Logo" style={{ height: '34px'}} />
                </Link>
                {(user?.role === "Admin") && (
                <>
                  <Link to="/staffregister" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '30px','&:hover': {color: 'black'} }}>STAFF REGISTER</Typography></Link>
                  <Link to="/addreward" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>TASK</Typography></Link>
                  <Link to="/users2" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>USERS</Typography></Link>
                  <Link to="/staff" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>STAFF</Typography></Link>
                  <Link to="/staffproduct" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>PRODUCTS</Typography></Link>
                  <Link to="/vouchers" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>VOUCHERS</Typography></Link>
                  <Link to="/admin/warehouses" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>WAREHOUSE</Typography></Link>
                  <SearchBar>
                    <SearchOutlinedIcon style={{ fontSize: 25, cursor: 'pointer'}} />
                    <SearchInput placeholder="Search…" inputProps={{ 'aria-label': 'search' }} />
                    <FileUploadOutlinedIcon style={{ fontSize: 27, cursor: 'pointer'}} />
                  </SearchBar>
                  <Box sx={{ flexGrow: 1 }}></Box>
                    <Link to="/" ><FavoriteBorderOutlinedIcon style={{ fontSize: 30, marginRight: 10 }}/></Link>
                    <Link to="/shoppingcart">
                        <Badge
                          badgeContent={cartCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#E2001A', // Set the background color of the badge
                              color: 'white', // Set the text color
                              borderRadius: '50%', // Make it circular
                              height: '20px', // Set the height
                              minWidth: '20px', // Set the width
                              fontSize: '12px', // Adjust font size
                              top: '3px',
                              right: '4px',
                            },
                          }}
                        >
                          <ShoppingCartOutlinedIcon style={{ fontSize: 30, marginBottom: 6 }} />
                        </Badge>
                      </Link>
                    <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                    <Link to="/admin-accountinfo" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>{user?.username}</Typography></Link>
                    <Button onClick={logout} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Logout</Button>
                </>
                )}
                {(user?.role === "standard") && (
                <>
                  <Link to="/staffdashboard" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '30px','&:hover': {color: 'black'} }}>DASHBOARD</Typography></Link>
                  {/* <Link to="/rewards" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>REWARDS</Typography></Link> */}
                  <Link to="/users" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>USERS</Typography></Link>
                  <Link to="/staffproduct" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>PRODUCTS</Typography></Link>
                  <Link to="/vouchers" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>VOUCHERS</Typography></Link>
                  {/* <Link to="/stafforder" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>ORDERS</Typography></Link> */}
                  <Link to="/jobapplication" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>JOB APPLICATION</Typography></Link>
                  <Box sx={{ flexGrow: 1 }}></Box>
                    <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                    <Link to="/staff-accountinfo" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>{user?.username}</Typography></Link>
                    <Button onClick={logout} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Logout</Button>
                </>
                )}
                {(user?.role === "FulfilmentStaff") && (
                <>
                  <Link to="/fulfilmentstaffdashboard" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '30px','&:hover': {color: 'black'} }}>DASHBOARD</Typography></Link>
                  <Link to="/manageorder" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>MANAGE ORDER</Typography></Link>
                  {/* <Link to="/users" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>USERS</Typography></Link>
                  <Link to="/staffproduct" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>PRODUCTS</Typography></Link>
                  <Link to="/vouchers" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>VOUCHERS</Typography></Link>
                  <Link to="/stafforder" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>ORDERS</Typography></Link>
                  <Link to="/jobapplication" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>JOB APPLICATION</Typography></Link> */}
                  <Box sx={{ flexGrow: 1 }}></Box>
                    <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                    <Link to="/staff-accountinfo" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>{user?.username}</Typography></Link>
                    <Button onClick={logout} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Logout</Button>
                </>
                )}
                 {(user?.role === "deliveryAgent") && (
                <>
                  <Link to="/deliveryagentdashboard" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '30px','&:hover': {color: 'black'} }}>DASHBOARD</Typography></Link>
                  <Link to="/managedelivery" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>MANAGE DELIVERY</Typography></Link>
                  {/* <Link to="/users" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>USERS</Typography></Link>
                  <Link to="/staffproduct" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>PRODUCTS</Typography></Link>
                  <Link to="/vouchers" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>VOUCHERS</Typography></Link>
                  <Link to="/stafforder" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>ORDERS</Typography></Link>
                  <Link to="/jobapplication" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>JOB APPLICATION</Typography></Link> */}
                  <Box sx={{ flexGrow: 1 }}></Box>
                    <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                    <Link to="/staff-accountinfo" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>{user?.username}</Typography></Link>
                    <Button onClick={logout} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Logout</Button>
                </>
                )}
                {(user?.role === "customer" || !user) && (
                <>
                  <Link to="/product" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '30px','&:hover': {color: 'black'} }}>NEW ARRIVALS</Typography></Link>
                  <Link to="/" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>WOMEN</Typography></Link>
                  <Link to="/" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>MEN</Typography></Link>
                  <Link to="/" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>KIDS</Typography></Link>
                  <Link to="/" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px','&:hover': {color: 'black'}  }}>BAGS & ACCESSORIES</Typography></Link>
                  <SearchBar>
                    <SearchOutlinedIcon style={{ fontSize: 25, cursor: 'pointer'}} />
                    <SearchInput placeholder="Search…" inputProps={{ 'aria-label': 'search' }} />
                    <FileUploadOutlinedIcon style={{ fontSize: 27, cursor: 'pointer'}} />
                  </SearchBar>
                  <Box sx={{ flexGrow: 1 }}></Box>
                  {user && (
                    <>
                      <Link to="/" ><FavoriteBorderOutlinedIcon style={{ fontSize: 30}}/></Link>
                      <Link to="/shoppingcart">
                        <Badge
                          badgeContent={cartCount}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#E2001A', // Set the background color of the badge
                              color: 'white', // Set the text color
                              borderRadius: '50%', // Make it circular
                              height: '20px', // Set the height
                              minWidth: '20px', // Set the width
                              fontSize: '12px', // Adjust font size
                              top: '3px',
                              right: '4px',
                            },
                          }}
                        >
                          <ShoppingCartOutlinedIcon style={{ fontSize: 30, marginBottom: 6 }} />
                        </Badge>
                      </Link>
                      <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                      <Link to="/accountinfo" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>{user.username}</Typography></Link>
                      <Button onClick={logout} sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Logout</Button>
                    </>
                  )
                  }
                  {!user && (
                    <>
                      <Link to="/" ><FavoriteBorderOutlinedIcon style={{ fontSize: 30, marginRight: 10 }}/></Link>
                      <Link to="/" ><ShoppingCartOutlinedIcon style={{ fontSize: 30, marginRight: 10 }}/></Link>
                      <Link to="/accountinfo" ><PersonOutlineOutlinedIcon style={{ fontSize: 35 }}/></Link>
                      <Link to="/login" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}   }}>Login</Typography></Link>
                      <Link to="/register" ><Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold', color: '#414B56', fontSize: '15px', marginLeft: '-10px','&:hover': {color: 'black'}  }}>/ Join</Typography></Link>
                    </>
                  )}
                </>
                )}
              </Toolbar>
            </Container>
          </AppBar>

          <Container className={classes.customContainer}>
            <Routes>
              <Route path={"/"} element={<HomePage />} />
              <Route path={"/newarrivals"} element={<NewArrivals setCartCount={setCartCount} />} />
              <Route path={"/shoppingcart"} element={<ShoppingCart setCartCount={setCartCount} />} />
              <Route path={"/createproduct"} element={<CreateProduct />} />
              <Route path={"/editproduct/:id"} element={<EditProduct />} />
              <Route path={"/staffproduct"} element={<StaffProduct />} />
              <Route path={"/createvoucher"} element={<CreateVoucher />} />
              <Route path={"/editvoucher/:id"} element={<EditVoucher />} />
              <Route path={"/vouchers"} element={<Vouchers />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path='/accountinfo' element={<AccountInfo />} />
              <Route path='/set-password' element={<SetPassword />} />
              <Route path='/edit-account' element={<EditAccount />} />
              <Route path='/view-address' element={<ViewAddress />} />
              <Route path='/add-address' element={<AddAddress />} />
              <Route path='/edit-address/:id' element={<EditAddress />} />
              <Route path="/stafflogin" element={<StaffLogin />} />
              <Route path="/staffregister" element={<StaffRegister />} />
              <Route path="/staff-accountinfo" element={<StaffAccountInfo />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path={"/rewards"} element={<Rewards />} />
              <Route path={"/addreward"} element={<AddReward />} />
              <Route path={"/editreward/:id"} element={<EditReward />} />
              <Route path={"/userrewards"} element={<UserRewards />} />
              <Route path={"/redeemedreward"} element={<RedeemedRewards />} />
              <Route path={"/rewardgame"} element={<RewardGame />} />
              <Route path="/adminlogin" element={<AdminLogin />} />
              <Route path="/adminregister" element={<AdminRegister />} />
              <Route path="/admin-accountinfo" element={<AdminAccountInfo />} />
              <Route path="/enable-2fa" element={<Enable2FA />} />
              <Route path="/login-option" element={<LoginOptions />} />
              <Route path="/verify" element={<VerifyOtp />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path={"/checkout"} element={<Checkout />} />
              <Route path={"/payment"} element={<Payment />} />
              <Route path={"/stafforder"} element={<S_Order />} />
              <Route path={"/loading"} element={<Loading />} />
              <Route path={"/successfulorder"} element={<Sorder />} />
              <Route path={"/staffdashboard"} element={<SDashboard />} />
              <Route path={"/ordersummary"} element={<OrderSummary />} />
              <Route path={"/customerorder"} element={<C_Order />} />
              <Route path={"/customerorderdetail/:id"} element={<C_OrderDetails />} />
              <Route path={"/stafforderdetail/:id"} element={<S_OrderDetails />} />
              <Route path={"/giftreward/:id"} element={<GiftReward />} />
              <Route path={"/applyfulfilmentstaff"} element={<AddFulfilmentStaff />} />
              <Route path="/admin/warehouses" element={<AdminWarehouse />} />
              <Route path="/application/:id" element={<ApplicationStatus />} />
              <Route path={"/jobapplicationdetail/:id"} element={<JobApplicationDetail />} />
              <Route path={"/jobapplication"} element={<JobApplicationsPage />} />
              <Route path={"/applydeliveryagent"} element={<AddDeliveryAgent />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/users2" element={<UsersPage2 />} />
              <Route path="/productdetail/:id" element={<ProductDetail />} />
              <Route path="/staff" element={<StaffsPage />} />
              <Route path="/forget-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Song Hui */}
              <Route path={"/addproduct"} element={<AddProduct />} />
              <Route path="/addcategory" element={<AddCategory />} />
              <Route path={"/product"} element={<Products setCartCount={setCartCount} />} />
              <Route path="/category" element={<Category />} />
              <Route path="/editcategory/:id" element={<Editcategory />} />
              <Route path="/importstock" element={<ImportStock />} />
              <Route path="/editstocks/:productId" element={<EditStock />} />
              <Route path="/view3dmodel/:id" element={<View3DModel />} />
              <Route path="/compareshoe" element={<Compare />} />
              <Route path={"/fulfilmentstaffdashboard"} element={<S_FulfilmentStaffDashboard />} />
              <Route path={"/deliveryagentdashboard"} element={<S_DeliveryAgentDashboard />} />
              <Route path="/manageorder" element={<S_ManageOrder />} />
              <Route path="/managedelivery" element={<S_ManageDelivery />} />
            </Routes>
          </Container>

          {/* Cart Sidebar */}
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} setCartCount={setCartCount} />
            
        </ThemeProvider>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
