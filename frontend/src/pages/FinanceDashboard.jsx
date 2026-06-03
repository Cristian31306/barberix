import { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../lib/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Users, Loader2 } from 'lucide-react';

export default function FinanceDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range state
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    loadMetrics();
  }, [startDate, endDate]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardMetrics(startDate, endDate);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
        <p>Cargando métricas financieras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Financiero</h2>
          <p className="text-sm text-slate-500">Resumen de ingresos y gastos de tu barbería</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm px-2 py-1 outline-none text-slate-700 bg-transparent"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm px-2 py-1 outline-none text-slate-700 bg-transparent"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-slate-900">
                ${metrics?.income?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Gastos Totales</p>
              <h3 className="text-2xl font-bold text-slate-900">
                ${metrics?.expenses?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        {/* Neto */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Ganancia Neta</p>
              <h3 className="text-2xl font-bold text-white">
                ${metrics?.net_profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Top Barbers */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-lg text-slate-800">Rendimiento por Barbero</h3>
          </div>
        </div>
        <div className="p-5">
          {metrics?.top_barbers?.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay datos suficientes en este periodo.</p>
          ) : (
            <div className="space-y-4">
              {metrics?.top_barbers?.map((barber, index) => (
                <div key={barber.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{barber.name}</h4>
                      <p className="text-sm text-slate-500">{barber.total_cuts} servicios completados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 text-lg">
                      ${barber.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Generado</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
