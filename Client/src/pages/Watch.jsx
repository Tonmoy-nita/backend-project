import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";

const Watch = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("v");
  const [video, setVideo] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      checkAuth();
    }
  }, [videoId, user]);

  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const response = await api.get("/users/current-user");
      setUser(response.data.data);
    } catch (error) {
      setUser(null);
    }
  };

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/videos/${videoId}`);
      setVideo(response.data.data);

      // Fetch channel info
      const channelResponse = await api.get(
        `/users/profile/${response.data.data.owner}`
      );
      setChannel(channelResponse.data.data);

      // Fetch subscribers count
      const subscribersResponse = await api.get(
        `/subscriptions/c/${response.data.data.owner}`
      );
      setSubscribersCount(subscribersResponse.data.data.length);

      // Check if subscribed
      if (user) {
        const subResponse = await api.get(`/subscriptions/u/${user._id}`);
        const subscribed = subResponse.data.data.some(
          (sub) => sub.subscribedChannel._id === response.data.data.owner
        );
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error("Failed to fetch video", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await api.post(`/subscriptions/c/${channel._id}`);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount(
        isSubscribed ? subscribersCount - 1 : subscribersCount + 1
      );
    } catch (error) {
      console.error("Failed to toggle subscription", error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!video) {
    return <div className="text-center py-10">Video not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            <video
              src={video.videoFile?.url}
              controls
              className="w-full h-auto"
              poster={video.thumbnail?.url}
            />
          </div>

          {/* Video Info */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {video.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {video.views} views •{" "}
              {new Date(video.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {video.description}
            </p>
          </div>

          {/* Channel Info */}
          {channel && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={channel.avatar?.url || "/default-avatar.png"}
                  alt={channel.fullName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {channel.fullName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {subscribersCount} subscribers
                  </p>
                </div>
              </div>
              {user && user._id !== channel._id && (
                <button
                  onClick={handleSubscribe}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isSubscribed
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Related Videos or Comments */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
          {/* Add related videos here */}
          <p className="text-gray-600 dark:text-gray-400">
            Related videos will be shown here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Watch;
