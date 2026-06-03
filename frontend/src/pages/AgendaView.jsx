import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAppointments, checkoutAppointment, createAppointment, updateAppointment, deleteAppointment, getClients, getBarbers, getServices } from '../lib/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, DollarSign, X, Edit2, Clock, UserX, Trash2 } from 'lucide-react';

export default function AgendaView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBarbers, setActiveBarbers] = useState([]);

  // Modal State
  const [checkoutApt, setCheckoutApt] = useState(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [claimedRewardPoints, setClaimedRewardPoints] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailsApt, setDetailsApt] = useState(null);

  // New Appointment Modal State
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({ id: null, client_id: '', barber_id: '', time: '10:00', service_ids: [], duration: 0 });
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  useEffect(() => {
    loadAppointmentsAndConfig();
  }, [selectedDate]);

  const loadAppointmentsAndConfig = async () => {
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const [aptData, confData, bData] = await Promise.all([
        getAppointments(formattedDate),
        import('../lib/api').then(m => m.getSystemConfig()),
        getBarbers()
      ]);
      setAppointments(aptData || []);
      setConfig(confData || null);
      setActiveBarbers((bData || []).filter(b => b.isActive));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewAptModal = async () => {
    setIsProcessing(true);
    try {
      const [cData, bData, sData] = await Promise.all([
        getClients(1, ''),
        getBarbers(),
        getServices()
      ]);
      setClients(cData.data || []);
      setBarbers(bData || []);
      setServices(sData || []);
      
      const activeBarbers = (bData || []).filter(b => b.isActive);
      const defaultBarber = activeBarbers.length === 1 ? activeBarbers[0].id : '';
      
      setFormData({ id: null, client_id: '', barber_id: defaultBarber, time: '10:00', service_ids: [], duration: 0 });
      setClientSearchTerm('');
      setShowNewAptModal(true);
    } catch (e) {
      alert("Error cargando datos para la cita.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd') + ' ' + formData.time + ':00';
      const payload = {
        client_id: formData.client_id,
        barber_id: formData.barber_id,
        date: formattedDate,
        duration: formData.duration,
        service_ids: formData.service_ids
      };

      if (formData.id) {
        await updateAppointment(formData.id, payload);
      } else {
        await createAppointment(payload);
      }

      setShowNewAptModal(false);
      loadAppointmentsAndConfig();
    } catch (e) {
      alert("Error al guardar la cita.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditAppointment = async (apt) => {
    setIsProcessing(true);
    try {
      const [cData, bData, sData] = await Promise.all([
        getClients(1, ''),
        getBarbers(),
        getServices()
      ]);
      setClients(cData.data || []);
      setBarbers(bData || []);
      setServices(sData || []);
      
      const timeStr = format(new Date(apt.date), 'HH:mm');
      
      setFormData({ 
        id: apt.id,
        client_id: apt.client_id, 
        barber_id: apt.barber_id, 
        time: timeStr, 
        service_ids: apt.services?.map(s => s.id) || [], 
        duration: apt.duration 
      });
      setClientSearchTerm(apt.client?.name || '');
      setShowNewAptModal(true);
    } catch (e) {
      alert("Error cargando datos para edición.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleServiceToggle = (id) => {
    setFormData(prev => {
      const newIds = prev.service_ids.includes(id) 
        ? prev.service_ids.filter(sId => sId !== id)
        : [...prev.service_ids, id];
        
      let newDuration = 0;
      newIds.forEach(sId => {
        const s = services.find(srv => srv.id === sId);
        if (s) newDuration += s.duration;
      });
        
      return { ...prev, service_ids: newIds, duration: newDuration };
    });
  };

  const handleClientChange = (e) => {
    const cId = parseInt(e.target.value);
    const client = clients.find(c => c.id === cId);
    if (client) {
      const defaultServices = client.services?.map(s => s.id) || [];
      let defaultDuration = client.customDuration || 0;
      
      if (!defaultDuration && defaultServices.length > 0) {
        defaultServices.forEach(sId => {
          const s = services.find(srv => srv.id === sId);
          if (s) defaultDuration += s.duration;
        });
      }

      setFormData(prev => ({ 
        ...prev, 
        client_id: e.target.value,
        service_ids: defaultServices,
        duration: defaultDuration
      }));
    } else {
      setFormData(prev => ({ ...prev, client_id: e.target.value, service_ids: [], duration: 0 }));
    }
  };

  const handleNoShow = async (aptId) => {
    setIsProcessing(true);
    try {
      await updateAppointment(aptId, { status: 'NO_SHOW' });
      setDetailsApt(null);
      loadAppointmentsAndConfig();
    } catch (e) {
      alert("Error al marcar inasistencia.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (aptId) => {
    if(!window.confirm('¿Estás seguro de cancelar y eliminar esta cita?')) return;
    setIsProcessing(true);
    try {
      await deleteAppointment(aptId);
      setDetailsApt(null);
      loadAppointmentsAndConfig();
    } catch (e) {
      alert("Error al cancelar la cita.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutApt) return;
    setIsProcessing(true);
    try {
      await checkoutAppointment(checkoutApt.id, {
        totalPrice: checkoutTotal,
        paymentMethod,
        claimedRewardPoints
      });
      setCheckoutApt(null);
      loadAppointmentsAndConfig(); // Recargar citas
    } catch (e) {
      console.error("Error al procesar checkout:", e);
      alert(e.response?.data?.message || "Hubo un error procesando el checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const prevDay = () => setSelectedDate(subDays(selectedDate, 1));

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          Agenda Diaria
        </h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <button onClick={prevDay} className="p-2 sm:p-3 hover:bg-slate-50 transition-colors text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-2 sm:px-4 py-2 font-semibold text-slate-900 border-x border-slate-200 min-w-[120px] sm:min-w-[140px] text-center capitalize text-sm sm:text-base">
              {format(selectedDate, "EEE, d MMM yyyy", { locale: es })}
            </div>
            <button onClick={nextDay} className="p-2 sm:p-3 hover:bg-slate-50 transition-colors text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button onClick={handleOpenNewAptModal} disabled={isProcessing} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50">
            <Plus className="w-5 h-5" />
            Nueva Cita
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
            <p>Cargando agenda...</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-auto bg-slate-50 relative">
            {/* Time Labels Column */}
            <div className="w-16 flex-shrink-0 bg-white border-r border-slate-200 sticky left-0 z-20">
              <div className="h-12 border-b border-slate-200 bg-slate-50"></div>
              {(() => {
                const startHour = config?.startHour ?? 8;
                const endHour = config?.endHour ?? 20;
                const hours = Array.from({length: endHour - startHour + 1}, (_, i) => i + startHour);
                return hours.map(h => (
                  <div key={h} className="h-[120px] relative border-b border-slate-100">
                    <span className="absolute -top-3 right-2 text-xs text-slate-500 font-bold bg-white px-1">
                      {h.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ));
              })()}
            </div>
            
            {/* Barbers Columns */}
            {activeBarbers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white">
                <UserX className="w-12 h-12 mb-4 text-slate-300" />
                <p>No hay barberos activos para mostrar la agenda.</p>
              </div>
            ) : (
              <div className={`flex flex-1 ${activeBarbers.length === 1 ? 'w-full' : 'min-w-max'}`}>
                {activeBarbers.map(barber => {
                  const startHour = config?.startHour ?? 8;
                  const endHour = config?.endHour ?? 20;
                  const hours = Array.from({length: endHour - startHour + 1}, (_, i) => i + startHour);
                  
                  return (
                    <div key={barber.id} className={`border-r border-slate-200 relative bg-white ${activeBarbers.length === 1 ? 'flex-1 min-w-[200px]' : 'w-64 flex-shrink-0'}`}>
                      {/* Barber Header */}
                      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-center font-bold text-slate-800 sticky top-0 z-10">
                        {barber.name}
                      </div>
                      
                      {/* Grid Background */}
                      <div className="relative">
                        {hours.map(h => (
                          <div key={h} className="h-[120px] border-b border-slate-100 relative box-border">
                            {/* Half-hour dashed line */}
                            <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-200"></div>
                          </div>
                        ))}
                        
                        {/* Appointments */}
                        {appointments.filter(a => a.barber_id === barber.id).map(apt => {
                          const date = new Date(apt.date);
                          const aptHour = date.getHours();
                          const aptMins = date.getMinutes();
                          
                          if (aptHour < startHour || aptHour > endHour) return null;
                          
                          const top = ((aptHour - startHour) * 120) + (aptMins * 2);
                          const height = apt.duration * 2;
                          const claimed = apt.client?.claimed_rewards || [];
                          const isReward = config?.enableLoyalty && apt.status === 'PENDING' && config.loyalty_rewards && config.loyalty_rewards.some(r => (apt.client?.points + 1) >= r.points && !claimed.includes(r.points));
                          
                          let bgClass = "bg-amber-50 border-amber-300 hover:bg-amber-100";
                          let textClass = "text-amber-900";
                          if (apt.status === 'COMPLETED') {
                            bgClass = "bg-emerald-50 border-emerald-300 hover:bg-emerald-100";
                            textClass = "text-emerald-900";
                          } else if (apt.status === 'NO_SHOW') {
                            bgClass = "bg-red-50 border-red-300 hover:bg-red-100 opacity-70";
                            textClass = "text-red-900 line-through";
                          }
                          
                          return (
                            <div 
                              key={apt.id}
                              onClick={() => setDetailsApt(apt)}
                              className={`absolute left-1 right-1 rounded-lg border shadow-sm p-2 overflow-hidden cursor-pointer transition-colors z-0 flex flex-col ${bgClass}`}
                              style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
                            >
                              <div className="flex justify-between items-start mb-0.5 gap-1">
                                <span className={`font-bold text-xs truncate ${textClass}`}>
                                  {apt.client?.name}
                                </span>
                                {isReward && <span title="¡Premio Disponible!" className="text-xs">🎁</span>}
                              </div>
                              <span className={`text-[10px] font-bold opacity-80 ${textClass}`}>
                                {format(date, 'HH:mm')}
                              </span>
                              {height >= 60 && (
                                <p className={`text-[10px] leading-tight opacity-90 line-clamp-2 ${textClass}`}>
                                  {apt.services?.map(s => s.name).join(', ')}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsApt && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Detalles de Cita</h3>
              <button onClick={() => setDetailsApt(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Cliente</p>
                  <p className="text-lg font-bold text-slate-900">{detailsApt.client?.name}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                  detailsApt.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  detailsApt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {detailsApt.status === 'PENDING' ? 'Pendiente' : 
                   detailsApt.status === 'COMPLETED' ? 'Completado' : 'No asistió'}
                </span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Hora</p>
                  <p className="font-semibold text-slate-900">{format(new Date(detailsApt.date), 'HH:mm')}</p>
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Duración</p>
                  <p className="font-semibold text-slate-900">{detailsApt.duration} min</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Servicios</p>
                <div className="flex flex-wrap gap-2">
                  {detailsApt.services?.map(svc => (
                    <span key={svc.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {svc.name} - ${svc.price}
                    </span>
                  ))}
                </div>
              </div>

              {config?.enableLoyalty && detailsApt.status === 'PENDING' && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-rose-800">Puntos del Cliente</p>
                    <p className="text-sm text-rose-600">Tiene {detailsApt.client?.points} pts (+1 por esta cita)</p>
                  </div>
                  {config.loyalty_rewards && config.loyalty_rewards.some(r => (detailsApt.client?.points + 1) >= r.points && !(detailsApt.client?.claimed_rewards || []).includes(r.points)) && (
                    <span className="text-xs font-bold bg-rose-200 text-rose-800 px-2 py-1 rounded-md">
                      ¡Premio Disponible!
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
              {detailsApt.status === 'PENDING' && (
                <>
                  <div className="flex gap-3">
                    <button 
                      disabled={isProcessing}
                      onClick={() => {
                        const baseTotal = detailsApt.services?.reduce((sum, s) => sum + parseFloat(s.price), 0) || 0;
                        setCheckoutTotal(baseTotal);
                        setCheckoutApt(detailsApt);
                        setClaimedRewardPoints(0);
                        setDetailsApt(null);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <DollarSign className="w-5 h-5" /> Checkout
                    </button>
                    
                    <button 
                      disabled={isProcessing}
                      onClick={() => {
                        handleEditAppointment(detailsApt);
                        setDetailsApt(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Edit2 className="w-5 h-5" /> Editar
                    </button>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleNoShow(detailsApt.id)}
                      className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      Marcar Inasistencia
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleCancel(detailsApt.id)}
                      className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Cancelar / Borrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutApt && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Checkout de Cita</h3>
              <p className="text-sm text-slate-500 mt-1">
                Finalizar servicio para <strong>{checkoutApt.client?.name}</strong>
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              
              {config?.enableLoyalty && config.loyalty_rewards && config.loyalty_rewards.some(r => (checkoutApt.client?.points + 1) >= r.points && !(checkoutApt.client?.claimed_rewards || []).includes(r.points)) && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
                  <div className="text-2xl mt-1">🎁</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-rose-800">¡Premios Disponibles!</h4>
                    <p className="text-sm text-rose-600 mt-1">El cliente tiene {checkoutApt.client?.points + 1} puntos.</p>
                    <select 
                      value={claimedRewardPoints} 
                      onChange={e => setClaimedRewardPoints(parseInt(e.target.value) || 0)}
                      className="mt-3 w-full p-2 border border-rose-300 rounded-lg text-rose-900 bg-white font-medium outline-none"
                    >
                      <option value={0}>No reclamar ningún premio hoy</option>
                      {config.loyalty_rewards
                        .filter(r => (checkoutApt.client?.points + 1) >= r.points && !(checkoutApt.client?.claimed_rewards || []).includes(r.points))
                        .map((r, i) => (
                          <option key={i} value={r.points}>{r.name} ({r.points} pts)</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Servicios:</span>
                  <span className="font-semibold text-slate-900">
                    {checkoutApt.services?.map(s => s.name).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total a cobrar:</span>
                  {claimedRewardPoints > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 line-through text-sm">
                        ${checkoutApt.services?.reduce((sum, s) => sum + parseFloat(s.price), 0)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">$</span>
                        <input 
                          type="number"
                          min="0"
                          value={checkoutTotal}
                          onChange={(e) => setCheckoutTotal(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-lg font-bold text-emerald-600 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">$</span>
                      <input 
                        type="number"
                        min={checkoutApt.services?.reduce((sum, s) => sum + parseFloat(s.price), 0) || 0}
                        value={checkoutTotal}
                        onChange={(e) => setCheckoutTotal(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-lg font-bold text-emerald-600 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {claimedRewardPoints === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'TRANSFER', 'CARD'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                          paymentMethod === method 
                            ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {method === 'CASH' ? 'Efectivo' : method === 'TRANSFER' ? 'Transferencia' : 'Tarjeta'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-amber-800 text-xs">
                <div className="mt-0.5 text-amber-500">ℹ️</div>
                <p>Al confirmar, se descontarán automáticamente los items del inventario asociados a los servicios y el cliente sumará puntos.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setCheckoutApt(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewAptModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{formData.id ? 'Editar Cita' : 'Nueva Cita'}</h3>
              <button onClick={() => setShowNewAptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <div className="mb-2">
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o teléfono..." 
                    value={clientSearchTerm}
                    onChange={e => setClientSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm text-slate-900 bg-slate-50"
                  />
                </div>
                <select required value={formData.client_id} onChange={handleClientChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-slate-900">
                  <option value="">Seleccione un cliente...</option>
                  {clients.filter(c => 
                    c.id === parseInt(formData.client_id) || 
                    c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
                    (c.phone && c.phone.includes(clientSearchTerm))
                  ).map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Barbero</label>
                <select required value={formData.barber_id} onChange={e => setFormData({...formData, barber_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-slate-900">
                  <option value="">Seleccione un barbero...</option>
                  {barbers.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Servicios</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
                <input required type="number" min="1" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-slate-900" />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setShowNewAptModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={isProcessing || formData.service_ids.length === 0} className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : formData.id ? 'Guardar Cambios' : 'Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
