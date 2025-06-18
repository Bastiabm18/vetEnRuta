// src/app/agenda/componentes/shared/ValidationMessage.tsx
import { motion } from 'framer-motion';

interface ValidationMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'success';
}

export const ValidationMessage = ({ 
  message, 
  type = 'error' 
}: ValidationMessageProps) => {
  const getColorClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-600';
      default:
        return 'bg-red-50 border-red-200 text-red-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`${getColorClasses()} p-3 rounded-lg border text-sm mt-2`}
    >
      {message}
    </motion.div>
  );
};