import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const UpdateProfile = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle"); // idle | checking | available | taken | error
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/users/current-user");
        const userData = response.data.data;
        setUser(userData);
        setUsername(userData.username || "");
      } catch (err) {
        setError("Failed to fetch user data.");
      }
    };
    fetchUser();
  }, []);

  // Debounced username availability check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !user) {
      setUsernameStatus("idle");
      return;
    }

    // if unchanged, mark available
    if (trimmed === (user.username || "").toLowerCase()) {
      setUsernameStatus("available");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        await api.get(`/users/c/${trimmed}`);
        // found someone else -> taken
        setUsernameStatus("taken");
      } catch (err) {
        if (err.response?.status === 404) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("error");
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (usernameStatus === "taken") {
      setLoading(false);
      setError("Username already taken. Please choose another.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("channelName", user.channelName || "");
    formData.append("fullName", user.fullName || "");
    if (removeCover) {
      formData.append("removeCover", "true");
    }

    if (avatar) {
      formData.append("avatar", avatar);
    }
    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      await api.patch("/users/update-account", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred during profile update."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Update Your Profile
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-200"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {usernameStatus === "checking" && (
                <p className="mt-1 text-xs text-gray-400">
                  Checking availability…
                </p>
              )}
              {usernameStatus === "available" && (
                <p className="mt-1 text-xs text-green-400">
                  Username is available
                </p>
              )}
              {usernameStatus === "taken" && (
                <p className="mt-1 text-xs text-red-400">
                  Username already taken
                </p>
              )}
              {usernameStatus === "error" && (
                <p className="mt-1 text-xs text-yellow-400">
                  Could not verify username. Try again.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-200">
                Avatar
              </label>
              <div className="mt-2 flex items-center gap-4">
                <span className="inline-flex h-14 w-14 rounded-full overflow-hidden bg-gray-800 ring-2 ring-gray-600">
                  <img
                    src={
                      avatar
                        ? URL.createObjectURL(avatar)
                        : user.avatar?.url ||
                          user.avatar ||
                          "/default-avatar.png"
                    }
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="bg-gray-800 text-gray-200 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200">
                Cover Image
              </label>
              <div className="mt-2 space-y-3">
                {(coverImage || (user.coverImage && !removeCover)) && (
                  <div className="rounded-lg overflow-hidden border border-gray-700">
                    <img
                      src={
                        coverImage
                          ? URL.createObjectURL(coverImage)
                          : user.coverImage?.url || user.coverImage
                      }
                      alt="Cover preview"
                      className="w-full h-28 object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setCoverImage(e.target.files[0]);
                      setRemoveCover(false);
                    }}
                    className="bg-gray-800 text-gray-200 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setRemoveCover(true);
                    }}
                    className="px-3 py-2 text-sm font-medium rounded-md border border-red-500 text-red-300 hover:bg-red-500/10"
                  >
                    Remove cover
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                loading ||
                usernameStatus === "taken" ||
                usernameStatus === "checking"
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading
                ? "Updating..."
                : usernameStatus === "checking"
                ? "Checking username..."
                : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
