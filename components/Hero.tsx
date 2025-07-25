"use client";

import Image from "next/image";

interface HeroProps {
  title: string;
  subtitle?: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg mb-10">
      <Image
        src="/images/hero_background.jpg"
        alt="Background"
        fill
        className="absolute inset-0 object-cover opacity-50"
        quality={80}
        priority
      />
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-4 text-white bg-black/30">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-md md:text-xl max-w-2xl">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
