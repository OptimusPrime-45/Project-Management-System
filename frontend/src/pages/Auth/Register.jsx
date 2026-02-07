import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { register as registerAPI } from "../../api/auth";

const Register = () => {
  const navigate = useNavigate();

  // State for form inputs
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  // Basic form validation
  const validateForm = () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("All fields are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions.");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      if (isSuperAdmin) {
        payload.isSuperAdmin = true;
      }

      const { data } = await registerAPI(payload);

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    const strengths = [
      { color: "bg-error", text: "Weak" },
      { color: "bg-warning", text: "Fair" },
      { color: "bg-accent", text: "Good" },
      { color: "bg-secondary", text: "Strong" },
    ];
    return strengths[passwordStrength - 1] || strengths[0];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <div
            className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg flex items-center gap-2"
            role="alert"
          >
            <CheckCircle size={18} />
            <span className="text-sm">
              Registration successful! Redirecting to login...
            </span>
          </div>
        )}

        {/* Form Section */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div
              className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg relative flex items-center gap-2"
              role="alert"
            >
              <AlertCircle size={18} />
              <span className="block sm:inline text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:z-10 sm:text-sm transition-colors"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

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
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
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
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded transition-colors ${
                          level <= passwordStrength
                            ? getPasswordStrengthInfo().color
                            : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Password strength: {getPasswordStrengthInfo().text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
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
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-border bg-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:z-10 sm:text-sm transition-colors"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {/* Super Admin Registration Toggle */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isSuperAdmin"
                checked={isSuperAdmin}
                onChange={(e) => setIsSuperAdmin(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-ring border-border rounded bg-input transition-colors"
              />
              <label htmlFor="isSuperAdmin" className="text-sm font-medium text-foreground">
                Register as Super Admin
              </label>
            </div>


          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-ring border-border rounded bg-input transition-colors"
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-foreground-secondary"
            >
              I agree to the{" "}
              <Link
                to="/terms"
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Terms and Conditions
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
