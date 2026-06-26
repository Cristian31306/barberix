import { useState, useEffect } from 'react';
import { Plus, Check, X, Shield, RefreshCw, Loader2, Store, Link, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import api from '../lib/axios';

export default function TenantsManager() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Tenant form state
  const [showNewModal, setShowNewModal] = useState(false);

  // Password reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({ userId: null, new_password: '' });

  // Subscription renew state
  const [showSubModal, setShowSubModal] = useState(false);
  const [subData, setSubData] = useState({ tenantId: null, subscription_ends_at: '' });

  // Copy link state
  const [copiedId, setCopiedId] = useState(null);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/superadmin/tenants');
      setTenants(res.data);
    } catch (err) {
      setError('Error al cargar las barberías');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateSuccess = () => {
    setShowNewModal(false);
    fetchTenants();
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!confirm(`¿Estás seguro de querer cambiar el estado a ${newStatus}?`)) return;
    
    try {
      await api.put(`/superadmin/tenants/${id}/status`, { status: newStatus });
      fetchTenants();
    } catch (err) {
      alert('Error al cambiar el estado');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/superadmin/users/${resetData.userId}/password`, { new_password: resetData.new_password });
      setShowResetModal(false);
      setResetData({ userId: null, new_password: '' });
      alert('Contraseña actualizada exitosamente');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar contraseña');
    }
  };

  const handleRenewSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/superadmin/tenants/${subData.tenantId}/subscription`, { subscription_ends_at: subData.subscription_ends_at });
      setShowSubModal(false);
      setSubData({ tenantId: null, subscription_ends_at: '' });
      fetchTenants();
      alert('Suscripción renovada exitosamente');
    } catch (err) {
      alert('Error al renovar suscripción');
    }
  };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const daysLeft = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 7 && daysLeft >= 0;
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-slate-800">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Store className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Gestión de Barberías (Inquilinos)</h2>
            <p className="text-sm text-slate-500">Administra todos los negocios suscritos al sistema.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Barbería
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{tenant.name}</h3>
                <div className="flex gap-2 flex-wrap mt-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tenant.status === 'active' ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                    {tenant.status === 'active' ? 'Activo' : 'Suspendido'}
                  </span>
                  {tenant.subscription_ends_at && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isExpired(tenant.subscription_ends_at) ? 'bg-red-100 text-red-700' : isExpiringSoon(tenant.subscription_ends_at) ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      Vence: {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => handleStatusChange(tenant.id, tenant.status)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${tenant.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
              >
                {tenant.status === 'active' ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
            
            <div className="mb-4">
              <button onClick={() => { setSubData({ tenantId: tenant.id, subscription_ends_at: tenant.subscription_ends_at || '' }); setShowSubModal(true); }} className="text-xs font-medium text-amber-600 hover:text-amber-800 underline">
                Renovar Suscripción
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 mb-4 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-slate-500 truncate font-mono">{window.location.origin}/book/{tenant.id}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/book/${tenant.id}`);
                    setCopiedId(tenant.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Copiar Enlace"
                >
                  {copiedId === tenant.id ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`/book/${tenant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                  title="Abrir Enlace"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administradores</p>
              {tenant.users?.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <button 
                    onClick={() => { setResetData({...resetData, userId: u.id}); setShowResetModal(true); }}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    title="Resetear Contraseña"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Barbería */}
      {showNewModal && (
        <CreateTenantModal onClose={() => setShowNewModal(false)} onSuccess={handleCreateSuccess} />
      )}

      {/* Modal Renovar Suscripción */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" /> Renovar Plan
              </h3>
            </div>
            <form onSubmit={handleRenewSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Fecha de Vencimiento</label>
                <input required type="date" value={subData.subscription_ends_at} onChange={e => setSubData({...subData, subscription_ends_at: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" />
              </div>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => {
                  const d = new Date(); d.setMonth(d.getMonth() + 1);
                  setSubData({...subData, subscription_ends_at: d.toISOString().split('T')[0]});
                }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700">+1 Mes</button>
                <button type="button" onClick={() => {
                  const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                  setSubData({...subData, subscription_ends_at: d.toISOString().split('T')[0]});
                }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700">+1 Año</button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSubModal(false)} className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" /> Nueva Contraseña
              </h3>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Temporal</label>
                <input required minLength={6} type="password" value={resetData.new_password} onChange={e => setResetData({...resetData, new_password: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" placeholder="mínimo 6 caracteres" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTenantModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tenant_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    subscription_ends_at: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/superadmin/tenants', formData);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la barbería');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" /> Registrar Barbería
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Barbería</label>
            <input autoFocus name="tenant_name" required type="text" value={formData.tenant_name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" placeholder="Ej. The Gentleman's Club" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento del Plan</label>
            <input name="subscription_ends_at" required type="date" value={formData.subscription_ends_at} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => {
                const d = new Date(); d.setMonth(d.getMonth() + 1);
                setFormData({...formData, subscription_ends_at: d.toISOString().split('T')[0]});
              }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 border border-slate-200">+1 Mes</button>
              <button type="button" onClick={() => {
                const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                setFormData({...formData, subscription_ends_at: d.toISOString().split('T')[0]});
              }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700 border border-slate-200">+1 Año</button>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Datos del Dueño</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input name="admin_name" required type="text" value={formData.admin_name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo (Email de acceso)</label>
                <input name="admin_email" required type="email" value={formData.admin_email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input name="admin_password" required minLength={6} type="password" value={formData.admin_password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-900" />
              </div>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
            <button disabled={loading} type="submit" className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-md transition-all disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

