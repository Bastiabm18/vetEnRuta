"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import Image from 'next/image';

export default function Footer() {
  const navLinks = [
    { id: "inicio", label: "Inicio" },
    { id: "servicios", label: "Servicios" },
    { id: "agenda", label: "Agenda" },
    { id: "contacto", label: "Contacto" },
  ];

  function scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Ajusta según la altura de tu navbar
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      window.history.pushState({}, "", `#${id}`);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const socialLinks = [
    { 
      icon: <FaInstagram />, 
      url: 'https://www.instagram.com/tuvetenruta',
      name: 'Instagram', 
      color: 'bg-gradient-to-tr from-purple-500 to-pink-500' 
    },
    { 
      icon: <FaFacebookF />, 
      url: 'https://www.facebook.com/profile.php?id=61576891340601',
      name: 'Facebook', 
      color: 'bg-blue-600' 
    },
    { 
      icon: <FaTiktok />, 
      url: 'https://www.tiktok.com/@tuvetenruta',
      name: 'TikTok', 
      color: 'bg-black' 
    },
    { 
      icon: <FaWhatsapp />, 
      url: 'https://wa.me/56939125131?text=Hola%20Vet%20En%20Ruta%20!',
      name: 'WhatsApp', 
      color: 'bg-green-500' 
    },
  ];

  return (
    <footer className='w-full min-h-[500px] md:min-h-[300px] bg-blue-vet text-white'>
      <div className="container mx-auto px-4 h-full flex flex-col justify-center py-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Logo y redes - Primera columna en móvil */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col items-center md:items-start order-1"
          >
            <div className="flex items-center mb-4">
              <Image 
                src="/icon1.png" 
                alt="Veterinaria Logo" 
                width={40} 
                height={40} 
                className="mr-2"
              />
              <span className="text-xl font-bold">Vet En Ruta</span>
            </div>
           
            <div className="flex space-x-4 mb-6 md:mb-0">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ 
                    y: -3,
                    scale: 1.1,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.9 }}
                  className={`${social.color} text-white p-2 rounded-full hover:bg-opacity-90 transition-all`}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Enlaces rápidos - Segunda columna en móvil */}
          <motion.div 
            variants={itemVariants} 
            className="text-center  md:text-left order-3 md:order-2"
          >
            <h3 className="font-bold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <motion.li 
                  key={link.id}
                  whileHover={{ 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <button 
                    onClick={() => scrollToSection(link.id)}
                    className="hover:underline block w-full text-center md:text-left"
                  >
                    {link.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Horarios - Tercera columna en móvil */}
          <motion.div 
            variants={itemVariants} 
            className="text-center md:text-left order-4 md:order-3"
          >
            <h3 className="font-bold text-lg mb-4">Horario de Atención</h3>
            <ul className="space-y-2">
              <li>Lunes a Sábado: 9am - 21pm</li>
             
            </ul>
          </motion.div>

          {/* Contacto - Cuarta columna en móvil */}
          <motion.div 
            variants={itemVariants} 
            className="text-center md:text-left order-2 md:order-4"
          >
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <address className="not-italic space-y-2">
              <p>Concepción, Bio Bío, Chile</p>
              <p>Email: vetenruta@gmail.com</p>
            </address>
          </motion.div>
        </motion.div>

        {/* Derechos - Se muestra al final en móvil */}
        <motion.div 
          className="mt-8 pt-4 border-t border-white border-opacity-20 text-center text-sm order-last"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          © {new Date().getFullYear()} Vet En Ruta - Todos los derechos reservados
        </motion.div>
        
        <motion.div 
          className="pt-2 text-center text-sm order-last"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Developed with 💖 by <a href='https://www.instagram.com/bastiabm' className="hover:underline">BABM</a>
        </motion.div>
      </div>
    </footer>
  );
}