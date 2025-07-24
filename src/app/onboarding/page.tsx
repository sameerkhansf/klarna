import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="max-w-lg mx-auto pt-8 pb-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
      <OnboardingForm />
    </main>
  );
}
