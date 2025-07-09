"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaInstagram, 
  FaTwitter, 
  FaFacebookF, 
  FaTiktok, 
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaClock,
  FaYoutube,
  FaTelegram
} from 'react-icons/fa';
import { RiCloseLine } from 'react-icons/ri';
import dynamic from 'next/dynamic';
import Nav from '../components/header';
import { SiGmail } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';



export default function Contacto() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '', // Nuevo campo para el asunto
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null); // Estado para manejar errores

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null); // Resetear errores al enviar
    
    try {
      const response = await fetch("https://formspree.io/f/xkgbwwgp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject, // Incluir el asunto
          message: formData.message
        }),
      });
      
      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' }); // Resetear todos los campos
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsModalOpen(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el formulario');
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Ocurrió un error al enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

const socialLinks = [
  { 
    icon: <FaInstagram size={24} />, 
    url: 'https://www.instagram.com/tuvetenruta', // Reemplaza con tu usuario de Instagram
    name: 'Instagram', 
    color: 'bg-gradient-to-tr from-purple-500 to-pink-500' 
  },
  { 
    icon: <FaFacebookF size={24} />, 
    url: 'https://www.facebook.com/profile.php?id=61576891340601', // Reemplaza con tu página de Facebook
    name: 'Facebook', 
    color: 'bg-blue-600' 
  },
  { 
    icon: <FaTiktok size={24} />, 
    url: 'https://www.tiktok.com/@tuvetenruta', // Reemplaza con tu usuario de TikTok
    name: 'TikTok', 
    color: 'bg-black' 
  },
  { 
    icon: <FaWhatsapp size={24} />, 
    url: 'https://wa.me/+56956097887', // Tu número con código de país (56 para Chile)
    name: 'WhatsApp', 
    color: 'bg-green-500' 
  },

];
  return (
    <div className="w-full  justify-center h-[70vh] items-center mb-10 flex p-2  ">
      
      
      <main className="flex flex-col  items-center p-2 overflow-hidden">
        {/* Elementos decorativos */}
    
            
               <div className="w-full flex flex-col items-center mt-5 mb-10 ">
                    <div className="flex items-center justify-center w-full">
                      <h2 className="text-4xl font-josefin font-bold text-black mx-4">CONTACTO</h2>
                     
                    </div>
            </div>

             
             
        <div className=" bg-gray-300-500 flex flex-col items-center justify-evenly h-auto mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {/* Sección izquierda - Redes sociales */}
            <div className="space-y-8">
           

              {/* Redes sociales */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-8 rounded-xl shadow-md"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Nuestras redes sociales</h3>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className={`${social.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center`}
                      aria-label={social.name}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sección derecha - Información de contacto y botones */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-8"
            >
              {/* Información de contacto */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white p-8 rounded-xl shadow-md"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Información de contacto</h3>
                
                <div className="space-y-6">
      

                  <div onClick={() => setIsModalOpen(true)} className="flex items-start space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="mt-1 p-2 bg-green-vet bg-opacity-10 text-green-vet rounded-lg">
                      <FaEnvelope className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email</h4>
                      <p className="text-gray-600">tuvetenruta@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="mt-1 p-2 bg-green-vet bg-opacity-10 text-green-vet rounded-lg">
                      <FaClock className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Horario de contacto vía WhatsApp</h4>
                      <p className="text-gray-600">Lun-Sab: 9:00 - 21:00</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Botones de contacto */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >


                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center space-x-2 bg-green-vet hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  <FaEnvelope />
                  <span>Enviar email</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Modal de formulario */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="relative p-6">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar modal"
                  >
                    <RiCloseLine className="text-2xl" />
                  </button>
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Envíanos un mensaje</h3>
                    <p className="text-gray-500 mt-1">Completa el formulario y te responderemos pronto</p>
                  </div>
                  
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">¡Mensaje enviado!</h4>
                      <p className="text-gray-500">Gracias por contactarnos. Te responderemos pronto.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="text-black space-y-4">
                      <div>
                        <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          id="modal-name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-vet focus:border-blue-vet transition"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          id="modal-email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-vet focus:border-blue-vet transition"
                          required
                        />
                      </div>

                      {/* Nuevo campo para el asunto */}
                      <div>
                        <label htmlFor="modal-subject" className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                        <input
                          type="text"
                          id="modal-subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-vet focus:border-blue-vet transition"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                        <textarea
                          id="modal-message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-vet focus:border-blue-vet transition"
                          required
                        ></textarea>
                      </div>

                      {/* Mostrar error si existe */}
                      {submitError && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                          Error: {submitError}
                        </div>
                      )}
                      
                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center space-x-2 bg-green-vet hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <FaPaperPlane />
                            <span>Enviar mensaje</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

     
      </main>

    </div>
  );
}