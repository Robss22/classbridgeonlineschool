import Hero from "@/components/Hero";

export default function CoachingPage() {
  return (
    <>
      <Hero title="Coaching Program" subtitle="Boost your exam performance with expert guidance." />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-700 text-lg">
          Coaching offers personalized support to students preparing for their national or international exams.
          We focus on improving weak areas, timed practice, and strategic exam techniques.
        </p>
      </div>
    </>
  );
}
