"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  isCurrency = false,
  isScore = false,
}: {
  value: number;
  direction?: "up" | "down";
  className?: string;
  delay?: number; // delay in s
  isCurrency?: boolean;
  isScore?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    isInView &&
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        let formatted = Intl.NumberFormat("en-US").format(latest);
        if (isScore) {
           formatted = Number(latest).toFixed(2);
        } else if (isCurrency) {
           formatted = "$" + Number(latest).toFixed(2);
        } else {
           formatted = Math.round(latest).toString();
        }
        ref.current.textContent = formatted;
      }
    });
  }, [springValue, isCurrency, isScore]);

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-foreground tracking-wider",
        className,
      )}
      ref={ref}
    />
  );
}
