"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const LoginPage = () => {
  const user = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      window.location.href = "/settlements";
    }
  }, [user]);

  if (!mounted) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Klara
          </h1>
          <p className="text-lg text-gray-600">
            Your friendly claims assistant
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#0066ff",
                    brandAccent: "#0052cc",
                    brandButtonText: "white",
                    defaultButtonBackground: "#0066ff",
                    defaultButtonBackgroundHover: "#0052cc",
                  },
                  space: {
                    buttonPadding: "12px 24px",
                    inputPadding: "12px 16px",
                  },
                  radii: {
                    borderRadiusButton: "6px",
                    inputBorderRadius: "6px",
                  },
                },
              },
            }}
            providers={["google"]}
            socialLayout="horizontal"
            theme="default"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
