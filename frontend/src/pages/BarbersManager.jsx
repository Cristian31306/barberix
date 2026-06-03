import { useState, useEffect } from 'react';
import { getBarbers, createBarber, updateBarber, deleteBarber, getBarberEarnings } from '../lib/api';
import { UserCircle, Plus, Loader2, Edit2, Trash2, AlertTriangle, X, DollarSign, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BarbersManager() {
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', commission_rate: 50, isActive: true, work_schedule: {} });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState(null);

  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [selectedBarberForEarnings, setSelectedBarberForEarnings] = useState(null);
  const [earningsDates, setEarningsDates] = useState({
    start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    setIsLoading(true);
    try {
      const data = await getBarbers();
      setBarbers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (barber = null) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({ name: barber.name, phone: barber.phone || '', email: barber.email || '', commission_rate: barber.commission_rate || 50, isActive: barber.isActive, work_schedule: barber.work_schedule || {} });
    } else {
      setEditingBarber(null);
      setFormData({ name: '', phone: '', email: '', commission_rate: 50, isActive: true, work_schedule: {} });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingBarber) {
        await updateBarber(editingBarber.id, formData);
      } else {
        await createBarber(formData);
      }
      setShowModal(false);
      loadBarbers();
    } catch (e) {
      alert('Error al guardar el barbero');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteBarber(barberToDelete.id);
      setShowDeleteModal(false);
      loadBarbers();
    } catch (e) {
      alert('Error al suspender el barbero');
    }
  };

  const loadEarnings = async (barber, dates) => {
    if (!barber) return;
    setIsLoadingEarnings(true);
    try {
      const data = await getBarberEarnings(barber.id, dates.start_date, dates.end_date);
      setEarningsData(data);
    } catch (e) {
      alert('Error al cargar liquidación');
    } finally {
      setIsLoadingEarnings(false);
    }
  };

  const handleOpenEarnings = (barber) => {
    setSelectedBarberForEarnings(barber);
    setEarningsData(null);
    setShowEarningsModal(true);
    loadEarnings(barber, earningsDates);
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          Barberos
        </h3>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Nuevo Barbero
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                <th className="px-6 py-4 font-semibold">Comisión</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Cargando barberos...
                  </td>
                </tr>
              ) : barbers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Aún no hay barberos registrados.
                  </td>
                </tr>
              ) : (
                barbers.map(barber => (
                  <tr key={barber.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{barber.name}</td>
                    <td className="px-6 py-4">{barber.phone || '-'}</td>
                    <td className="px-6 py-4 font-semibold">{barber.commission_rate}%</td>
                    <td className="px-6 py-4">
                      {barber.isActive ? (
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
                        <button onClick={() => handleOpenEarnings(barber)} className="text-emerald-600 hover:text-emerald-800 p-1" title="Ver Liquidación">
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(barber)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setBarberToDelete(barber); setShowDeleteModal(true); }} className="text-red-500 hover:text-red-700 p-1" title="Suspender">
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
          ) : barbers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aún no hay barberos registrados.
            </div>
          ) : (
            barbers.map(barber => (
              <div key={barber.id} className="p-4 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{barber.name}</h4>
                    <p className="text-sm text-slate-500">{barber.phone || 'Sin teléfono'}</p>
                  </div>
                  {barber.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold ring-1 ring-inset ring-emerald-600/20">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold ring-1 ring-inset ring-slate-500/20">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Comisión: <span className="text-emerald-600">{barber.commission_rate}%</span>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button onClick={() => handleOpenEarnings(barber)} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium px-2 py-1 bg-emerald-50 rounded-lg">
                    <DollarSign className="w-4 h-4" /> Pago
                  </button>
                  <button onClick={() => handleOpenModal(barber)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => { setBarberToDelete(barber); setShowDeleteModal(true); }} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
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
              <h3 className="font-bold text-lg text-slate-800">{editingBarber ? 'Editar Barbero' : 'Nuevo Barbero'}</h3>
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
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comisión (%)</label>
                <input type="number" min="0" max="100" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Barbero Activo (Disponible para citas)</label>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Días Laborales</label>
                <div className="flex flex-wrap gap-2">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                    const isActive = formData.work_schedule?.[day] === true;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            work_schedule: {
                              ...formData.work_schedule,
                              [day]: !isActive
                            }
                          })
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          isActive 
                            ? 'bg-amber-100 border-amber-200 text-amber-800' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Suspender Barbero?</h3>
            <p className="text-sm text-slate-500 mb-6">
              El barbero <strong>{barberToDelete?.name}</strong> será ocultado del sistema, pero su historial de citas se mantendrá por seguridad y auditoría.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Sí, Suspender</button>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Modal */}
      {showEarningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Liquidación de {selectedBarberForEarnings?.name}</h3>
                <p className="text-sm text-slate-500">Comisión actual: {selectedBarberForEarnings?.commission_rate}%</p>
              </div>
              <button onClick={() => setShowEarningsModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 flex gap-4 items-end bg-white">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                <input 
                  type="date" 
                  value={earningsDates.start_date}
                  onChange={(e) => setEarningsDates({...earningsDates, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                <input 
                  type="date" 
                  value={earningsDates.end_date}
                  onChange={(e) => setEarningsDates({...earningsDates, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <button 
                onClick={() => loadEarnings(selectedBarberForEarnings, earningsDates)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Calcular
              </button>
            </div>

            <div className="p-5 overflow-auto flex-1 bg-slate-50/50">
              {isLoadingEarnings ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                  <p>Calculando liquidación...</p>
                </div>
              ) : earningsData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Total Servicios</p>
                      <p className="text-2xl font-bold text-slate-800">{earningsData.appointments_count}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 mb-1">Ventas Generadas</p>
                      <p className="text-2xl font-bold text-slate-800">${Number(earningsData.total_sales).toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm col-span-2 md:col-span-1">
                      <p className="text-xs font-bold text-emerald-700 mb-1">Total a Pagar (Comisión)</p>
                      <p className="text-3xl font-black text-emerald-600">${Number(earningsData.total_earnings).toLocaleString()}</p>
                    </div>
                  </div>

                  {earningsData.appointments.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">Servicios</th>
                            <th className="px-4 py-3 font-medium text-right">Cobrado</th>
                            <th className="px-4 py-3 font-medium text-right">Comisión</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {earningsData.appointments.map(apt => (
                            <tr key={apt.id}>
                              <td className="px-4 py-3 text-slate-600">
                                {format(new Date(apt.date), "d MMM, yyyy HH:mm", { locale: es })}
                              </td>
                              <td className="px-4 py-3 text-slate-900 font-medium truncate max-w-[150px]">
                                {apt.services?.map(s => s.name).join(', ') || 'Servicio'}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                ${Number(apt.totalPrice).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                ${Number(apt.barber_earnings).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No hay citas completadas en este periodo.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setShowEarningsModal(false)} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
