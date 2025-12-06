import { Link } from "react-router-dom";

const ProfileDropdown = ({
  user,
  handleLogout,
  isOpen,
  setIsOpen,
  dropdownRef,
}) => {
  const avatarSrc = user.avatar?.url || user.avatar || "/default-avatar.png";
  const coverSrc =
    user.coverImage?.url || user.coverImage || "/default-cover.png";

  return (
    <>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
        >
          {/* User Info Section */}
          <div className="relative">
            <img
              src={coverSrc}
              alt="Cover"
              className="w-full h-24 object-cover"
            />
            <div className="absolute bottom-0 left-4 transform translate-y-1/2">
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover"
              />
            </div>
          </div>

          {/* User Details */}
          <div className="pt-12 pb-4 px-4">
            <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
              {user.fullName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{user.username}
            </p>
          </div>

          {/* Links */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <Link
              to={`/channel/${user.username}`}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Your Channel
            </Link>
            <Link
              to="/update-profile"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Update Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
