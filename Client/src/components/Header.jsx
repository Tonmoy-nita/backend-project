import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import ProfileDropdown from "./ProfileDropdown";

const Header = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null); // Ensure user is logged out if no token
        return;
      }
      try {
        const response = await api.get("/users/current-user");
        setUser(response.data.data);
      } catch (error) {
        // If token is invalid, clear it and log out user
        localStorage.removeItem("accessToken");
        setUser(null);
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    checkAuth();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsDropdownOpen(false); // Close dropdown on logout
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-linear-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 border-b border-slate-800/70 ring-1 ring-slate-900/60 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-slate-100">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-slate-200 hover:bg-slate-800/70 hover:text-white md:hidden shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link to="/" className="flex items-center">
              <div className="text-red-600 text-2xl font-bold">▶ VideoTube</div>
            </Link>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-4 hidden md:flex"
          >
            <div className="flex w-full bg-linear-to-r from-gray-800 via-gray-700 to-gray-800 p-px rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-l-full bg-gray-900 text-gray-100 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-r-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:brightness-110 shadow-[0_6px_14px_rgba(0,0,0,0.3)]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/upload"
                  title="Add video/comment"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-sky-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Link>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-amber-400 hover:text-white"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m2 4a2 2 0 104 0"
                    />
                  </svg>
                </button>
                <div className="relative" ref={dropdownRef}>
                  <img
                    src={
                      user.avatar?.url || user.avatar || "/default-avatar.png"
                    }
                    alt="Avatar"
                    className="w-10 h-10 rounded-full cursor-pointer object-cover"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                  />
                  <ProfileDropdown
                    user={user}
                    handleLogout={handleLogout}
                    isOpen={isDropdownOpen}
                    setIsOpen={setIsDropdownOpen}
                    dropdownRef={dropdownRef}
                  />
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
