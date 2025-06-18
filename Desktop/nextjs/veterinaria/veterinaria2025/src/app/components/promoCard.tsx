// /app/components/PromoCard.tsx
"use client";
import { motion } from 'framer-motion';
import { FaPaw, FaArrowRight } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Asegúrate de que esta interfaz esté definida o importada donde sea necesaria
export interface PromoItem {
  id?: string; // Optional for when reading from Firestore, as it's the doc ID
  title: string;
  service: string;
  description: string;
  price: string;
  new_price?: string; // Optional for new prices
  image: string; // URL of the image
  imagePath?: string;
  createdAt?: string | number | null;
}

interface PromoCardProps {
  promo: PromoItem; // Ahora pasamos el objeto PromoItem completo
  index: number;
}

export default function PromoCard({ promo, index }: PromoCardProps) {
  const router = useRouter();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5
      }
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  const handleButtonClick = () => {
    if (promo.id) { // Asegúrate de que el ID exista antes de navegar
      router.push(`/promos?promoId=${promo.id}`);
    } else {
      console.warn("Promo ID no disponible.");
      // Opcional: Manejar el caso donde no hay ID, por ejemplo, mostrar un mensaje al usuario.
    }
  };

  return (
    <motion.div
      onClick={handleButtonClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col min-h-[430px] max-h-[430px] w-full max-w-xs mx-auto cursor-pointer" // Added cursor-pointer for better UX
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -100px 0px" }}
      whileHover={{ y: -5 }}
    >
      <div className="relative min-h-[220px] max-h-[220px] w-full">
        <Image
          src={promo.image} // Usamos promo.image
          alt={promo.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center ">
          <FaPaw className="text-green-vet mr-2" />
          <span className="text-sm font-semibold text-green-vet">{truncateText(promo.service, 20)}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{truncateText(promo.title, 30)}</h3>
        <p className="text-gray-600 mb-4 flex-grow text-sm">
          {truncateText(promo.description, 60)}
        </p>

        <div className="flex justify-between items-center mt-0">
          <div className="flex flex-col items-start">
            {promo.new_price && promo.new_price !== "" && (
              <span className="text-sm text-red-500 line-through mb-1">
                $ {Number(promo.price).toLocaleString('es-CL')}
              </span>
            )}
            <span className="text-md font-bold text-green-vet">
              $ {Number(promo.new_price && promo.new_price !== "" ? promo.new_price : promo.price).toLocaleString('es-CL')}
            </span>
          </div>
          <button
            onClick={handleButtonClick}
            className="bg-green-vet hover:bg-green-dark text-white text-md px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            Ver Más <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}