import React from "react";

const colorPalette = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

const getColorFromString = (str) => {
  if (!str) return colorPalette[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
};

const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "??";
};

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-20 w-20 text-2xl",
};

const Avatar = ({
  src,
  alt,
  name,
  email,
  size = "md",
  className = "",
  showStatus = false,
  status = "offline", // online, offline, busy, away
}) => {
  const initials = getInitials(name, email);
  const bgColor = getColorFromString(name || email);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5",
    "2xl": "h-4 w-4",
  };

  const validSrc = src && !src.includes("placehold") && !src.startsWith("data:image") === false;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={`${sizeClass} rounded-full object-cover border-2 border-background`}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold border-2 border-background ${src ? "hidden" : "flex"}`}
        style={{ display: src ? "none" : "flex" }}
      >
        {initials}
      </div>
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full ring-2 ring-background`}
        />
      )}
    </div>
  );
};

// Avatar Group component for showing multiple avatars stacked
export const AvatarGroup = ({ users = [], max = 4, size = "sm" }) => {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, index) => (
        <Avatar
          key={user._id || index}
          src={user.avatar?.url}
          name={user.fullname || user.username}
          email={user.email}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium ring-2 ring-background`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;
