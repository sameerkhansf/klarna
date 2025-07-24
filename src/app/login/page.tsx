"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupabaseContext } from "../ClientRoot";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { toast } from "@/components/ui/sonner";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.",
  },
];

const heroImageSrc =
  "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80";

const LoginPage = () => {
  const supabase = useContext(SupabaseContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      router.push("/settlements");
    }
  }, [user, router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message || "Failed to sign in.");
    } else {
      toast.success("Signed in successfully!");
      router.push("/settlements");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      toast.error(error.message || "Failed to sign in with Google.");
    } else {
      toast.success("Redirecting to Google sign in...");
    }
    setLoading(false);
  };

  const handleResetPassword = () => {
    toast("Password reset is not implemented yet.");
  };

  const handleCreateAccount = () => {
    toast("Account creation is not implemented yet.");
  };

  if (user) return null;

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        heroImageSrc={heroImageSrc}
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};

export default LoginPage;
