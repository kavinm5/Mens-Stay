import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import OwnerDashboard from "./OwnerDashboard";
import GuestDashboard from "./GuestDashboard";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guest"
        element={
          <ProtectedRoute role="guest">
            <GuestDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
