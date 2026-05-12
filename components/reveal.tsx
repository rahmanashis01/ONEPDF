"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  id?: string;
};

/**
 * Fades + slides its children in from below when they enter the viewport.
 * Falls back to a static render when the user prefers reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
  id,
}: RevealProps) {
  const reduced = useReducedMotion();
  const Comp = motion[as];

  if (reduced) {
    return (
      <Comp className={className} id={id}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Comp>
  );
}

export default Reveal;
