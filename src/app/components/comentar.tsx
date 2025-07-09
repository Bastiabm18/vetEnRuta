"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar, FaStarHalfAlt, FaUserCircle } from 'react-icons/fa';

export default function Comentar() {
  const [comentario, setComentario] = useState('');
  const [pets, setPets] = useState(''); // Nuevo estado para mascotas
  const [calificacion, setCalificacion] = useState(0);
  const [hoverCalificacion, setHoverCalificacion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setShowLoginMessage(true);
      return;
    }

    if (!comentario.trim() || calificacion === 0) {
      setMessage("Por favor completa todos los campos");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comentarios'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anónimo',
        userPhotoURL: currentUser.photoURL,
        comentario,
        pets, // Agregamos el campo pets al documento
        calificacion,
        fecha: serverTimestamp(),
      });
      
      setMessage("¡Gracias por tu comentario! 🌟");
      setComentario('');
      setPets(''); // Limpiamos el campo pets
      setCalificacion(0);
    } catch (error) {
      setMessage("Error al enviar el comentario");
      console.error("Error saving comment:", error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className="focus:outline-none"
        onClick={() => setCalificacion(star)}
        onMouseEnter={() => setHoverCalificacion(star)}
        onMouseLeave={() => setHoverCalificacion(0)}
      >
        {((hoverCalificacion || calificacion) >= star) ? (
          <FaStar className="w-6 h-6 text-yellow-400" />
        ) : (
          <FaRegStar className="w-6 h-6 text-yellow-400" />
        )}
      </button>
    ));
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative bg-pink-100 border-l-4 border-b-4 text-black border-pink-300 p-6 rounded-sm shadow-[15px_15px_25px_rgba(0,0,0,0.2)]"
      style={{ transform: 'rotate(2deg)' }}
    >
      {/* Folded corner effect */}
      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden shadow-[8px_-8px_12px_rgba(0,0,0,0.15)]">
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-pink-200 transform rotate-45 origin-top-right" />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10">
        {currentUser ? (
          <div className="flex items-center mb-4">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <FaUserCircle className="w-10 h-10 text-pink-400 mr-3" />
            )}
            <div>
              <p className="font-medium text-pink-800">
                {currentUser.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-pink-600">
                {currentUser.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-pink-50 rounded-md">
            <p className="text-pink-800 text-sm">
              Inicia sesión para dejar tu comentario
            </p>
          </div>
        )}

        {/* Nuevo campo para mascotas */}
        <div className="mb-4">
          <input
            type="text"
            value={pets}
            onChange={(e) => setPets(e.target.value)}
            placeholder=""
            className="w-full px-3 py-2 bg-pink-50 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            disabled={!currentUser || isSubmitting}
          />
          <p className="text-xs text-pink-600 mt-1">Nombres de tus mascotas (opcional)</p>
        </div>

        <div className="mb-4">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe tu comentario aquí..."
            className="w-full px-3 py-2 bg-pink-50 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            rows={4}
            disabled={!currentUser || isSubmitting}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-pink-800 mb-2">
            Calificación
          </label>
          <div className="flex space-x-1">
            {renderStars(calificacion)}
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
            {message}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setComentario('');
              setPets(''); // Limpiamos también el campo pets
              setCalificacion(0);
            }}
            className="px-4 py-2 text-pink-700 hover:bg-pink-200 rounded-md transition-colors"
            disabled={isSubmitting}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 transition-colors"
            disabled={!currentUser || isSubmitting || !comentario.trim() || calificacion === 0}
          >
            {isSubmitting ? 'Enviando...' : 'Publicar'}
          </button>
        </div>
      </form>

      {/* Login reminder animation */}
      {showLoginMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 bg-pink-50 bg-opacity-95 flex items-center justify-center p-4 text-center"
        >
          <div>
            <p className="text-pink-800 mb-3">
              ¡Inicia sesión para poder comentar!
            </p>
            <button
              onClick={() => setShowLoginMessage(false)}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}