// src/components/ColorLoading.tsx
"use client";

import { motion } from "framer-motion";

export default function ColorLoading() {
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8"];

  return (
    <div className="flex items-center justify-center space-x-2">
      {colors.map((color, index) => (
        <motion.div
          key={index}
          initial={{ y: 0 }}
          animate={{
            y: [0, -10, 0],
            backgroundColor: color,
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 0.6,
              delay: index * 0.1,
            },
            backgroundColor: {
              repeat: Infinity,
              duration: 2.5,
              delay: index * 0.3,
              repeatType: "reverse",
            },
          }}
          className="w-3 h-8 rounded-full"
        />
      ))}
    </div>
  );
}
