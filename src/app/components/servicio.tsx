"use client";
import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { 
  FaStethoscope, FaSyringe, FaHeartbeat, FaBandAid, 
  FaFlask, FaPills, FaFileAlt, FaUtensils 
} from "react-icons/fa";

const services = [
  { bgColor: "bg-blue-vet", icon: <FaStethoscope className="text-black" />, title: "Chequeo general", description: "Valoración completa de salud" },
  { bgColor: "bg-green-vet", icon: <FaSyringe className="text-black" />, title: "Medicina preventiva", description: "Vacunaciones y desparasitaciones" },
  { bgColor: "bg-blue-vet-light", icon: <FaHeartbeat className="text-black" />, title: "Enfermedades crónicas", description: "Seguimiento especializado" },
  { bgColor: "bg-green-vet-light", icon: <FaBandAid className="text-black" />, title: "Curaciones", description: "Tratamiento de heridas" },
  { bgColor: "bg-blue-vet-light", icon: <FaFlask className="text-black" />, title: "Laboratorio", description: "Análisis clínicos" },
  { bgColor: "bg-green-vet-light", icon: <FaPills className="text-black" />, title: "Medicamentos", description: "Administración profesional" },
  { bgColor: "bg-blue-vet", icon: <FaFileAlt className="text-black" />, title: "Certificados", description: "Trámites sanitarios" },
  { bgColor: "bg-green-vet", icon: <FaUtensils className="text-black" />, title: "Nutrición", description: "Alimentación personalizada" }
];


interface TypewriterTextProps {
  text: string;
  start: boolean;
  delay?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, start, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  
  useEffect(() => {
    if (!start) return;
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, [text, start]);

  return <span>{displayedText}</span>;
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  bgColor: string;
  start: boolean;
}


const ServiceCard = ({ icon, title, description, index, bgColor, start }: ServiceCardProps) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "0px 0px -100px 0px" });
  const router = useRouter();

  
  return (
    <motion.div
      onClick={ () =>router.push('/agenda')}
      ref={cardRef}
      initial={{ x: -100, opacity: 0 }}
      animate={isInView ? { x: 0, opacity: 1 } : {}}
      transition={{ 
        delay: isInView ? index * 0.15 : 0,
        type: "spring",
        stiffness: 100
      }}
      className={`${bgColor} bg-opacity-90 hover:bg-opacity-80 p-2 rounded-lg cursor-pointer flex flex-col items-center h-full text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out`}
    >
      <motion.div 
        className="bg-white bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white"
        whileHover={{ scale: 1.1 }}
      >
        {icon}
      </motion.div>
      
      <h3 className="font-bold text-center mb-1 min-h-[3rem] flex items-center">
        {isInView && start && (
          <TypewriterText text={title} start={isInView && start} delay={index * 0.1} />
        )}
      </h3>
      
      <p className="text-sm text-center opacity-90 min-h-[3rem] flex items-center">
        {isInView && start && (
          <TypewriterText text={description} start={isInView && start} delay={index * 0.1 + 0.5} />
        )}
      </p>
    </motion.div>
  );
};

export default function ServicesSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "0px 0px -100px 0px" });
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (isInView) {
      setAnimationStarted(true);
    }
  }, [isInView]);


  const [activeSection, setActiveSection] = useState("inicio");

  const scrollToSection = (id: 'agenda') => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveSection(id);
    //  setIsMobileMenuOpen(false);
    }
  };
  return (
    <section 
      ref={sectionRef}
      className="bg-gray-200 text-black w-full py-16 px-4 min-h-[100vh] md:min-h-screen" 
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          className="text-4xl text-black font-josefin font-bold mb-5 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          {isInView && animationStarted && (
            <TypewriterText text="Servicios" start={isInView && animationStarted} />
          )}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              index={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              bgColor={service.bgColor}
              start={animationStarted}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: isInView ? 1.5 : 0 }}
          className="mt-5 flex justify-center"
        >
          <button onClick={() => scrollToSection('agenda')} className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all duration-300">
            Solicitar servicio
          </button>
        </motion.div>
      </div>
    </section>
  );
}