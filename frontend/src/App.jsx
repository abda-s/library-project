import { BrowserRouter, Link } from "react-router-dom"; // Removed unused Route, Routes, Navigate
import { useAuth } from "./context/AuthContext";
import './index.css';

// Components
import RoutesRender from "./components/RoutesRender"; // Import RoutesRender

function App() {
  const { user, logout, loading: authLoading } = useAuth(); // Renamed loading to authLoading for clarity

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading application...</div>;
  }

  return (
    <BrowserRouter>
      {/* RoutesRender will now handle all routing logic */}
      <RoutesRender />
    </BrowserRouter>
  );
}

export default App;
