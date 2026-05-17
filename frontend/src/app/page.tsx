import HeroSection from "@/components/sections/HeroSection";

export default function Home() {
  return (
    <div className="animate-fade-in flex flex-col justify-center w-full min-h-[calc(100vh-4rem)] py-10 lg:py-0">
      <HeroSection />
    </div>
  );
}
