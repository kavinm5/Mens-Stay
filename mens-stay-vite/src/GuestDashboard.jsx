import { useNavigate } from "react-router-dom";
import "./styles/GuestDashboard.css";

function GuestDashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="guest-container">
      <div className="guest-card">
        <h2>Guest Dashboard</h2>
        <p>Welcome to Mens Stay 👋</p>

        <button className="guest-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default GuestDashboard;
