import { useState, useEffect } from 'react';
import { getCurrentCashRegister, openCashRegister, closeCashRegister, getCashRegisterHistory } from '../lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Loader2, Lock, Unlock, History } from 'lucide-react';

export default function CashRegisterManager() {
  const [currentRegister, setCurrentRegister] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const [initialBalance, setInitialBalance] = useState('');
  const [finalBalance, setFinalBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const conf = await import('../lib/api').then(m => m.getSystemConfig());
      setConfig(conf);
      
      if (conf?.enableCashRegister) {
        const current = await getCurrentCashRegister();
        setCurrentRegister(current);
        
        const hist = await getCashRegisterHistory();
        setHistory(hist);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await openCashRegister({ initial_balance: parseFloat(initialBalance) });
      setInitialBalance('');
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al abrir caja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await closeCashRegister({ final_balance: parseFloat(finalBalance), notes });
      
      // Mostrar resumen rápido de diferencias si las hay
      if (res.difference !== 0) {
        alert(`Caja cerrada con una diferencia de $${res.difference.toFixed(2)}`);
      } else {
        alert('Caja cuadrada perfectamente.');
      }

      setFinalBalance('');
      setNotes('');
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p>Cargando información de caja...</p>
      </div>
    );
  }

  if (config && !config.enableCashRegister) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-center mt-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <DollarSign className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Caja Registradora Desactivada</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          La función de Arqueo de Caja está actualmente apagada. Si deseas llevar un control diario de efectivo de tu barbería, puedes activarla en los Ajustes del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Arqueo de Caja</h2>
          <p className="text-sm text-slate-500">Controla el efectivo de tu negocio día a día</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('current')}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'current' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {currentRegister ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Caja Actual
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Cierres
        </button>
      </div>

      {activeTab === 'current' && (
        <div className="mt-6">
          {!currentRegister ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">La caja está cerrada</h3>
              <p className="text-slate-500 mb-6 text-sm">Debes abrir la caja con una base de efectivo antes de poder facturar servicios.</p>
              
              <form onSubmit={handleOpen} className="space-y-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo Inicial (Base) $</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    autoFocus
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-center"
                    placeholder="0.00"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                  Abrir Caja
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Caja Abierta</h3>
                    <p className="text-xs text-slate-500">Desde: {format(new Date(currentRegister.opened_at), "d MMM, hh:mm a", { locale: es })}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Base Inicial</span>
                    <span className="font-medium">${parseFloat(currentRegister.initial_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Ventas en Efectivo (Hoy)</span>
                    <span className="font-medium text-emerald-600">+ ${(parseFloat(currentRegister.expected_balance) - parseFloat(currentRegister.initial_balance)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl mt-4">
                    <p className="text-sm text-slate-500 mb-1 font-medium">Efectivo Esperado en Caja</p>
                    <p className="text-3xl font-bold text-slate-900">
                      ${parseFloat(currentRegister.expected_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white">
                <h3 className="text-lg font-bold mb-2">Cerrar Turno</h3>
                <p className="text-slate-400 text-sm mb-6">Cuenta el efectivo físico en tu cajón e ingrésalo aquí para cuadrar la caja.</p>
                
                <form onSubmit={handleClose} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Efectivo Real (Físico) $</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      required 
                      value={finalBalance}
                      onChange={(e) => setFinalBalance(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-center text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Notas / Observaciones</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-white h-20"
                      placeholder="Ej. Faltaron $10 de cambio..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    Cerrar Caja
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Vista Desktop (Tabla) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">Fecha Cierre</th>
                  <th className="px-6 py-4 font-semibold">Base Inicial</th>
                  <th className="px-6 py-4 font-semibold">Efectivo Final</th>
                  <th className="px-6 py-4 font-semibold">Diferencia</th>
                  <th className="px-6 py-4 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.filter(h => h.status === 'CLOSED').length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No hay historial de cierres de caja.
                    </td>
                  </tr>
                ) : (
                  history.filter(h => h.status === 'CLOSED').map(register => {
                    const diff = parseFloat(register.final_balance) - parseFloat(register.expected_balance);
                    return (
                      <tr key={register.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium whitespace-nowrap text-sm">
                          {format(new Date(register.closed_at), "d MMM yyyy - hh:mm a", { locale: es })}
                        </td>
                        <td className="px-6 py-4">
                          ${parseFloat(register.initial_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          ${parseFloat(register.final_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          {diff === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                              Cuadrado
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              diff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {diff > 0 ? '+' : '-'}${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {register.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil (Cards) */}
          <div className="md:hidden divide-y divide-slate-100">
            {history.filter(h => h.status === 'CLOSED').length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay historial de cierres de caja.
              </div>
            ) : (
              history.filter(h => h.status === 'CLOSED').map(register => {
                const diff = parseFloat(register.final_balance) - parseFloat(register.expected_balance);
                return (
                  <div key={register.id} className="p-4 bg-white flex flex-col gap-2">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-900 text-sm">
                        {format(new Date(register.closed_at), "d MMM yyyy - hh:mm a", { locale: es })}
                      </div>
                      <div>
                        {diff === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Cuadrado
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            diff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {diff > 0 ? '+' : '-'}${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Base Inicial:</span>
                      <span className="font-medium text-slate-700">${parseFloat(register.initial_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Efectivo Final:</span>
                      <span className="font-bold text-slate-900">${parseFloat(register.final_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {register.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-500 italic">
                        Nota: {register.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
