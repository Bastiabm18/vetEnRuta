// /app/components/PromoSection.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import PromoCard from './promoCard';
import { getPromos_2, PromoItem } from '@/app/admin/promos/actions';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa6';
import ScrollHint from './ScrollHint';

const PromoSection = () => {
  const [promotions, setPromotions] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Log para ver cuando el ref se adjunta
  useEffect(() => {
    console.log('PromoSection useEffect (mount): scrollContainerRef.current =', scrollContainerRef.current);
  }, []);

  useEffect(() => {
    const fetchPromosData = async () => {
      setLoading(true);
      const data = await getPromos_2();
      setPromotions(data);
      setLoading(false);
      // Log cuando las promociones se cargan y el ref debería estar disponible
      console.log('PromoSection useEffect (data loaded): scrollContainerRef.current =', scrollContainerRef.current);
    };
    fetchPromosData();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.75;
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      <motion.section
        className="relative w-[98vw] overflow-x-hidden py-12 bg-gray-200" // Kept your original w-[98vw] and overflow-x-hidden
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 overflow-x-hidden"> {/* THIS IS THE ONLY KEY ADDITION */}
          <h2 className="text-4xl font-josefin text-center text-gray-800 mb-2">Promociones Destacadas</h2>
          <p className="text-center font-josefin text-gray-600 mb-12 max-w-2xl mx-auto">
            Los mejores cuidados para tu mascota con profesionales especializados. ¡Descúbrelas!
          </p>

          {loading ? (
            <div className="text-center text-gray-600 w-full flex items-center justify-center"><FaSpinner className="animate-spin text-6xl text-green-vet" /></div>
          ) : promotions.length === 0 ? (
            <div className="text-center text-gray-600">No hay promociones disponibles en este momento.</div>
          ) : (
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-scroll no-scrollbar snap-x snap-mandatory pb-4 -mx-4 md:-mx-6 lg:-mx-8"
              >
                {promotions.map((promo, index) => (
                  <div key={promo.id || index} className="flex-shrink-0 w-[98vw] sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/4 px-4 md:px-6 lg:px-8 snap-center">
                    <PromoCard
                      key={promo.id || `promo-${index}`}
                      promo={promo}
                      index={index}
                    />
                  </div>
                ))}
              </div>

              {/* Botones de navegación flotantes (solo visibles en escritorio) */}
              <button
                onClick={() => scroll('left')}
                className="absolute top-1/2 left-0 md:-left-2 transform -translate-y-1/2 bg-green-vet text-white p-3 rounded-full shadow-lg hover:bg-green-dark transition-all duration-300 z-10 hidden md:flex items-center justify-center"
                aria-label="Scroll left"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute top-1/2 right-0 md:-right-2 transform -translate-y-1/2 bg-green-vet text-white p-3 rounded-full shadow-lg hover:bg-green-dark transition-all duration-300 z-10 hidden md:flex items-center justify-center"
                aria-label="Scroll right"
              >
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* ELIMINAMOS LA RENDERIZACIÓN CONDICIONAL DEL SCROLLHINT AQUÍ.
          Siempre se montará. Su lógica interna decidirá cuándo mostrarse.
          Esto asegura que useInView siempre tenga una oportunidad de observar.
          Asegúrate de que scrollContainerRef no sea null antes de pasarlo si no se renderiza.
          Si promo.length === 0, scrollContainerRef.current será null.
          Vamos a añadir una pequeña condición aquí, para que no intente observar un null.
      */}
      {promotions.length > 0 && <ScrollHint targetRef={scrollContainerRef} />}
    </>
  );
};

export default PromoSection;