"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiDogDuotone } from "react-icons/pi";

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

const texts = [
  "Atención segura y cómoda para mascotas mayores o con movilidad reducida",
  "Bienestar emocional gracias al entorno familiar del hogar",
  "Mayor comodidad al evitar traslados y tiempos de espera",
  "Reducción del riesgo de contagios al no exponerlos a otros animales",
  "Evaluación más certera al observar a la mascota en su ambiente natural",
  "Consulta personalizada y sin interrupciones, enfocada en tu mascota"
];

export default function Home_page() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Variantes para desktop - Imagen
  const desktopImageVariants = {
    enter: { x: "-100%", opacity: 1 },
    center: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 1 }
  };

  // Variantes para desktop - Texto
  const desktopTextVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.8 } },
    exit: { opacity: 0, transition: { duration: 0.4 } }
  };

  // Variantes para mobile
  const mobileVariants = {
    enter: { x: "-100%", opacity: 1 },
    center: { x: 0, opacity: 1, transition: { duration: 0.8 } },
    exit: { x: "100%", opacity: 1, transition: { duration: 0.8 } }
  };

  return (
    <div className="relative w-full h-screen font-crimson overflow-hidden md:h-auto md:rounded-lg md:w-[90vw] md:mx-auto">
      {/* Versión Desktop */}
      <div className="hidden md:flex h-full">
        {/* Área de Texto (1/3) */}
        <div className="w-1/3 h-full bg-blue-vet-light flex items-center justify-center p-4 relative">
          <AnimatePresence mode="wait">
             <img src='/logo1.png' className="absolute top-5 w-[200px] text-white opacity-90" />
           
            <motion.div
              key={`desktop-text-${currentImageIndex}`}
              variants={desktopTextVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute bottom-2 gap-5 p-4 text-center w-full"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 px-4">
                {texts[currentImageIndex]}
              </h2>
              <button 
                onClick={() => window.location.href = "/agenda"}
                className="px-6 py-3 bg-transparent border-2 border-gray-700 text-gray-700
                         font-semibold uppercase tracking-wider text-lg
                         hover:bg-blue-300 hover:text-gray-900
                         transition-colors duration-300 ease-in-out"
              >
                Agenda tu consulta
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Área de Imagen (2/3) - USANDO IMÁGENES DESKTOP */}
        <div className="w-2/3 h-full relative">
          <AnimatePresence>
            <motion.div
              key={`desktop-image-${currentImageIndex}`}
              variants={desktopImageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={localImagesDesktop[currentImageIndex]}
                alt={`Imagen ${currentImageIndex + 1}`}
                fill
                sizes="100vw"
                quality={100}
                priority
                className="object-cover"
              />

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Versión Mobile - USANDO IMÁGENES MOBILE */}
      <div className="md:hidden h-full w-full relative">
        <AnimatePresence>
          <motion.div
            key={`mobile-slide-${currentImageIndex}`}
            variants={mobileVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={localImagesMobile[currentImageIndex]} 
              alt={`Imagen móvil ${currentImageIndex + 1}`}
              fill
              sizes="100vw"
              quality={100}
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center py-6 text-center">
            
            <div className="w-full h-[200px] flex flex-col items-center justify-center text-center bg-gray-800 bg-opacity-40">

                   <h2 className="text-xl font-bold text-white mb-6">
                     {texts[currentImageIndex]}
                   </h2>
                   <button 
                     onClick={() => window.location.href = "/agenda"}
                     className="px-5 py-2 bg-transparent border-2 border-white text-white
                                font-semibold uppercase tracking-wider
                                hover:bg-blue-300 hover:text-gray-900
                                transition-colors duration-300 ease-in-out"
                   >
                     Agenda tu consulta
                   </button>
            </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Puntos de navegación */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
        <div className="flex space-x-2">
          {texts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentImageIndex ? 'bg-white' : 'bg-gray-400'
              }`}
              aria-label={`Ir a la slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}