'use client';

import { motion } from 'framer-motion';
import { PlaneTakeoff } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <PlaneTakeoff className="h-12 w-12 text-primary" />
      </motion.div>
      <p className="text-lg font-medium text-muted-foreground">
        Crafting your perfect itinerary...
      </p>
    </div>
  );
}