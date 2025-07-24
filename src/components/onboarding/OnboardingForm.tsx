"use client";

import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SupabaseContext } from "@/app/ClientRoot";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";

const steps = [
  "Name & Email",
  "Address",
  "Phone Number",
  "Payout Preference",
  "Finish",
];

export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = useContext(SupabaseContext);
  const methods = useForm({
    defaultValues: {
      first_name: "",
      middle_initial: "",
      last_name: "",
      // email: "", // Removed from form UI
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      phone_number: "",
      payout_preference: "",
      payout_identifier: "",
    },
    mode: "onTouched",
  });
  const control = methods.control;
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  // Pre-fill email from Supabase user if available
  useEffect(() => {
    async function fetchUser() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        // Store email in a ref or variable for upsert, but do not set in form
        setUserEmail(data.user.email);
      }
    }
    fetchUser();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => {
        router.push("/settlements");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [submitted, router]);

  const handleSubmit = async () => {
    console.log("[Onboarding] handleSubmit called");
    setSubmitting(true);
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.log("[Onboarding] Could not get user ID", userError);
        toast.error("Could not get user ID. Please log in again.");
        setSubmitting(false);
        return;
      }
      const values = methods.getValues();
      const upsertData = {
        id: userData.user.id,
        email: userEmail, // Use email from Supabase Auth, not from form
        first_name: values.first_name,
        middle_initial: values.middle_initial,
        last_name: values.last_name,
        address_line1: values.address_line1,
        address_line2: values.address_line2,
        city: values.city,
        state: values.state,
        zip_code: values.zip_code,
        phone_number: values.phone_number,
        payout_preference: values.payout_preference,
        payout_identifier: values.payout_identifier,
      };
      console.log("[Onboarding] Upserting profile:", upsertData);
      const { error } = await supabase
        .from("user_profiles")
        .upsert([upsertData], { onConflict: "id" });
      if (error) {
        console.log("[Onboarding] Failed to save profile:", error);
        toast.error("Failed to save profile: " + error.message);
        setSubmitting(false);
        return;
      }
      console.log("[Onboarding] Profile completed!");
      toast.success("Profile completed!");
      setSubmitted(true);
      setStep(steps.length - 1);
    } catch (e) {
      console.log("[Onboarding] Unexpected error:", e);
      toast.error("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...methods}>
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          {steps.map((label, idx) => (
            <div
              key={label}
              className={`h-2 flex-1 rounded-full ${
                idx <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Step {step + 1} of {steps.length}: {steps[step]}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 min-h-[200px] flex flex-col gap-4">
        {step === 0 && (
          <>
            <FormField
              control={control}
              name="first_name"
              rules={{ required: "First name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="middle_initial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Initial (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="M" maxLength={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="last_name"
              rules={{ required: "Last name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Email field removed from UI */}
          </>
        )}
        {step === 1 && (
          <>
            <FormField
              control={control}
              name="address_line1"
              rules={{ required: "Address Line 1 is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt, Suite, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="city"
              rules={{ required: "City is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="state"
              rules={{ required: "State is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="zip_code"
              rules={{ required: "ZIP Code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="ZIP Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {step === 2 && (
          <>
            <FormField
              control={control}
              name="phone_number"
              rules={{
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9\-\+\(\) ]{7,20}$/,
                  message: "Enter a valid phone number",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {step === 3 && (
          <>
            <FormField
              control={control}
              name="payout_preference"
              rules={{ required: "Payout preference is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout Preference</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="payout_identifier"
              rules={{ required: "This field is required" }}
              render={({ field }) => {
                const method = methods.watch("payout_preference");
                let label = "";
                let placeholder = "";
                if (method === "paypal") {
                  label = "PayPal Email";
                  placeholder = "your-paypal@email.com";
                } else if (method === "venmo") {
                  label = "Venmo Handle";
                  placeholder = "@yourvenmo";
                } else if (method === "check") {
                  label = "Mailing Address";
                  placeholder = "Enter your mailing address";
                } else {
                  label = "Payout Identifier";
                  placeholder = "Enter details";
                }
                return (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input placeholder={placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </>
        )}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center min-h-[150px]">
            {submitted ? (
              <>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  All done!
                </div>
                <div className="text-gray-700 mb-4">
                  Your profile is complete. You can now access all features.
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-2">
                  Ready to finish?
                </div>
                <div className="text-gray-600 mb-4">
                  Click below to complete your onboarding and save your profile.
                </div>
                <button
                  type="button"
                  className="px-6 py-2 rounded bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition"
                  onClick={handleSubmit}
                >
                  {submitting ? "Saving..." : "Finish"}
                </button>
              </>
            )}
          </div>
        )}
        {step !== 0 && step !== 1 && step !== 2 && step !== 3 && step !== 4 && (
          <div className="text-center text-gray-400">
            Step content placeholder
          </div>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting || submitted}
        >
          Back
        </button>
        {!submitted && (
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
            onClick={async () => {
              if (step === 0) {
                const valid = await methods.trigger([
                  "first_name",
                  "last_name",
                  // "email", // Removed from form UI
                ]);
                if (!valid) return;
              }
              if (step === 1) {
                const valid = await methods.trigger([
                  "address_line1",
                  "city",
                  "state",
                  "zip_code",
                ]);
                if (!valid) return;
              }
              if (step === 2) {
                const valid = await methods.trigger(["phone_number"]);
                if (!valid) return;
              }
              if (step === 3) {
                const valid = await methods.trigger([
                  "payout_preference",
                  "payout_identifier",
                ]);
                if (!valid) return;
              }
              setStep((s) => Math.min(steps.length - 1, s + 1));
            }}
            disabled={submitting || submitted}
          >
            {step === steps.length - 2 ? "Review" : "Next"}
          </button>
        )}
      </div>
    </Form>
  );
}
