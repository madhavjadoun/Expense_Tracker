import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollProvider
 *
 * Wraps any page with Lenis inertia scrolling.
 * GSAP ticker drives the Lenis RAF loop — single rAF, no drift.
 * ScrollTrigger is updated on every Lenis scroll event so scrub
 * animations stay perfectly in sync with the inertia position.
 *
 * Settings tuned for parallax pages:
 *   duration 1.4   — longer tail gives the "floating" feel
 *   lerp 0.1       — slight resistance, deliberate movement
 *   easing         — easeOutExpo matches GSAP's power curves well
 */
export default function SmoothScrollProvider({ children, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.6,
      infinite: false,
    });

    // Keep ScrollTrigger in sync with Lenis virtual scroll position
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP ticker (single unified rAF)
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [enabled]);

  return children;
}
