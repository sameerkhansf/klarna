import React from "react";
import { useUser } from "@/hooks/useUser";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
};
