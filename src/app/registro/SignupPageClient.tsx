'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, getFirebaseClientInstances } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { PiDogDuotone } from 'react-icons/pi';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
       const { auth, db, storage } = getFirebaseClientInstances();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      var user = Math.random().toString(36);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: name,
        email: userCredential.user.email,
        photoURL: '',
        role: 'user',
        createdAt: new Date(),
        uid: user,
      });
      
      router.push('/');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch(code) {
      case 'auth/email-already-in-use': return 'El correo ya está registrado';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email': return 'Correo electrónico inválido';
      default: return 'Error al registrarse';
    }
  };

  return (
    <div className="text-black flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow p-8">
        <Link href="/login" className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
          <FaArrowLeft size={20} />
        </Link>

        <div className="flex flex-col items-center mb-6">
          <PiDogDuotone className="text-4xl text-gray-400 mb-2" />
          <h1 className="text-2xl font-bold text-center">Crear Cuenta</h1>
        </div>
        
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
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
              minLength={6}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            Registrarse
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}