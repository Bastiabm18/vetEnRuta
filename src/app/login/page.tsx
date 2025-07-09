'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, facebookProvider, signInWithPopup, signInWithEmailAndPassword } from '@/lib/firebase';
import { FaGoogle, FaFacebook, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { PiDogDuotone } from 'react-icons/pi';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError('');
    
    try {
      const selectedProvider = provider === 'google' ? googleProvider : facebookProvider;
      await signInWithPopup(auth, selectedProvider);
      router.push('/');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch(code) {
      case 'auth/user-not-found': return 'Usuario no encontrado';
      case 'auth/wrong-password': return 'Contraseña incorrecta';
      case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde';
      default: return 'Error al iniciar sesión';
    }
  };

  return (
    <div className="flex text-black items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow p-8">
        <Link href="/" className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
          <FaArrowLeft size={20} />
        </Link>
        
        <div className="flex flex-col items-center mb-6">
          <Image src="/icon1.png" alt="Logo" width={100} height={100} className=" mb-2" />
          <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        </div>
        
        {/* 
          Original h1, now part of the flex container above
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            Iniciar Sesión
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </p>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 disabled:opacity-50"
            >
              <FaGoogle className="text-red-500" /> Google
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}