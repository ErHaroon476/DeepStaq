"use client";

import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
  };

  const { width, height } = sizeMap[size];

  return (
    <Image
      src="/deepstaq.jpg"
      alt="DeepStaq"
      width={width}
      height={height}
      className={`rounded-lg object-contain ${className ?? ""}`}
      priority
    />
  );
}
