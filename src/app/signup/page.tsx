"use client";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { SignUpPage, Testimonial } from "@/components/ui/sign-up";
import { SupabaseContext } from "../ClientRoot";
import { toast } from "@/components/ui/sonner";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export default function SignupPage() {
  const supabase = useContext(SupabaseContext) as SupabaseClient;
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) {
      toast.error(error.message || "Failed to sign up.");
      setError(error.message || "Failed to sign up.");
    } else {
      toast.success(
        "Account created! Please check your email to verify your account."
      );
      router.push("/onboarding");
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      toast.error(error.message || "Failed to sign up with Google.");
    } else {
      toast.success("Redirecting to Google sign up...");
    }
    setLoading(false);
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <SignUpPage
      heroImageSrc={heroImageSrc}
      testimonials={testimonials}
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      onSignIn={handleSignIn}
      error={error}
      email={form.email}
      password={form.password}
      confirm={form.confirm}
      onChange={handleChange}
      loading={loading}
    />
  );
}
