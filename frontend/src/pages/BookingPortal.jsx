import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scissors, Clock, UserCircle, CalendarDays, CheckCircle2, ChevronRight, Loader2, DollarSign } from 'lucide-react';
import { format, addDays, startOfToday, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BookingPortal() {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tenant, setTenant] = useState(null);
  const [config, setConfig] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);

  // Booking State
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchTenantInfo();
  }, [tenantId]);

  const fetchTenantInfo = async () => {
    try {
      const baseUrl = import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';
      const response = await fetch(`${baseUrl}/public/booking-info/${tenantId}`);
      if (!response.ok) throw new Error('No se pudo cargar la información de la barbería.');
      
      const data = await response.json();
      setTenant(data.tenant);
      setConfig(data.config);
      setBarbers(data.barbers);
      setServices(data.services);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create date object combining selectedDate and selectedTime
      const [hours, minutes] = selectedTime.split(':');
      let finalDate = new Date(selectedDate);
      finalDate = setHours(finalDate, parseInt(hours, 10));
      finalDate = setMinutes(finalDate, parseInt(minutes, 10));

      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

      const payload = {
        client_name: clientData.name,
        client_phone: clientData.phone,
        client_email: clientData.email,
        barber_id: selectedBarber.id,
        date: format(finalDate, "yyyy-MM-dd HH:mm:ss"),
        duration: totalDuration,
        service_ids: selectedServices.map(s => s.id)
      };

      const baseUrl = import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';
      const response = await fetch(`${baseUrl}/public/book/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al confirmar la reserva.');
      
      setBookingSuccess(true);
      setStep(5);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
        <p>Cargando portal de reservas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Lo sentimos</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Calculate totals
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);

  // Generate Available Times based on config
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = config?.startHour || 9;
    const endHour = config?.endHour || 19;
    const hasBreak = config?.has_break || false;
    const breakStart = config?.break_start || 13;
    const breakEnd = config?.break_end || 14;
    
    for (let h = startHour; h < endHour; h++) {
      if (hasBreak && h >= breakStart && h < breakEnd) {
        continue;
      }
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  // Next 14 days for date picker
  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center p-1 border border-white/20 shadow-sm">
              <img src="/logo.png" alt="Barberix Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-white tracking-tight">{tenant.name}</span>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full">
            Paso {step} de 4
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">¿Qué te vas a hacer?</h1>
            <p className="text-slate-400 mb-8">Selecciona uno o más servicios para tu cita.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map(service => {
                const isSelected = selectedServices.find(s => s.id === service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceToggle(service)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {service.name}
                      </h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {Number(service.price).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration} min
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">¿Con quién?</h1>
            <p className="text-slate-400 mb-8">Selecciona tu barbero de preferencia.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {barbers.map(barber => {
                const isSelected = selectedBarber?.id === barber.id;
                return (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {barber.name.charAt(0)}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className={`font-semibold text-lg ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {barber.name}
                      </h3>
                      <p className="text-sm text-slate-500">Barbero Profesional</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">¿Cuándo?</h1>
            <p className="text-slate-400 mb-8">Elige el día y la hora de tu cita.</p>
            
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Días Disponibles</h3>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {availableDates.map(date => {
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 snap-start w-20 py-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-medium uppercase mb-1">{format(date, 'EEE', { locale: es })}</span>
                      <span className="text-2xl font-bold">{format(date, 'd')}</span>
                      <span className="text-xs mt-1">{format(date, 'MMM', { locale: es })}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Horas Disponibles</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map(time => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-xl border font-medium transition-all text-sm ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-slate-500'
                      }`}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">Tus Datos</h1>
            <p className="text-slate-400 mb-8">Ingresa tus datos para confirmar la reserva.</p>
            
            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={clientData.name}
                  onChange={e => setClientData({...clientData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Teléfono (WhatsApp)</label>
                <input 
                  type="tel" 
                  required
                  value={clientData.phone}
                  onChange={e => setClientData({...clientData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ej. 3001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  value={clientData.email}
                  onChange={e => setClientData({...clientData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="juan@email.com"
                />
              </div>
            </form>

            {/* Summary Card */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-900/40 border border-emerald-500/20">
              <h3 className="text-lg font-bold text-white mb-4">Resumen de tu cita</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Barbero</span>
                  <span className="font-semibold text-white">{selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Fecha y Hora</span>
                  <span className="font-semibold text-white">
                    {format(selectedDate, "d MMM, yyyy", { locale: es })} a las {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400 text-base">Total a pagar en local</span>
                  <span className="font-bold text-xl text-emerald-400">${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && bookingSuccess && (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">¡Cita Confirmada!</h1>
            <p className="text-slate-400 text-lg mb-8 max-w-md">
              Te esperamos el <strong className="text-white">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</strong> a las <strong className="text-white">{selectedTime}</strong> con <strong className="text-white">{selectedBarber?.name}</strong>.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/10"
            >
              Agendar otra cita
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar (Navigation) */}
      {step < 5 && (
        <div className="fixed bottom-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total</span>
              <span className="text-lg font-bold text-emerald-400">
                ${totalPrice.toLocaleString()} <span className="text-sm font-normal text-slate-500 ml-1">({totalDuration} min)</span>
              </span>
            </div>
            
            <div className="flex gap-3">
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                >
                  Volver
                </button>
              )}
              
              {step < 4 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && selectedServices.length === 0) || (step === 2 && !selectedBarber) || (step === 3 && (!selectedDate || !selectedTime))}
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  Siguiente <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleBooking}
                  disabled={isSubmitting || !clientData.name || !clientData.phone}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
