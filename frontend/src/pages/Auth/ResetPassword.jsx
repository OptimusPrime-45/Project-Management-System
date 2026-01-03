import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Simple password strength check
    const strength = formData.password.length;
    setPasswordStrength(strength);
  }, [formData.password]);

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError("Both password fields are required.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError("");
    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-foreground" />
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Enter your new password below.
          </p>
        </div>
        {isSuccess ? (
          <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-center">
            <CheckCircle className="mx-auto h-10 w-10 mb-2" />
            <p className="text-sm font-medium">
              Password reset successful! Redirecting to login...
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Password Input */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  New Password
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors"
                  placeholder="Enter new password"
                />

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded transition-colors ${
                            passwordStrength >= level * 3
                              ? passwordStrength >= 12
                                ? "bg-success"
                                : passwordStrength >= 8
                                ? "bg-accent"
                                : passwordStrength >= 6
                                ? "bg-warning"
                                : "bg-error"
                              : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength:{" "}
                      {passwordStrength >= 12
                        ? "Strong"
                        : passwordStrength >= 8
                        ? "Good"
                        : passwordStrength >= 6
                        ? "Fair"
                        : "Weak"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm New Password
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm transition-colors"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            {error && (
              <div
                className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg relative flex items-center gap-2"
                role="alert"
              >
                <AlertCircle size={18} />
                <span className="block sm:inline text-sm">{error}</span>
              </div>
            )}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Resetting...
                  </span>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
