import { adminFirestore } from '@/lib/firebase-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get('petId');
  
  try {
    // Si hay petId, estamos editando una mascota existente
    if (petId) {
      const petDoc = await adminFirestore.collection('pets').doc(petId).get();
      if (!petDoc.exists) {
        return new Response(JSON.stringify({ error: 'Mascota no encontrada' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const petData = petDoc.data();
      return new Response(renderPetForm(petId, petData));
    }
    
    // Si no hay petId, es un formulario nuevo
    return new Response(renderPetForm());
  } catch (error) {
    console.error('Error obteniendo formulario:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function renderPetForm(petId = null, petData = null) {
  return `
    <form 
      id="pet-form"
      class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6"
      hx-post="/api/mascotas/${petId ? petId : ''}"
      hx-target="#pet-form-container"
      hx-swap="innerHTML"
    >
      <input type="hidden" name="petId" value="${petId || ''}">
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input 
            type="text" 
            name="name" 
            value="${petData?.name || ''}"
            required
            class="w-full px-3 py-2 border rounded-md"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select 
            name="type" 
            required
            class="w-full px-3 py-2 border rounded-md"
            hx-on:change="document.querySelector('#extraTypeContainer').style.display = this.value === 'otro' ? 'block' : 'none'"
          >
            <option value="perro" ${petData?.type === 'perro' ? 'selected' : ''}>Perro</option>
            <option value="gato" ${petData?.type === 'gato' ? 'selected' : ''}>Gato</option>
            <option value="otro" ${petData?.type === 'otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        
        <div id="extraTypeContainer" style="display: ${petData?.type === 'otro' ? 'block' : 'none'}">
          <label class="block text-sm font-medium text-gray-700 mb-1">Especifique tipo</label>
          <input 
            type="text" 
            name="extraType" 
            value="${petData?.extraType || ''}"
            class="w-full px-3 py-2 border rounded-md"
            ${petData?.type === 'otro' ? 'required' : ''}
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Raza</label>
          <input 
            type="text" 
            name="breed" 
            value="${petData?.breed || ''}"
            required
            class="w-full px-3 py-2 border rounded-md"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Edad (años)</label>
          <input 
            type="number" 
            name="age" 
            value="${petData?.age || ''}"
            min="0" 
            step="0.5" 
            required
            class="w-full px-3 py-2 border rounded-md"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
          <input 
            type="number" 
            name="weight" 
            value="${petData?.weight || ''}"
            min="0" 
            step="0.1" 
            required
            class="w-full px-3 py-2 border rounded-md"
          >
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Historial médico (opcional)</label>
        <textarea 
          name="medicalHistory" 
          rows="3"
          class="w-full px-3 py-2 border rounded-md"
        >${petData?.medicalHistory || ''}</textarea>
      </div>
      
      <div class="flex justify-end gap-2">
        <button 
          type="button" 
          class="px-4 py-2 border rounded-md"
          hx-get="/api/mascotas/formulario/cancelar"
          hx-target="#pet-form-container"
          hx-swap="innerHTML"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ${petId ? 'Actualizar' : 'Guardar'} Mascota
        </button>
      </div>
    </form>
  `;
}