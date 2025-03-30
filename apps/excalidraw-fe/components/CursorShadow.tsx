"use client";

import { useEffect, useState } from "react";

export function CursorShadow() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get primary color RGB values for the gradient
    const root = document.documentElement;
    const primaryHsl = getComputedStyle(root).getPropertyValue('--primary').trim();
    const primaryRgb = hslToRgb(primaryHsl);
    
    // Set the --primary-rgb CSS variable
    root.style.setProperty('--primary-rgb', primaryRgb);

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible]);

  // Convert HSL to RGB
  function hslToRgb(hsl: string) {
    // Parse HSL values
    const [h, s, l] = hsl.split(' ').map(val => parseFloat(val));
    
    // Convert to 0-1 scale
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;
    
    // Algorithm to convert HSL to RGB
    let r, g, b;

    if (sNorm === 0) {
      r = g = b = lNorm; // achromatic
    } else {
      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      r = hueToRgb(p, q, hNorm + 1/3);
      g = hueToRgb(p, q, hNorm);
      b = hueToRgb(p, q, hNorm - 1/3);
    }

    // Convert to 0-255 scale
    return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
  }

  function hueToRgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  return (
    <div
      className="cursor-shadow"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
} 