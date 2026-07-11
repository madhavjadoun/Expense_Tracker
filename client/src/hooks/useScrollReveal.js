import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollReveal — attaches a minimal GSAP ScrollTrigger reveal to a ref.
 *
 * Animation philosophy (premium, not flashy):
 *   · Only fade-in + 24px upward translate — nothing rotates, scales, or shears
 *   · 0.75s ease-out duration — confident, not sluggish
 *   · start: "top 88%" — element starts revealing just before it's fully visible
 *   · once: true — reveal happens exactly once, no re-trigger on scroll-up
 *
 * @param {object} options
 * @param {number} options.y        — vertical offset before reveal (default 24)
 * @param {number} options.delay    — stagger delay in seconds (default 0)
 * @param {number} options.duration — animation duration in seconds (default 0.75)
 */
export function useScrollReveal({ y = 24, delay = 0, duration = 0.75 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [y, delay, duration]);

  return ref;
}

/**
 * useStaggerReveal — reveals a list of children with a stagger offset.
 *
 * @param {string} childSelector — CSS selector for the children to stagger (e.g. ".card")
 * @param {number} stagger       — delay between each child in seconds (default 0.10)
 */
export function useStaggerReveal({ childSelector = "*", stagger = 0.1, y = 20 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const targets = container.querySelectorAll(childSelector);
    if (!targets.length) return;

    gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger,
        scrollTrigger: {
          trigger: container,
          start: "top 86%",
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === container)
        .forEach((st) => st.kill());
    };
  }, [childSelector, stagger, y]);

  return ref;
}
