import { useState, useEffect } from 'react';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../lib/api';
import { Package, Plus, Loader2, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';

export default function InventoryManager() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', stock: 0, minStock: 0 });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, stock: item.stock || 0, minStock: item.minStock || 0 });
    } else {
      setEditingItem(null);
      setFormData({ name: '', stock: 0, minStock: 0 });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, formData);
      } else {
        await createInventoryItem(formData);
      }
      setShowModal(false);
      loadInventory();
    } catch (e) {
      alert('Error al guardar el producto');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteInventoryItem(itemToDelete.id);
      setShowDeleteModal(false);
      loadInventory();
    } catch (e) {
      alert('Error al eliminar el producto');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          Inventario
        </h3>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Añadir Producto
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Stock Actual</th>
                <th className="px-6 py-4 font-semibold">Stock Mínimo</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Cargando inventario...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    Aún no hay productos en el inventario.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.minStock}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700 p-1">
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
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aún no hay productos en el inventario.
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-4 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Stock Actual</p>
                    <span className={`font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.stock}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  Stock Mínimo: {item.minStock}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                  <button onClick={() => handleOpenModal(item)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" /> Eliminar
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Actual</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
                  <input required type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar Producto?</h3>
            <p className="text-sm text-slate-500 mb-6">
              El producto <strong>{itemToDelete?.name}</strong> será ocultado del inventario.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
