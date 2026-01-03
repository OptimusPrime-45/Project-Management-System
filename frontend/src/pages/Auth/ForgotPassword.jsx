import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      await requestPasswordReset(email);
      setStatus("success");
      setMessage("Password reset link has been sent to your email.");
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
          "An error occurred while requesting password reset. Please try again."
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Enter your email address below and we'll send you a link to reset
            your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="relative">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors"
              placeholder="Enter your email address"
            />
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
          {status === "error" && (
            <div
              className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg relative flex items-center gap-2"
              role="alert"
            >
              <AlertCircle size={18} />
              <span className="block sm:inline text-sm">{message}</span>
            </div>
          )}
          {status === "success" && (
            <div
              className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg relative flex items-center gap-2"
              role="alert"
            >
              <CheckCircle size={18} />
              <span className="block sm:inline text-sm">{message}</span>
            </div>
          )}
        </form>
        <div className="text-sm text-center">
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary-hover transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
