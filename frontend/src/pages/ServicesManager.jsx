import { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService, getInventory } from '../lib/api';
import { Scissors, Plus, Loader2, Edit2, Trash2, AlertTriangle, X, Package } from 'lucide-react';

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', price: 0, duration: 30, isActive: true, inventory_items: [] 
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, invData] = await Promise.all([
        getServices(),
        getInventory()
      ]);
      setServices(servicesData || []);
      setInventoryItems(invData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      const mappedInventory = service.inventory_items?.map(i => ({
        id: i.id,
        quantity: i.pivot.quantity
      })) || [];
      setFormData({ 
        name: service.name, price: service.price || 0, duration: service.duration || 30, isActive: service.isActive,
        inventory_items: mappedInventory
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', price: 0, duration: 30, isActive: true, inventory_items: [] });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      alert('Error al guardar el servicio');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteService(serviceToDelete.id);
      setShowDeleteModal(false);
      loadData();
    } catch (e) {
      alert('Error al suspender el servicio');
    }
  };

  const handleToggleInventory = (itemId) => {
    setFormData(prev => {
      const exists = prev.inventory_items.find(i => i.id === itemId);
      if (exists) {
        return { ...prev, inventory_items: prev.inventory_items.filter(i => i.id !== itemId) };
      } else {
        return { ...prev, inventory_items: [...prev.inventory_items, { id: itemId, quantity: 1 }] };
      }
    });
  };

  const handleInventoryQuantity = (itemId, quantity) => {
    setFormData(prev => ({
      ...prev,
      inventory_items: prev.inventory_items.map(i => i.id === itemId ? { ...i, quantity: parseInt(quantity) || 1 } : i)
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scissors className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          Servicios
        </h3>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Nombre del Servicio</th>
                <th className="px-6 py-4 font-semibold">Precio</th>
                <th className="px-6 py-4 font-semibold">Duración</th>
                <th className="px-6 py-4 font-semibold">Inventario Asociado</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Cargando servicios...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    Aún no hay servicios registrados.
                  </td>
                </tr>
              ) : (
                services.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{service.name}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">${service.price}</td>
                    <td className="px-6 py-4">{service.duration} min</td>
                    <td className="px-6 py-4">
                      {service.inventory_items?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {service.inventory_items.map(item => (
                            <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {item.name} (x{item.pivot.quantity})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Ninguno</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {service.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-inset ring-emerald-600/20">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-semibold ring-1 ring-inset ring-slate-500/20">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleOpenModal(service)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Cards) */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
              Cargando...
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aún no hay servicios registrados.
            </div>
          ) : (
            services.map(service => (
              <div key={service.id} className="p-4 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{service.name}</h4>
                    <p className="text-sm text-slate-500">{service.duration} min</p>
                  </div>
                  {service.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold ring-1 ring-inset ring-emerald-600/20">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold ring-1 ring-inset ring-slate-500/20">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  ${service.price}
                </div>
                {service.inventory_items?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {service.inventory_items.map(item => (
                      <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {item.name} (x{item.pivot.quantity})
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                  <button onClick={() => handleOpenModal(service)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" /> Suspender
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
                  <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 30})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  Productos de Inventario que consume (Opcional)
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {inventoryItems.map(item => {
                    const isSelected = formData.inventory_items.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-2 rounded-md border ${isSelected ? 'border-amber-200 bg-white shadow-sm' : 'border-transparent hover:bg-slate-100'}`}>
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={!!isSelected}
                            onChange={() => handleToggleInventory(item.id)}
                            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" 
                          />
                          <span className="text-sm font-medium text-slate-800">{item.name}</span>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Cant:</span>
                            <input 
                              type="number" 
                              min="1" 
                              value={isSelected.quantity}
                              onChange={(e) => handleInventoryQuantity(item.id, e.target.value)}
                              className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {inventoryItems.length === 0 && (
                    <p className="text-sm text-slate-500 text-center">No hay productos en el inventario.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Servicio Activo</label>
              </div>
              <div className="pt-4 flex gap-3 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Suspend Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Suspender Servicio?</h3>
            <p className="text-sm text-slate-500 mb-6">
              El servicio <strong>{serviceToDelete?.name}</strong> será ocultado, pero se mantendrá el historial de las citas que lo usaron.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Sí, Suspender</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
