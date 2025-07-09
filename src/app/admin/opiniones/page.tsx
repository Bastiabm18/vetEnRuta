import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import AdminLayout from '@/app/components/adminLayout';
import DeleteCommentButton from './DeleteCommentButton';
import EditCommentForm from './EditCommentForm';
import { Timestamp } from 'firebase-admin/firestore';
import { FaUserCircle } from 'react-icons/fa'; // Import the user icon

interface Comment {
  id: string;
  calificacion: number;
  comentario: string;
  fecha: Timestamp | Date;
  userId: string;
  userName: string;
  userPhotoURL?: string; // Optional user photo URL
  pets?: string; // Nuevo campo para 'pets'
}

export default async function AdminOpinionesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  // Redirect if no session
  if (!sessionCookie) return redirect('/login');

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    // Session and role verification
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role !== 'admin') {
      if (decodedToken.role === 'vet') {
        return redirect('/admin');
      }
      return redirect('/');
    }

    // Fetch comments with type safety
    const commentsSnapshot = await adminFirestore
      .collection('comentarios')
      .orderBy('fecha', 'desc')
      .get();

    const comments: Comment[] = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      calificacion: doc.data().calificacion,
      comentario: doc.data().comentario,
      fecha: doc.data().fecha, // `doc.data().fecha` will be a Firebase Timestamp
      userId: doc.data().userId,
      userName: doc.data().userName,
      userPhotoURL: doc.data().userPhotoURL,
      pets: doc.data().pets, // Obtener el valor de 'pets'
    }));

    // Function to format date for display (original behavior, local timezone)
    const formatDate = (date: Timestamp | Date) => {
      const jsDate = date instanceof Timestamp ? date.toDate() : new Date(date);
      return jsDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <div className="p-4 max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Comentarios</h1>
            <p className="text-sm text-gray-500">
              {comments.length} comentario{comments.length !== 1 ? 's' : ''} encontrado{comments.length !== 1 ? 's' : ''}
            </p>
          </header>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay comentarios para mostrar</p>
              </div>
            ) : (
              comments.map(comment => (
                <article key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex items-center gap-3">
                      {/* Conditional rendering for user photo or icon */}
                      {comment.userPhotoURL ? (
                        <img
                          src={comment.userPhotoURL}
                          alt={`Avatar de ${comment.userName}`}
                          className="w-10 h-10 rounded-full object-cover"
                          width={40}
                          height={40}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none'; // Hide the broken image
                            // A more robust solution might involve a state to toggle visibility here.
                          }}
                        />
                      ) : (
                        <FaUserCircle className="w-10 h-10 text-gray-400" /> // React icon as fallback
                      )}
                      <div>
                        <h2 className="font-semibold text-gray-800">{comment.userName}</h2>
                        <div className="flex text-yellow-400">
                          {Array(5).fill(0).map((_, i) => (
                            <span key={i}>
                              {i < comment.calificacion ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <time className="text-sm text-gray-500 sm:text-right">
                      {formatDate(comment.fecha)}
                    </time>
                  </header>

                  <div className="mt-3 pl-13">
                    <p className="text-gray-700 whitespace-pre-line">{comment.comentario}</p>
                    {/* Display pets if available */}
                    {comment.pets && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-semibold">Mascotas:</span> {comment.pets}
                      </p>
                    )}
                  </div>

                  <footer className="mt-4 flex justify-end gap-2">
                    <EditCommentForm
                      commentId={comment.id}
                      initialComment={comment.comentario}
                      initialRating={comment.calificacion}
                      // Initial date for the date picker using UTC components
                      initialFecha={
                        comment.fecha instanceof Timestamp
                          ? (() => {
                              const jsDate = comment.fecha.toDate();
                              const year = jsDate.getUTCFullYear();
                              const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
                              const day = jsDate.getUTCDate().toString().padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })()
                          : new Date(comment.fecha).toISOString().split('T')[0] // Fallback for regular Date object
                      }
                      initialPets={comment.pets} // Pasa el valor de 'pets'
                    />
                    <DeleteCommentButton commentId={comment.id} />
                  </footer>
                </article>
              ))
            )}
          </div>
        </div>
      </AdminLayout>
    );
  } catch (error) {
   const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances(); 
    console.error('Error en página de opiniones:', error);
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role === 'vet') {
      return redirect('/admin');
    }
    return redirect('/login');
  }
}