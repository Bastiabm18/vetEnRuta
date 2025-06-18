'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Imágenes para escritorio
const localImagesDesktop = [
  require("../../../public/home-page/imagen1.jpg"),
  require("../../../public/home-page/imagen2.jpg"),
  require("../../../public/home-page/imagen3.jpg"),
  require("../../../public/home-page/imagen4.jpg"),
  require("../../../public/home-page/imagen5.jpg"),
  require("../../../public/home-page/imagen6.jpg"),
];

// Imágenes para móvil
const localImagesMobile = [
  require("../../../public/home-page/movil1.jpg"),
  require("../../../public/home-page/movil2.jpg"),
  require("../../../public/home-page/movil3.jpg"),
  require("../../../public/home-page/movil4.jpg"),
  require("../../../public/home-page/movil5.jpg"),
  require("../../../public/home-page/movil6.jpg"),
];

export default function CallToAction() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % localImagesDesktop.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const imageVariants = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.8 } },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.8 } },
  };

  return (
    <motion.section
      className="relative h-[90vh] w-[90vw] mx-auto rounded-lg shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Carrusel de imágenes de fondo */}
      <AnimatePresence>
        {/* Imagen para escritorio */}
        <motion.div
          key={`desktop-${currentImageIndex}`}
          className="absolute inset-0 hidden md:block"
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Image
            src={localImagesDesktop[currentImageIndex % localImagesDesktop.length]}
            alt={`Fondo escritorio ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="90vw 90vh"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" /> {/* Overlay oscuro */}
        </motion.div>

        {/* Imagen para móvil */}
        <motion.div
          key={`mobile-${currentImageIndex}`}
          className="absolute inset-0 md:hidden block"
          variants={imageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Image
            src={localImagesMobile[currentImageIndex % localImagesMobile.length]}
            alt={`Fondo móvil ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="90vw 90vh"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" /> {/* Overlay oscuro */}
        </motion.div>
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center p-8">
        {/* Icono de la empresa */}
        <img src="/icon1.png" alt="Logo de la veterinaria" className="w-20 mb-6" />

        <div className="bg-white bg-opacity-20 rounded-lg p-8 shadow-md">
          <motion.h2
            className="text-3xl font-bold mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            ¿Necesita veterinario a domicilio?
          </motion.h2>
          <motion.p
            className="text-lg mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            ¡La salud de tu mascota en la puerta de tu casa! Solicita tu visita ahora.
          </motion.p>
          <motion.button
            onClick={() => window.location.href = "/agenda"}
            className="bg-white text-blue-vet font-bold py-3 px-6 rounded-full shadow-md hover:bg-blue-100 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Agendar Visita
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}