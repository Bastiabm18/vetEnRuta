// src/app/promos/PromosClientContent.tsx
// Este es el componente cliente real con toda tu lógica original.
'use client'; // ¡Es crucial que este archivo mantenga el "use client"!

import React from 'react';
import Image from 'next/image';
import { FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Asegúrate de que esta ruta sea CORRECTA para tu archivo de acciones
import { PromoItem, getPromoById } from '../admin/promos/actions'; 
import Nav from '../components/header';
import Footer from '../components/footer';
import { FaArrowLeft } from 'react-icons/fa6';
import PromoSection from '../components/promoSection';

export default function PromosClientContent() { // <-- ¡NOMBRE DEL COMPONENTE CAMBIADO AQUÍ!
    const router = useRouter();
    const searchParams = useSearchParams();
    const promoId = searchParams.get('promoId');
    const [promo, setPromo] = useState<PromoItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPromoData = async () => {
            setLoading(true);
            if (promoId) {
                const fetchedPromo = await getPromoById(promoId);
                setPromo(fetchedPromo);
            } else {
                setPromo(null);
            }
            setLoading(false);
        };

        fetchPromoData();
    }, [promoId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <p className="text-2xl text-gray-200"><FaSpinner className="animate-spin text-6xl text-green-vet" /></p>
            </div>
        );
    }

    if (!promo) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <p className="text-2xl text-gray-300">Promoción no encontrada o ID inválido.</p>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-200 flex-col min-h-screen">
            {/* Aquí es donde renderizarías tu componente Header real */}
            <nav className=' w-full h-[60px] bg-green-vet flex items-center justify-start px-4'>
                <button onClick={() => router.push('/')} className='flex flex-row items-center justify-center font-josefin font-bold gap-2 bg-green-700 bg-opacity-40 rounded-full p-2 text-white'>
                    <FaArrowLeft className='text-2xl' /> 
                </button>
            </nav>

            <main className="flex-grow container mx-auto p-8 max-w-4xl bg-white shadow-lg rounded-lg my-10">
                <div className="relative font-crimson h-96 w-full mb-6 rounded-lg overflow-hidden">
                    <Image
                        src={promo.image}
                        alt={promo.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                    />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">{promo.title}</h1>
                <p className="text-lg text-green-vet font-semibold mb-4">{promo.service}</p>
                <p className="text-gray-700 leading-relaxed mb-6">{promo.description}</p>

                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex flex-col items-start">
                        {promo.new_price && promo.new_price !== "" && (
                            <span className="text-lg text-red-500 line-through mb-1">
                                $ {Number(promo.price).toLocaleString('es-CL')}
                            </span>
                        )}
                        <span className="text-2xl font-extrabold text-green-600">
                            $ {Number(promo.new_price && promo.new_price !== "" ? promo.new_price : promo.price).toLocaleString('es-CL')}
                        </span>
                    </div>
                    <button onClick={() => router.push('/agenda')} className="bg-green-vet hover:bg-green-dark text-white px-6 py-3 rounded-full flex items-center transition-colors text-md font-semibold">
                        ¡Aprovechar Oferta!
                    </button>
                </div>
            </main>

            {/* Aquí es donde renderizarías tu componente Footer real */}
            {/* <Footer /> */} 
        </div>
    );
}