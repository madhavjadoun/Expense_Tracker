import Tilt from "react-parallax-tilt";
import { motion as Motion } from "framer-motion";

export default function GlassCard({
  children,
  className = "",
  tilt = false,
}) {
  const content = (
    <Motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`glass glow rounded-2xl ${className}`}
    >
      {children}
    </Motion.div>
  );

  if (!tilt) return content;

  return (
    <Tilt
      glareEnable
      glareMaxOpacity={0.12}
      scale={1.005}
      tiltMaxAngleX={4}
      tiltMaxAngleY={4}
      className="rounded-2xl"
    >
      {content}
    </Tilt>
  );
}

