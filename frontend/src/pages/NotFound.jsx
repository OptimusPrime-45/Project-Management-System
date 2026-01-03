// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      {/* Image Section */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/748/748122.png"
        alt="404 Illustration"
        className="w-64 h-64 mb-8 animate-bounce"
      />

      {/* Text Section */}
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Oops! Page Not Found</h2>
      <p className="text-center max-w-md mb-6">
        The page you’re looking for doesn’t exist or has been moved. Don’t
        worry, you can always go back to safety!
      </p>

      {/* Button Section */}
      <Link
        to="/"
        className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:bg-indigo-100 transition duration-300"
      >
        Go Back Home
      </Link>

      {/* Decorative Background */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-white opacity-10 blur-lg"></div>
    </div>
  );
};

export default NotFound;
