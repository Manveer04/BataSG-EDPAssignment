import { useNavigate } from "react-router-dom";
import "../css/LoginOption.css";  // Import the CSS file

const LoginOptions = () => {
  const navigate = useNavigate();

  return (
    
    <div className="login-options-page">
        <h1 style={{marginTop: "5%"}}>Choose your login</h1>
      <button
        className="login-button2"
        onClick={() => navigate("/login")}
      >
        Customer Login
      </button>
      <button
        className="staff-login-button"
        onClick={() => navigate("/stafflogin")}
      >
        Staff Login
      </button>
    </div>
  );
};

export default LoginOptions;
