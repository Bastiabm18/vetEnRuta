// /app/admin/promos/NuevaPromoForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaw, FaArrowRight, FaImage, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { addPromo, updatePromo, deletePromo, getPromos } from './actions';
import { PromoItem } from './actions';

const NuevaPromoForm = () => {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [editingPromo, setEditingPromo] = useState<PromoItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State for delete confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<PromoItem | null>(null);

  // State variables to hold the current form input values for live preview
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewService, setPreviewService] = useState('');
  const [previewDescription, setPreviewDescription] = useState('');
  const [previewPrice, setPreviewPrice] = useState('');
  const [previewNewPrice, setPreviewNewPrice] = useState(''); // <-- NEW: State for new_price preview

  useEffect(() => {
    fetchPromos();
  }, []);

  // Effect to update preview states when editingPromo changes
  useEffect(() => {
    if (editingPromo) {
      setPreviewTitle(editingPromo.title);
      setPreviewService(editingPromo.service);
      setPreviewDescription(editingPromo.description);
      setPreviewPrice(editingPromo.price);
      setPreviewNewPrice(editingPromo.new_price || ''); // <-- UPDATED: Set new_price for editing
      setImagePreview(editingPromo.image); // Use existing image as preview
    } else {
      // Clear preview states when not editing
      setPreviewTitle('');
      setPreviewService('');
      setPreviewDescription('');
      setPreviewPrice('');
      setPreviewNewPrice(''); // <-- UPDATED: Clear new_price when not editing
      setImagePreview(null);
    }
  }, [editingPromo]);

  const fetchPromos = async () => {
    setLoading(true);
    const fetchedPromos = await getPromos();
    setPromos(fetchedPromos);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      // If editing, reset to original image if it exists
      if (editingPromo && editingPromo.image) {
        setImagePreview(editingPromo.image);
      } else { // This else block was missing before, causing previous image to persist visually
        setImagePreview(null);
      }
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // If editing, reset to original image if it exists
    if (editingPromo && editingPromo.image) {
      setImagePreview(editingPromo.image);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    formData.append('image', imageFile as Blob); // Append the actual file (YOUR ORIGINAL LOGIC)

    let result;
    if (editingPromo) {
      formData.append('existingImagePath', editingPromo.imagePath || '');
      result = await updatePromo(editingPromo.id!, formData);
    } else {
      result = await addPromo(formData);
    }

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      resetForm(); // YOUR ORIGINAL RESET FORM LOGIC
      fetchPromos();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  const handleDelete = (promo: PromoItem) => {
    setPromoToDelete(promo);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!promoToDelete) return; // Should not happen if modal is shown correctly

    setLoading(true);
    setMessage(null);
    setShowConfirmModal(false); // Close the modal
    
    const result = await deletePromo(promoToDelete.id!, promoToDelete.imagePath || '');
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      fetchPromos();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
    setPromoToDelete(null); // Clear the promo to delete
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setPromoToDelete(null);
  };

  const startEditing = (promo: PromoItem) => {
    setEditingPromo(promo);
    // Preview states are updated by the useEffect hook
    setImageFile(null); // No new file selected yet
    setMessage(null); // Clear messages
  };

  const cancelEditing = () => {
    setEditingPromo(null);
    // Preview states are reset by the useEffect hook
  };

  // YOUR ORIGINAL resetForm FUNCTION - UNCHANGED except for new_price preview
  const resetForm = () => {
    setEditingPromo(null);
    setImageFile(null);
    setImagePreview(null);
    setPreviewTitle(''); // Added to clear preview states directly
    setPreviewService('');
    setPreviewDescription('');
    setPreviewPrice('');
    setPreviewNewPrice(''); // <-- UPDATED: Clear new_price preview
    const form = document.getElementById('promo-form') as HTMLFormElement;
    if (form) {
      form.reset();
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-vet";
  const labelClass = "block text-gray-700 text-sm font-bold mb-2";

  // Determine the image source for the preview. Prioritize new selection, then existing, then placeholder.
  const currentImageForPreview = imagePreview || '/imagen_1.jpg'; // Use a simple placeholder if no image

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ''; // Handle null/undefined text
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };


  return (
    <div className="container text-black mx-auto px-4 py-8">
      <h1 className="text-3xl font-josefin text-gray-800 text-center mb-8">Administrar Promociones</h1>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 mb-4 rounded-md text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {loading && (
        <div className="text-center text-gray-600 mb-4">Cargando...</div>
      )}

      <motion.div
        className="bg-white rounded-lg shadow-lg p-6 mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingPromo ? 'Editar Promoción' : 'Crear Nueva Promoción'}
        </h2>
        <form id="promo-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className={labelClass}>Título</label>
            <input
              type="text"
              id="title"
              name="title"
              className={inputClass}
              defaultValue={editingPromo?.title || ''}
              onChange={(e) => setPreviewTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="service" className={labelClass}>Servicio</label>
            <input
              type="text"
              id="service"
              name="service"
              className={inputClass}
              defaultValue={editingPromo?.service || ''}
              onChange={(e) => setPreviewService(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className={labelClass}>Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={inputClass}
              defaultValue={editingPromo?.description || ''}
              onChange={(e) => setPreviewDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="price" className={labelClass}>Precio</label>
            <input
              type="text"
              id="price"
              name="price"
              className={inputClass}
              defaultValue={editingPromo?.price || ''}
              onChange={(e) => setPreviewPrice(e.target.value)}
              placeholder="$XX.XXX"
              required
            />
          </div>
          {/* ----- NEW INPUT FOR NEW_PRICE ----- */}
          <div>
            <label htmlFor="new_price" className={labelClass}>Precio en Promoción</label>
            <input
              type="text"
              id="new_price"
              name="new_price"
              className={inputClass}
              defaultValue={editingPromo?.new_price || ''}
              onChange={(e) => setPreviewNewPrice(e.target.value)} // Update new_price preview state
              placeholder="$YY.YYY"
            />
          </div>
          {/* ----------------------------------- */}
          <div className="relative md:col-span-2">
            <label htmlFor="image" className={labelClass}>Imagen</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="flex items-center space-x-4">
              <label htmlFor="image" className="cursor-pointer bg-green-vet text-white px-5 py-3 rounded-md flex items-center hover:bg-green-dark transition-colors">
                <FaImage className="mr-2" /> Seleccionar Imagen
              </label>
              {(imagePreview || editingPromo?.image) && (
                <div className="relative w-32 h-32 rounded-md overflow-hidden shadow-md">
                  <Image
                    src={imagePreview || editingPromo?.image!}
                    alt="Image Preview"
                    layout="fill"
                    objectFit="cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-700 transition-colors"
                    aria-label="Remove image"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
            {!imagePreview && !editingPromo?.image && (
              <p className="text-sm text-gray-500 mt-2">No se ha seleccionado ninguna imagen.</p>
            )}
          </div>

          {/* --- LIVE PREVIEW SECTION (Styled like PromoCard, now narrower) --- */}
          <div className="md:col-span-2 mt-6 flex justify-center">
            <div className="w-full sm:w-80 lg:w-96">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Previsualización de la Promoción</h3>
              <motion.div
                className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-64 w-full">
                  {currentImageForPreview ? (
                    <Image 
                      src={currentImageForPreview} 
                      alt={previewTitle || 'Previsualización'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                      No Image Preview
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    <FaPaw className="text-green-vet mr-2" />
                    <span className="text-sm font-semibold text-green-vet">
                      {truncateText(previewService, 20) || 'Servicio de ejemplo'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {truncateText(previewTitle, 30) || 'Título de la Promoción'}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-grow text-sm">
                    {truncateText(previewDescription, 60) || 'Descripción de la promoción. Manténla concisa y atractiva. Este texto se adaptará al tamaño de la tarjeta.'}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex flex-col items-start">
                      {/* --- UPDATED PREVIEW PRICE DISPLAY --- */}
                      {previewNewPrice && previewNewPrice !== "" && (
                        <span className="text-sm text-red-500 line-through mb-1">
                          $ {Number(previewPrice).toLocaleString('es-CL')}
                        </span>
                      )}
                      <span className="text-xl font-bold text-green-vet">
                        $ {Number(previewNewPrice && previewNewPrice !== "" ? previewNewPrice : previewPrice).toLocaleString('es-CL')}
                      </span>
                      {/* ------------------------------------- */}
                    </div>
                    <button 
                      type="button"
                      className="bg-green-vet text-white px-4 py-2 rounded-lg flex items-center opacity-70 cursor-not-allowed"
                      disabled
                    >
                      Lo quiero <FaArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          {/* --- END LIVE PREVIEW SECTION --- */}

          <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
            {editingPromo && (
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
              >
                Cancelar Edición
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-green-vet hover:bg-green-dark text-white px-6 py-3 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (editingPromo ? 'Actualizando...' : 'Agregando...') : (editingPromo ? 'Actualizar Promoción' : 'Agregar Promoción')}
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </form>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Promociones Actuales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {promos.map((promo) => (
            <motion.div
              key={promo.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full relative"
              variants={cardVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              whileHover={{ y: -5 }}
            >
              <div className="relative h-48 w-full">
                {promo.image ? (
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                    <Image 
                      src="/imagen_1.jpg" 
                      alt="Placeholder"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FaPaw className="text-green-vet mr-2" />
                    <span className="text-sm font-semibold text-green-vet">{promo.service}</span>
                  </div>
                  {promo.createdAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(promo.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{promo.title}</h3>
                <div className="text-gray-600 mb-4 flex-grow max-h-[72px] overflow-hidden relative">
                  <p className="mb-0">
                    {promo.description.length > 120 
                      ? `${promo.description.substring(0, 120)}...` 
                      : promo.description}
                  </p>
                  {promo.description.length > 120 && (
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-auto">
                  {/* --- UPDATED LISTED PROMO PRICE DISPLAY --- */}
                  <div className="flex flex-col items-start">
                    {promo.new_price && promo.new_price !== "" && (
                      <span className="text-sm text-red-500 line-through mb-1">
                        $ {Number(promo.price).toLocaleString('es-CL')}
                      </span>
                    )}
                    <span className="text-xl font-bold text-green-vet">
                      $ {Number(promo.new_price && promo.new_price !== "" ? promo.new_price : promo.price).toLocaleString('es-CL')}
                    </span>
                  </div>
                  {/* ------------------------------------------ */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(promo)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
                      aria-label="Editar promoción"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(promo)} // Changed to pass the full promo object
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      aria-label="Eliminar promoción"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- Delete Confirmation Modal --- */}
      <AnimatePresence>
        {showConfirmModal && promoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cancelDelete} // Close modal when clicking outside
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar la promoción &quot;<span className="font-semibold">{promoToDelete.title}</span>&quot;? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-green-vet hover:bg-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- End Delete Confirmation Modal --- */}
    </div>
  );
};

export default NuevaPromoForm;