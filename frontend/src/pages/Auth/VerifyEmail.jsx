import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

const VerifyEmail = () => {
  const { verifyEmail } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your email...");

  // Ref to prevent double-firing in React 18 Strict Mode
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // 1. Prevent running if no token or already called
    if (!token || hasCalledRef.current) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }
    hasCalledRef.current = true;

    // 2. Async function to verify email
    const verifyToken = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been successfully verified!");
        navigate("/login");
      } catch (error) {
        setStatus("error");
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          setMessage(error.response.data.message);
        } else {
          setMessage(
            "An error occurred while verifying your email. Please try again."
          );
        }
      }
    };
    verifyToken();
  }, [token, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center">
          {status === "verifying" && (
            <Loader2 className="mx-auto h-12 w-12 text-foreground animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
        </div>
        <p className="mt-4 text-center text-sm text-foreground">{message}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
