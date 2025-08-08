import React, { useEffect, useState } from "react";
import http from "../http"; // Import your custom http instance
import { jwtDecode } from "jwt-decode"; // ✅ Correct way
import "../css/S_Users.css";
const StaffsPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [user, setUser] = useState(null); // Store user data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Retrieve token
        const decoded = jwtDecode(token);
        setUser(decoded)
        const response = await http.get("/api/admin/staffs", { // Use relative URL
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data);
        setUsers(response.data);
      } catch (err) {
        setError(err.response ? err.response.data : "An error occurred.");
      }
    };
    fetchUsers();
  }, []);
  const handleDeleteClick = (userId) => {
    setSelectedUserId(userId);
    setShowDeleteModal(true);
  };
  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await http.delete(`/api/admin/staffs/${selectedUserId}`, { // Use relative URL
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== selectedUserId));
      setDeleteMessage("Staff deleted successfully.");
    } catch (error) {
      console.log(error);
      setDeleteMessage("Failed to delete user. Please try again.");
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
  };
  console.log(user)
  if (!user || user.role !== "Admin") {
    return <h1 style={{width:"100vw",marginTop:"50vh", textAlign:"center"}}>You are not authorized to view this page.</h1>;
  }
  return (
    <div className="users-container">
      <h2>Staffs List</h2>
      {error && <p className="error-message">{error}</p>}
      {deleteMessage && <p className="delete-message">{deleteMessage}</p>}
      {users.length > 0 ? (
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No staffs to display.</p>
      )}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this staff?</h3>
            <button className="confirm-button" onClick={handleConfirmDelete}>
              Confirm
            </button>
            <button
              className="cancel-button"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffsPage;