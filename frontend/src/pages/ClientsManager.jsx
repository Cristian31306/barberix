import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, getServices, getSystemConfig } from '../lib/api';
import { Users, Plus, Search, Loader2, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';

export default function ClientsManager() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', points: 0, notes: '', customDuration: 0, service_ids: [] });
  const [config, setConfig] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    loadClients();
  }, [searchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [servicesData, configData] = await Promise.all([
          getServices(),
          getSystemConfig()
        ]);
        setServices(servicesData || []);
        setConfig(configData || null);
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitialData();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients(1, searchTerm);
      setClients(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        name: client.name, 
        phone: client.phone, 
        points: client.points || 0, 
        notes: client.notes || '',
        customDuration: client.customDuration || 0,
        service_ids: client.services?.map(s => s.id) || []
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', phone: '', points: 0, notes: '', customDuration: 0, service_ids: [] });
    }
    setShowModal(true);
  };

  const handleServiceToggle = (id) => {
    setFormData(prev => {
      const newIds = prev.service_ids.includes(id) 
        ? prev.service_ids.filter(sId => sId !== id)
        : [...prev.service_ids, id];
        
      // Calculate new total duration
      let newDuration = 0;
      newIds.forEach(sId => {
        const s = services.find(srv => srv.id === sId);
        if (s) newDuration += s.duration;
      });
      
      return { ...prev, service_ids: newIds, customDuration: newDuration };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      setShowModal(false);
      loadClients();
    } catch (e) {
      alert('Error al guardar el cliente');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteClient(clientToDelete.id);
      setShowDeleteModal(false);
      loadClients();
    } catch (e) {
      alert('Error al suspender el cliente');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          Clientes
        </h3>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o teléfono..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                {config?.enableLoyalty && <th className="px-6 py-4 font-semibold">Puntos</th>}
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Cargando clientes...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                    <td className="px-6 py-4">{client.phone}</td>
                    {config?.enableLoyalty && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                          {client.points} pts
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleOpenModal(client)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700 p-1">
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
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No se encontraron clientes.
            </div>
          ) : (
            clients.map(client => (
              <div key={client.id} className="p-4 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{client.name}</h4>
                    <p className="text-sm text-slate-500">{client.phone}</p>
                  </div>
                  {config?.enableLoyalty && (
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      {client.points} pts
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                  <button onClick={() => handleOpenModal(client)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              {config?.enableLoyalty && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Puntos Acumulados</label>
                  <input type="number" min="0" value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (Opcional)</label>
                <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900"></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Servicios Frecuentes</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {services.filter(s => s.isActive).map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-md border border-slate-100 hover:border-amber-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.service_ids.includes(s.id)}
                        onChange={() => handleServiceToggle(s.id)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" 
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.duration} min</p>
                      </div>
                      <div className="text-sm font-bold text-emerald-600">${s.price}</div>
                    </label>
                  ))}
                  {services.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No hay servicios disponibles.</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duración Estimada (minutos)</label>
                <p className="text-xs text-slate-500 mb-1">Puedes ajustar el tiempo calculado si el cliente tarda más o menos de lo normal.</p>
                <input type="number" min="0" value={formData.customDuration} onChange={e => setFormData({...formData, customDuration: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900" />
              </div>
              <div className="pt-4 flex gap-3">
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Suspender Cliente?</h3>
            <p className="text-sm text-slate-500 mb-6">
              El cliente <strong>{clientToDelete?.name}</strong> será ocultado del sistema, pero su historial de citas se mantendrá por seguridad y auditoría.
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
