// components/ScrollHint.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { FaHandPointer } from 'react-icons/fa';
import { motion, useInView } from 'framer-motion';

interface ScrollHintProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollHint: React.FC<ScrollHintProps> = ({ targetRef }) => {
  const [hasTriggeredAnimation, setHasTriggeredAnimation] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  const isInView = useInView(targetRef, { once: true, amount: 0.5 });

  useEffect(() => {
  

    if (isInView && !hasTriggeredAnimation) {
      console.log('ScrollHint: Sección en vista. Esperando 2 segundos para activar la animación...');
      // Establece el timeout para activar la animación después de 2 segundos
    
        console.log('ScrollHint: 2 segundos pasaron. Activando animación FaHandPointer.');
        setHasTriggeredAnimation(true);
        setShowIcon(true);
 
    }

  }, [isInView, hasTriggeredAnimation, targetRef]);


  const handVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: "-150%",
      opacity: 1,
      transition: {
        x: {
          repeat: 0,
          duration: 3,
          ease: "easeInOut",
        },
        opacity: {
          duration: 0.5,
          ease: "easeOut",
          delay: 0.2,
        },
      },
    },
  };

  const handleAnimationComplete = (definition: string) => {
    if (definition === 'visible') {
      console.log('ScrollHint: Animación de FaHandPointer COMPLETA. Ocultando icono.');
      setShowIcon(false);
    }
  };

  return (
    <div
      className="fixed bottom-1/4 left-0 right-0 h-20 pointer-events-none z-50 transform -translate-y-1/2 flex justify-center items-center block md:hidden lg:hidden xl:hidden 2xl:hidden"
    >
      {showIcon && (
        <motion.div
          className="relative"
          variants={handVariants}
          initial="hidden"
          animate="visible"
          onAnimationComplete={handleAnimationComplete}
        >
          <FaHandPointer className="text-blue-vet text-9xl bg-gray-500 bg-opacity-20 rounded-full p-4" />
        </motion.div>
      )}
    </div>
  );
};

export default ScrollHint;