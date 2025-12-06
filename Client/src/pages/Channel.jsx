import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";

const Channel = () => {
  const { username } = useParams();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState(null);
  const [ownerId, setOwnerId] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchChannelData();
  }, [username, user]);

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

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      const channelResponse = await api.get(`/users/c/${username}`);
      const channelData = channelResponse.data.data;
      setChannel(channelData);
      setOwnerId(channelData._id);

      if (channelData?._id) {
        const videosResponse = await api.get("/videos", {
          params: { userId: channelData._id },
        });
        setVideos(videosResponse.data.data.docs || []);
      }

      const token = localStorage.getItem("accessToken");
      if (token && channelData?._id) {
        try {
          const subscribersResponse = await api.get(
            `/subscriptions/c/${channelData._id}`
          );
          setSubscribersCount(subscribersResponse.data.data.length || 0);
        } catch (err) {
          setSubscribersCount(0);
        }

        if (user) {
          const subResponse = await api.get(`/subscriptions/u/${user._id}`);
          const subscribed = subResponse.data.data.some(
            (sub) => sub.subscribedChannel._id === channelData._id
          );
          setIsSubscribed(subscribed);
        }
      } else {
        setSubscribersCount(channelData?.subscribersCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch channel data", error);
      setChannel(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (!ownerId) return;
      await api.post(`/subscriptions/c/${ownerId}`);
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

  if (!channel) {
    return <div className="text-center py-10">Channel not found</div>;
  }

  const isOwner = user && ownerId && user._id === ownerId;

  if (!channel.channelName) {
    return (
      <div className="text-center py-10 text-gray-300">
        <p className="mb-4">This channel is not set up yet.</p>
        {isOwner && (
          <p className="text-blue-400">
            Please add a channel name to make your channel visible (Update
            Profile).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Channel Header */}
      <div className="relative mb-12 overflow-hidden rounded-2xl border border-slate-800/70 bg-linear-to-b from-slate-900/90 via-slate-950/90 to-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="relative h-52 sm:h-60 lg:h-72">
          <img
            src={
              channel.coverImage?.url ||
              channel.coverImage ||
              "/default-cover.jpg"
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/30 to-transparent" />
          <img
            src={channel.avatar?.url || channel.avatar || "/default-avatar.png"}
            alt={channel.fullName}
            className="absolute -bottom-10 left-6 w-24 h-24 rounded-full border-4 border-slate-950 shadow-[0_12px_30px_rgba(0,0,0,0.45)] object-cover"
          />
        </div>

        <div className="pt-14 px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">
                {channel.fullName}
              </h1>
              <p className="text-slate-300">@{channel.username}</p>
              <p className="text-slate-400">{subscribersCount} subscribers</p>
            </div>

            {user && ownerId && user._id !== ownerId && (
              <button
                onClick={handleSubscribe}
                className={`px-5 py-2 rounded-lg font-semibold shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-colors ${
                  isSubscribed
                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div
            key={video._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <img
              src={video.thumbnail?.url}
              alt={video.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {video.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {video.views} views •{" "}
                {new Date(video.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {video.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">
            No videos uploaded yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default Channel;
