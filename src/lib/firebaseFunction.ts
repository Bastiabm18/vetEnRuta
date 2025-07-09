//import { auth, storage, db } from './firebase';
import { getFirebaseClientInstances } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, getDocs, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface Post {
  id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  rating: number;
  status: 'draft' | 'published';
  imageFile?: File;
  imageUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  userId?: string;
}
export interface AppointmentData {
  cliente: {
    nombre: string;
    rut: string;
    telefono: string;
    email: string;
    direccion: {
      calle: string;
      numero: string;
      comuna: string;
    };
  };
  mascotas: Array<{
    nombre: string;
    tipo: 'perro' | 'gato';
    servicios: string[];
  }>;
  veterinario: {
    id: string;
    nombre: string;
  };
  fecha: string;
  hora: string;
  region: string | null;
  comuna: string | null;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  createdAt: Date;
}

export const createAppointment = async (data: Omit<AppointmentData, 'createdAt' | 'estado'>) => {
  try {
    const { db,auth, storage  } = getFirebaseClientInstances();
    const appointmentsRef = collection(db, 'citas');
    const newAppointmentRef = doc(appointmentsRef);
    
    const completeData: AppointmentData = {
      ...data,
      estado: 'pendiente',
      createdAt: new Date()
    };
    
    await setDoc(newAppointmentRef, completeData);
    return newAppointmentRef.id;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

// Guardar o actualizar un post
export const savePost = async (post: Post): Promise<string> => {
  try {
    
    const { db,auth, storage  } = getFirebaseClientInstances();
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    if (!post.title.trim()) throw new Error('Title is required');
    if (!post.imageFile && !post.imageUrl) throw new Error('Image is required');

    let imageUrl = post.imageUrl;
    
    if (post.imageFile) {
      const fileExt = post.imageFile.name.split('.').pop();
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}.${fileExt}`);
      await uploadBytes(storageRef, post.imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const postData = {
      title: post.title,
      date: post.date,
      location: post.location,
      description: post.description,
      rating: post.rating,
      status: post.status || 'draft',
      imageUrl,
      userId: user.uid,
      createdAt: post.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const postId = post.id || `post_${Date.now()}`;
    const postRef = doc(db, 'posts', postId);
    await setDoc(postRef, postData);

    return postId;
  } catch (error: any) {
    console.error('Error saving post:', error);
    throw new Error(error.message || 'Failed to save post');
  }
};

// Obtener todos los posts
export const getPosts = async (): Promise<Post[]> => {
  try {
    
    const { db,auth, storage  } = getFirebaseClientInstances();
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
  } catch (error: any) {
    console.error('Error getting posts:', error);
    throw new Error(error.message || 'Failed to get posts');
  }
};

// Obtener posts de un usuario específico




// Eliminar un post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    
    const { db,auth, storage  } = getFirebaseClientInstances();
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error: any) {
    console.error('Error deleting post:', error);
    throw new Error(error.message || 'Failed to delete post');
  }
};