import React from "react";

const PageTransition = ({ children, className = "" }) => {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{
        animation: "fadeInUp 0.3s ease-out forwards",
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
