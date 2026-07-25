"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useSpring } from "framer-motion";

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  disabled?: boolean;
  springOptions?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

export function Magnet({ 
  children, 
  padding = 100, 
  disabled = false, 
  springOptions = { stiffness: 269, damping: 25, mass: 0.5 } 
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useSpring(0, springOptions);
  const y = useSpring(0, springOptions);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current || disabled) return;
      
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;

      if (Math.abs(distX) < width / 2 + padding && Math.abs(distY) < height / 2 + padding) {
        setIsHovered(true);
        x.set(distX * 0.3);
        y.set(distY * 0.3);
      } else {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [padding, disabled, x, y]);

  return (
    <motion.div ref={ref} style={{ x, y }} className="inline-block relative z-20">
      {children}
    </motion.div>
  );
}
