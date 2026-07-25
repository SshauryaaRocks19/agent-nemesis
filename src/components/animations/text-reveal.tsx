"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Use a context for easy cleanup
    let ctx = gsap.context(() => {
      gsap.to(el, {
        y: "0%",
        duration: 1.2,
        ease: "power4.out",
        delay,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          toggleActions: "play none none none"
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={containerRef} className={cn("split-parent", className)}>
      <div ref={textRef} className="split-child w-full h-full">
        {children}
      </div>
    </div>
  );
}
