"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiMinus } from "react-icons/fi";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
  fecha_creacion: { seconds: number; nanoseconds: number };
}

export default function PreguntasFrecuentes() {
  const [preguntas, setPreguntas] = useState<PreguntaFrecuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const preguntasRef = collection(db, "preguntaFrecuente");
        const q = query(preguntasRef, orderBy("fecha_creacion", "asc"));

        const querySnapshot = await getDocs(q);
        
        const preguntasData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            pregunta: data.pregunta || '',
            respuesta: data.respuesta || '',
            fecha_creacion: data.fecha_creacion || { seconds: 0, nanoseconds: 0 }
          };
        }) as PreguntaFrecuente[];
        
        setPreguntas(preguntasData);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("No se pudieron cargar las preguntas. Por favor intenta más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreguntas();
  }, []);

  const toggleQuestion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-[85vw] mx-auto px-4 sm:px-6 lg:px-8 py-12"> {/* Contenedor principal con ancho fijo */}
      <h1 className="font-josefine font-bold text-4xl text-black text-center mb-12">
        Preguntas Frecuentes
      </h1>

      {loading && (
        <div className="text-center py-8">
          <p>Cargando preguntas...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4 w-full">
          {preguntas.map((pregunta, index) => (
            <div 
              key={pregunta.id}
              className="border border-gray-200 rounded-lg overflow-hidden w-full min-w-full" // Asegura que no reduzca el ancho
            >
              <motion.div
                initial={false}
                onClick={() => toggleQuestion(index)}
                className={`flex justify-between items-center p-6 cursor-pointer ${activeIndex === index ? 'bg-blue-vet text-black' : 'bg-blue-vet-light hover:bg-blue-vet'} w-full`}
              >
                <h3 className="text-lg font-crimson text-black font-medium flex-1"> {/* Usamos flex-1 para que ocupe el espacio disponible */}
                  {pregunta.pregunta}
                </h3>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0" // Evita que el icono afecte el ancho
                >
                  {activeIndex === index ? (
                    <FiMinus className="w-6 h-6" />
                  ) : (
                    <FiPlus className="w-6 h-6" />
                  )}
                </motion.div>
              </motion.div>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full"
                  >
                    <div className="p-6 font-crimson bg-green-vet text-black w-full">
                      <p className="break-words"> {/* Aseguramos que el texto largo se ajuste */}
                        {pregunta.respuesta}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}