import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Box, Typography, MenuItem, Select } from "@mui/material";
import http from "../http";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Chart } from "react-google-charts";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [orderCountData, setOrderCountData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [AssignedOrders, setAssignOrders] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [toPackCount, setToPackCount] = useState(0);
  const [pendingShipmentCount, setPendingShipmentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaff = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const role = decoded.role;
        const staffId = decoded.nameid;


        if (role === "FulfilmentStaff") {
          await http.get("/api/staff/auth");
          fetchOrders(token);
          fetchAssignedOrders(staffId, token);
        }
      } catch (error) {
        console.error("Authentication failed", error);
      }
    };
    fetchStaff();
  }, []);

  const fetchAssignedOrders = (staffId, token) => {
    http
      .get(`/FulfilmentStaff/${staffId}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Fetched Assigned Orders:", res.data);
        setAssignOrders(res.data);
        processAssignedOrders(res.data);
      })
      .catch((err) => {
        console.error("Error fetching assigned orders:", err);
      });
  };

  const processAssignedOrders = (orders) => {
    let toPack = 0;
    let pendingShipment = 0;

    orders.forEach((order) => {
      if (order.orderStatus === 0) { //Pending
        toPack += 1;
      } else if (order.orderStatus === 1) { // Shipped
        pendingShipment += 1;
      }
    });
    setToPackCount(toPack);
    setPendingShipmentCount(pendingShipment);
  };

  const fetchOrders = (token) => {
    http
      .get("/api/order/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Fetched Orders:", res.data);
        setOrders(res.data);
        extractAvailableYears(res.data);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
      });
  };

  const extractAvailableYears = (orders) => {
    const years = [...new Set(orders.map((order) => new Date(order.orderDate).getFullYear()))];
    setAvailableYears(years);
    if (years.length > 0) setYearFilter(years[0].toString()); // Ensure it's a string
  };

  useEffect(() => {
    if (orders.length > 0 && yearFilter) {
      const filtered = orders.filter((order) => {
        const orderYear = new Date(order.orderDate).getFullYear().toString();
        return orderYear === yearFilter;
      });
      console.log("Filtered Orders:", filtered);
      setFilteredOrders(filtered);
    }
  }, [yearFilter, orders]);

  useEffect(() => {
    if (filteredOrders.length > 0) {
      console.log("Processing data for charts...");
      processSalesData(filteredOrders);
      processOrderCountData(filteredOrders);
      processBestSellingProducts(filteredOrders);
      processOrderStatusData(filteredOrders);
    } else {
      console.warn("No orders available for the selected year:", yearFilter);
      setSalesData({});
      setOrderCountData([]);
      setProductSalesData([]);
      setOrderStatusData([]);
    }
  }, [filteredOrders, sortOrder]);

  const processSalesData = (orders) => {
    const monthlySales = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.orderDate);
      const monthName = orderDate.toLocaleString("default", { month: "long" });

      if (!monthlySales[monthName]) {
        monthlySales[monthName] = 0;
      }
      monthlySales[monthName] += order.totalAmount;
    });

    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const sortedMonths = monthOrder.filter((month) => monthlySales[month] !== undefined);

    setSalesData({
      labels: sortedMonths,
      datasets: [
        {
          label: `Monthly Sales ($) - ${yearFilter}`,
          data: sortedMonths.map((month) => monthlySales[month]),
          borderColor: "blue",
          backgroundColor: "rgba(0, 0, 255, 0.5)",
          fill: true,
        },
      ],
    });
  };

  const processOrderCountData = (orders) => {
    const monthlyOrders = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.orderDate);
      const monthIndex = orderDate.getMonth(); // 0 for Jan, 1 for Feb, ..., 11 for Dec
      const monthName = orderDate.toLocaleString("default", { month: "long" });

      if (!monthlyOrders[monthIndex]) {
        monthlyOrders[monthIndex] = { name: monthName, count: 0 };
      }
      monthlyOrders[monthIndex].count += 1;
    });

    // Sort months in correct calendar order (Jan -> Dec)
    const sortedMonths = Object.keys(monthlyOrders)
      .map((key) => ({
        monthIndex: parseInt(key),
        name: monthlyOrders[key].name,
        count: monthlyOrders[key].count,
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex); // Ensure correct order

    // Format data for Google Charts
    const chartData = [["Month", "Number of Orders"]];
    sortedMonths.forEach(({ name, count }) => {
      chartData.push([name, count]);
    });

    setOrderCountData(chartData);
  };

  const processBestSellingProducts = (orders) => {
    const productSales = {};

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (!productSales[item.productName]) {
          productSales[item.productName] = 0;
        }
        productSales[item.productName] += item.quantity;
      });
    });

    let sortedProducts = Object.entries(productSales).map(([name, quantity]) => [name, quantity]);

    sortedProducts.sort((a, b) => (sortOrder === "desc" ? b[1] - a[1] : a[1] - b[1]));

    const chartData = [["Product", "Quantity Sold"], ...sortedProducts];
    setProductSalesData(chartData);
  };

  const processOrderStatusData = (orders) => {
    const statusCounts = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };

    orders.forEach((order) => {
      switch (order.orderStatus) {
        case 0:
          statusCounts.Processing += 1;
          break;
        case 1:
          statusCounts.Shipped += 1;
          break;
        case 2:
          statusCounts.Delivered += 1;
          break;
        case 3:
          statusCounts.Cancelled += 1;
          break;
        default:
          break;
      }
    });

    const chartData = [
      ["Order Status", "Number of Orders"],
      ["Processing", statusCounts.Processing],
      ["Shipped", statusCounts.Shipped],
      ["Delivered", statusCounts.Delivered],
      ["Cancelled", statusCounts.Cancelled],
    ];

    setOrderStatusData(chartData);
  };

  return (
    <Box sx={{ marginTop: "90px", marginLeft: "0%", width: "98.5vw" }}>
      {/* Task Cards */}
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "black", marginBottom: "40px", marginX: 10 }}>Task List</Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-evenly",
          gap: "20px",
          mb: 4,
        }}
      >
        {/* Example Task Card */}
        <Box
          onClick={() => navigate("/unpaid-orders")}
          sx={{
            flex: "0 1 200px",
            p: 2,
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            backgroundColor: "#fff",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Box sx={{ fontSize: "2rem", color: "#1976d2" }}>🛒</Box>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.2rem", color: "#1976d2" }}>{toPackCount}</Typography>
          <Typography variant="body1">To Pack</Typography>
          <Box sx={{ color: "#414B56" }}>→</Box>
        </Box>

        {/* Repeat for other Task Cards */}
        <Box
          onClick={() => navigate("/pending-pack")}
          sx={{
            flex: "0 1 200px",
            p: 2,
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            textAlign: "center",
            backgroundColor: "#fff",
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Box sx={{ fontSize: "2rem", color: "#1976d2" }}>📦</Box>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.2rem", color: "#1976d2" }}>{pendingShipmentCount}</Typography>
          <Typography variant="body1">Pending S</Typography>
          <Box sx={{ color: "#414B56" }}>→</Box>
        </Box>

        {/* Add more cards for 'To Approve Cancellation' and 'Pending Return/Refund' as needed */}
      </Box>
      {/* Existing Dashboard Content */}
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#414B56", mt: 10 }}>Dashboard</Typography>

        {availableYears.length > 0 && (
          <Box sx={{ marginBottom: "20px", marginLeft: "70%" }}>
            <Typography variant="h6">Filter by Year</Typography>
            <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} sx={{ width: "150px", marginLeft: "10px" }}>
              {availableYears.map((year) => (
                <MenuItem key={year} value={year.toString()}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
        <Box sx={{ padding: "10px", borderRadius: "10px", width: "91%", marginLeft: "4%" }}>
          <Typography variant="h5" sx={{ marginTop: "-30px", position: "absolute", marginLeft: "270px", fontWeight: "bold", color: "#414B56" }}>Overall Sales</Typography>
          <Typography variant="h5" sx={{ marginTop: "-20px", position: "absolute", marginLeft: "900px", fontWeight: "bold", color: "#414B56" }}>Order Status</Typography>
          <Box sx={{ display: "flex", width: "100%" }}>
            {/* Overall Sales Line Chart */}
            {salesData.labels && (
              <Box sx={{ padding: "20px", borderRadius: "8px", width: "50%" }}>
                <Line
                  data={salesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: "top" },
                    },
                  }}
                  style={{ height: "400px", width: "100%" }}
                />
              </Box>
            )}
            {/* Order Status Pie Chart */}
            {orderStatusData.length > 1 && (
              <Box sx={{ padding: "20px", borderRadius: "8px", width: "50%" }}>
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="400px"
                  data={orderStatusData}
                  options={{
                    is3D: true,
                    chartArea: { width: "80%" },
                    legend: { position: "right" },
                  }}
                />
              </Box>
            )}
          </Box>
          {/* Number of Orders Column Chart */}
          <Typography variant="h5" sx={{ marginTop: "30px", marginBottom: "10px", fontWeight: "bold", color: "#414B56" }}>Number of Orders</Typography>
          {orderCountData.length > 1 && (
            <Box sx={{ padding: "20px", borderRadius: "8px", marginTop: "-20px" }}>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="400px"
                data={orderCountData}
                options={{
                  vAxis: { title: "Number of Orders", textStyle: { fontSize: 14 } },
                  legend: { position: "top" },
                  chartArea: { width: "80%" },
                }}
              />
            </Box>
          )}

          {/* Most Popular Product Bar Chart */}
          <Typography variant="h5" sx={{ marginTop: "30px", marginBottom: "10px", fontWeight: "bold", color: "#414B56" }}>Most Popular Product</Typography>
          {productSalesData.length > 1 && (
            <Box sx={{ padding: "20px", borderRadius: "8px", marginTop: "-30px" }}>
              <Chart
                chartType="BarChart"
                width="100%"
                height="400px"
                data={productSalesData}
                options={{
                  hAxis: { title: "Quantity Sold", textStyle: { fontSize: 14 } },
                  vAxis: { title: "Product Name", textStyle: { fontSize: 14 } },
                  chartArea: { width: "70%" },
                  bars: "horizontal",
                  colors: ["#F4A261"], // Orange Color
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SDashboard;