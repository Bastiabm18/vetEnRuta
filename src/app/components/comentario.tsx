"use client";
import { FaUserCircle } from "react-icons/fa";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Comentario {
  id: string;
  calificacion: number;
  comentario: string;
  fecha: { seconds: number; nanoseconds: number };
  userId: string;
  userName: string;
  userPhotoURL: string;
  pets?: string; // Agregamos el campo pets como opcional
}

export default function Comentarios() {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchComentarios = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const comentariosRef = collection(db, "comentarios");
        const q = query(
          comentariosRef,
          orderBy("fecha", "desc"),
          limit(8)
        );

        const querySnapshot = await getDocs(q);
        
        const comentariosData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            calificacion: data.calificacion || 0,
            comentario: data.comentario || '',
            fecha: data.fecha || { seconds: 0, nanoseconds: 0 },
            userId: data.userId || '',
            userName: data.userName || 'Anónimo',
            userPhotoURL: data.userPhotoURL || '',
            pets: data.pets || '' // Agregamos el campo pets
          };
        }) as Comentario[];
        
        setComentarios(comentariosData);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("No se pudieron cargar los comentarios. Por favor intenta más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchComentarios();
  }, []);

  const toggleExpandComment = (id: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants: Variants = {
    hidden: (index: number) => ({ 
      opacity: 0, 
      y: 50, 
      x: index % 2 === 0 ? -30 : 30 
    }),
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "anticipate",
        delay: index * 0.15
      }
    }),
    hover: {
      y: -10,
      transition: { type: "spring", stiffness: 300, damping: 10 }
    }
  };

  const postItConfigs = [
    {
      color: "bg-yellow-100",
      border: "border-yellow-300",
      rotation: 3,
      foldPosition: "top-right",
      creaseIntensity: "strong",
      pinPosition: "top-left",
      offset: { x: 5, y: -8 },
      foldShadow: "shadow-[8px_-8px_12px_rgba(0,0,0,0.15)]"
    },
    {
      color: "bg-blue-100",
      border: "border-blue-300",
      rotation: -2,
      foldPosition: "bottom-left",
      creaseIntensity: "medium",
      pinPosition: "top-right",
      offset: { x: -10, y: 5 },
      foldShadow: "shadow-[10px_10px_15px_rgba(0,0,0,0.2)]"
    },
    {
      color: "bg-pink-100",
      border: "border-pink-300",
      rotation: 4,
      foldPosition: "top-left",
      creaseIntensity: "strong",
      pinPosition: "bottom-right",
      offset: { x: 7, y: 12 },
      foldShadow: "shadow-[-10px_8px_15px_rgba(0,0,0,0.25)]"
    },
    {
      color: "bg-green-100",
      border: "border-green-300",
      rotation: -1,
      foldPosition: "bottom-right",
      creaseIntensity: "light",
      pinPosition: "bottom-left",
      offset: { x: -5, y: -10 },
      foldShadow: "shadow-[5px_-5px_10px_rgba(0,0,0,0.15)]"
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-500" />);
      }
    }
    return stars;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatFecha = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    
    });
  };

  const PushPin = ({ position }: { position: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-10, 10], [-8, 8]);
    
    return (
      <motion.div 
        className={`absolute ${position} z-30`}
        style={{ x, y, rotate }}
        drag
        dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
        dragElastic={0.05}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative w-6 h-8">
          <div className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-md border-t border-gray-200"></div>
          <div className="absolute w-4 h-4 rounded-full bg-gray-400/30 border border-gray-500/30 top-1 left-1"></div>
          <div className="absolute w-1.5 h-6 bg-gradient-to-b from-gray-400 to-gray-600 left-1/2 -translate-x-1/2 top-5 shadow-sm"></div>
          <div className="absolute w-1 h-2 bg-gray-700 left-1/2 -translate-x-1/2 top-10 rotate-45"></div>
          <div className="absolute w-2 h-2 rounded-full bg-white/30 top-1 left-1"></div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <section className="w-full py-16 bg-blue-vet/5 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center space-x-4"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-16 h-16 bg-gray-200 rounded-sm"
                animate={{
                  rotate: [0, 5, -5, 0],
                  y: [0, -10, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-lg text-gray-600"
          >
            Cargando comentarios...
          </motion.p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 bg-blue-vet/5 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          >
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-vet text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16  relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold font-josefin text-center text-black mb-3"
        >
          Opiniones de nuestros clientes
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-gray-600 font-josefine mb-12 max-w-2xl mx-auto"
        >
          Lo que dicen quienes confían en nosotros para el cuidado de sus mascotas
        </motion.p>
        
        {comentarios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-gray-600">No hay comentarios todavía. Sé el primero en opinar.</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4"
          >
            {comentarios.map((comentario, index) => {
              const config = postItConfigs[index % postItConfigs.length];
              const randomOffsetX = config.offset.x + (Math.random() * 10 - 5);
              const randomOffsetY = config.offset.y + (Math.random() * 10 - 5);
              const isExpanded = expandedComments[comentario.id];
              
              return (
                <motion.div 
                  key={comentario.id} 
                  custom={index}
                  variants={itemVariants}
                  className="relative z-10"
                  style={{
                    x: randomOffsetX,
                    y: randomOffsetY,
                    rotate: config.rotation
                  }}
                >
                  <PushPin position={config.pinPosition} />
                  
                  <motion.div 
                    className={`p-6 rounded-sm ${config.color} border-l-4 border-b-4 ${config.border} relative overflow-hidden h-full`}
                    style={{
                      boxShadow: '15px 15px 25px rgba(0,0,0,0.2)',
                      transformStyle: 'preserve-3d'
                    }}
                    whileHover={{
                      zIndex: 20,
                      scale: 1.05,
                      rotate: config.rotation + (index % 2 === 0 ? 1 : -1)
                    }}
                  >
                    <div className={`absolute ${config.foldPosition === 'top-right' ? 'top-0 right-0' : 
                                     config.foldPosition === 'bottom-left' ? 'bottom-0 left-0' :
                                     config.foldPosition === 'top-left' ? 'top-0 left-0' : 'bottom-0 right-0'} 
                                     w-12 h-12 overflow-hidden ${config.foldShadow}`}>
                      <div className={`absolute ${config.foldPosition === 'top-right' ? 'bottom-0 right-0' : 
                                       config.foldPosition === 'bottom-left' ? 'top-0 left-0' :
                                       config.foldPosition === 'top-left' ? 'bottom-0 left-0' : 'top-0 right-0'} 
                                       w-20 h-20 ${config.color.replace('100', '200')} 
                                       transform ${config.foldPosition === 'top-right' ? 'rotate-45' : 
                                                  config.foldPosition === 'bottom-left' ? 'rotate-45' :
                                                  config.foldPosition === 'top-left' ? '-rotate-45' : '-rotate-45'} 
                                       origin-${config.foldPosition}`}>
                        {config.creaseIntensity === 'strong' && (
                          <>
                            <div className="absolute top-1/4 left-1/4 w-1/2 h-0.5 bg-white/40 transform rotate-45"></div>
                            <div className="absolute top-1/3 left-1/3 w-1/3 h-0.5 bg-white/30 transform rotate-45"></div>
                          </>
                        )}
                        {config.creaseIntensity === 'medium' && (
                          <div className="absolute top-1/3 left-1/3 w-1/3 h-0.5 bg-white/30 transform rotate-45"></div>
                        )}
                      </div>
                    </div>
                    
                    {config.creaseIntensity === 'strong' && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-3/4 h-0.5 bg-white/40 transform rotate-3"></div>
                        <div className="absolute top-1/2 left-1/3 w-2/3 h-0.5 bg-white/30 transform -rotate-2"></div>
                      </div>
                    )}
                    {config.creaseIntensity === 'medium' && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/3 left-1/3 w-2/3 h-0.5 bg-white/30 transform rotate-5"></div>
                      </div>
                    )}
                    
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex items-center mb-4">
                        {comentario.userPhotoURL ? (
                          <img 
                            src={comentario.userPhotoURL} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full mr-3 object-cover"
                          />
                        ) : (
                          <FaUserCircle className="text-3xl text-gray-600/80 mr-3" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800">{comentario.userName}</h3>
                        </div>
                      </div>
                      
                      <div className="flex mb-3">
                        {renderStars(comentario.calificacion)}
                        <span className="ml-2 text-sm text-gray-700">
                          {comentario.calificacion.toFixed(1)}
                        </span>
                      </div>
                      
                      {/* Nueva sección para mostrar las mascotas */}
                      {comentario.pets && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Paciente:</span> {comentario.pets}
                          </p>
                        </div>
                      )}
                      
                      <div className={`${isExpanded ? 'overflow-y-auto max-h-40' : ''} mb-4`}>
                        <p className="text-gray-800 font-playwrite font-medium">
                          {isExpanded ? comentario.comentario : truncateText(comentario.comentario)}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-400/30 mt-auto">
                        <span className="text-xs text-gray-600">
                          {formatFecha(comentario.fecha)}
                        </span>
                        {comentario.comentario.length > 100 && (
                          <button 
                            onClick={() => toggleExpandComment(comentario.id)}
                            className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}