import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";

const SuperAdminRoute = () => {
  const { user, loading } = useAuth();
  const { profile, fetchProfile, userLoading } = useUser();

  const hasPrivilege = user?.isSuperAdmin || profile?.isSuperAdmin;

  useEffect(() => {
    if (!profile && !userLoading) {
      fetchProfile();
    }
  }, [fetchProfile, profile, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking permissions...
      </div>
    );
  }

  if (!hasPrivilege) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
