import { useEffect, useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Channel from "./pages/Channel";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UpdateProfile from "./pages/UpdateProfile";
import Upload from "./pages/Upload";
import Watch from "./pages/Watch";
import api from "./utils/api";

const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

const clearAuth = async (navigate) => {
  try {
    await api.post("/users/logout");
  } catch (err) {
    // ignore
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  navigate("/login", { replace: true });
};

const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    return () =>
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
  }, []);

  useEffect(() => {
    const now = Date.now();
    const remaining = IDLE_LIMIT_MS - (now - lastActivity);
    if (remaining <= 0) {
      clearAuth(navigate);
      return;
    }
    const timer = setTimeout(() => clearAuth(navigate), remaining);
    return () => clearTimeout(timer);
  }, [lastActivity, navigate]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        }`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone auth pages - no header/sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main app with header and sidebar */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
