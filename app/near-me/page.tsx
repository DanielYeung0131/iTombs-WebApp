// app/admin/near-me/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  InfoWindow,
} from "@react-google-maps/api";
import { useRouter } from "next/navigation";

// Define types for our data structures
interface User {
  id: number;
  name: string;
  address: string;
  has_icon: boolean;
  lat: number;
  lng: number;
  distance?: number;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  paragraph: string;
  time: string;
  likes: number;
  has_image: boolean;
}

interface Location {
  lat: number;
  lng: number;
}

const libraries: "places"[] = ["places"];
const Maps_API_KEY = "AIzaSyAmES7aHFgT4qAgG1wDOK1GO7IPM1rMPuA";

// Haversine formula to calculate distance between two points on Earth
const calculateDistance = (loc1: Location, loc2: Location) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function NearMePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: Maps_API_KEY,
    libraries,
  });

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setError(
            "Could not get your location. Please enable location services."
          );
          // Fallback to a default location if user denies permission
          setCurrentLocation({ lat: 34.0522, lng: -118.2437 }); // Downtown LA
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setCurrentLocation({ lat: 34.0522, lng: -118.2437 });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/near-me");
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();

        if (currentLocation) {
          const usersWithDistance = data.users.map((user: User) => ({
            ...user,
            distance: calculateDistance(currentLocation, {
              lat: user.lat,
              lng: user.lng,
            }),
          }));
          // Sort users by distance
          usersWithDistance.sort(
            (a: User, b: User) =>
              (a.distance ?? Infinity) - (b.distance ?? Infinity)
          );
          setUsers(usersWithDistance);
        } else {
          setUsers(data.users);
        }

        setAllPosts(data.posts);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentLocation) {
      fetchData();
    }
  }, [currentLocation]);

  useEffect(() => {
    // Filter posts based on the sorted list of users
    if (users.length > 0 && allPosts.length > 0) {
      const userIds = users.map((user) => user.id);
      const filteredPosts = allPosts.filter((post) =>
        userIds.includes(post.user_id)
      );
      setPosts(filteredPosts);
    }
  }, [users, allPosts]);

  const mapCenter = useMemo(
    () => currentLocation || { lat: 34.0522, lng: -118.2437 },
    [currentLocation]
  );

  const getUserIconUrl = (userId: number, hasIcon: boolean) => {
    return hasIcon
      ? `/api/admin/users/icon?userId=${userId}`
      : "/placeholder-icon.jpg";
  };

  const getPostImageUrl = (postId: number, hasImage: boolean) => {
    return hasImage
      ? `/api/admin/posts/images?postId=${postId}`
      : "/placeholder-icon.jpg";
  };

  if (loadError)
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Maps Error</h2>
          <p className="text-gray-600">
            Error loading maps. Please check your API key and internet
            connection.
          </p>
        </div>
      </div>
    );

  if (!isLoaded || isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Loading iTombs
          </h2>
          <p className="text-gray-500">Finding people near you...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📍</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  iTombs Near Me
                </h1>
                <p className="text-sm text-gray-500">
                  Discover people and stories around you
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">
                  {users.length} people nearby
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 mb-8 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="text-red-500 text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800">Location Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Map Section */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
            <div className="h-96 md:h-[600px] w-full relative">
              <GoogleMap
                mapContainerClassName="w-full h-full rounded-3xl"
                center={mapCenter}
                zoom={11}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  styles: [
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
                    },
                    {
                      featureType: "landscape",
                      elementType: "geometry",
                      stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
                    },
                  ],
                }}
              >
                {/* Enhanced marker for current location */}
                {currentLocation && (
                  <MarkerF
                    position={currentLocation}
                    title="Your Location"
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: "#3B82F6",
                      fillOpacity: 1,
                      strokeWeight: 3,
                      strokeColor: "white",
                    }}
                  />
                )}

                {/* Enhanced markers for each user */}
                {users.map((user) => (
                  <MarkerF
                    key={user.id}
                    position={{ lat: user.lat, lng: user.lng }}
                    title={user.name}
                    onClick={() => setSelectedUser(user)}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: "#8B5CF6",
                      fillOpacity: 0.9,
                      strokeWeight: 2,
                      strokeColor: "white",
                    }}
                  />
                ))}

                {selectedUser && (
                  <InfoWindow
                    position={{ lat: selectedUser.lat, lng: selectedUser.lng }}
                    onCloseClick={() => setSelectedUser(null)}
                  >
                    <div className="p-4 text-center max-w-xs">
                      <div className="mb-3">
                        <img
                          src={getUserIconUrl(
                            selectedUser.id,
                            selectedUser.has_icon
                          )}
                          alt={selectedUser.name}
                          className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-white shadow-lg"
                        />
                        <h3 className="font-bold text-gray-800">
                          {selectedUser.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedUser.address}
                        </p>
                        {selectedUser.distance !== undefined && (
                          <p className="text-sm font-medium text-blue-600 mt-1">
                            {selectedUser.distance.toFixed(2)} km away
                          </p>
                        )}
                      </div>
                      <button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={() =>
                          router.push(`/guest?user=${selectedUser.id}`)
                        }
                      >
                        View Profile
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </div>
        </div>

        {/* Enhanced List Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Nearby Profiles & Stories
              </h2>
              <p className="text-gray-600">
                Connect with people and discover their latest posts
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Sorted by distance
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Enhanced User Info */}
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <img
                      src={getUserIconUrl(user.id, user.has_icon)}
                      alt={user.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">{user.address}</p>
                    {user.distance !== undefined && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">📍</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {user.distance.toFixed(2)} km away
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced User's Posts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-700">Recent Posts</h4>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {posts.filter((post) => post.user_id === user.id).length}{" "}
                      posts
                    </span>
                  </div>

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {posts
                      .filter((post) => post.user_id === user.id)
                      .slice(0, 3)
                      .map((post) => (
                        <div
                          key={post.id}
                          className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                        >
                          {post.has_image && (
                            <img
                              src={getPostImageUrl(post.id, post.has_image)}
                              alt={post.title}
                              className="w-full h-32 object-cover rounded-xl mb-3 shadow-md"
                            />
                          )}
                          <h5 className="font-bold text-gray-800 mb-2">
                            {post.title}
                          </h5>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                            {post.paragraph}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                              {new Date(post.time).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span>❤️</span>
                              <span>{post.likes}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    {posts.filter((post) => post.user_id === user.id).length ===
                      0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-sm">No posts yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => router.push(`/guest?user=${user.id}`)}
                >
                  Visit Full Profile
                </button>
              </div>
            ))}
          </div>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No one nearby
              </h3>
              <p className="text-gray-500">
                Try expanding your search area or check back later
              </p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
