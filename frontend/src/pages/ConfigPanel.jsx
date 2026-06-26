import { useState, useEffect } from 'react';
import { getSystemConfig, updateSystemConfig } from '../lib/api';
import { Settings, Save, Loader2, Award, Package, DollarSign, Clock, Plus, Trash2, Link, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function ConfigPanel({ onConfigUpdate }) {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemConfig();
      setConfig({
        ...data,
        loyalty_rewards: data.loyalty_rewards || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedConfig = await updateSystemConfig(config);
      setConfig(updatedConfig);
      if (onConfigUpdate) onConfigUpdate(updatedConfig);
      alert('Configuración guardada exitosamente');
    } catch (e) {
      alert('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ajustes del Sistema</h2>
          <p className="text-sm text-slate-500">Configura las reglas de negocio de tu barbería</p>
        </div>
      </div>

      {/* Enlace de Reservas Público */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <Link className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg text-slate-800">Enlace Público para Clientes</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            Comparte este enlace con tus clientes en WhatsApp o redes sociales para que ellos mismos puedan agendar sus citas. El sistema calculará el tiempo necesario según los servicios que elijan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm text-slate-700 w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {window.location.origin}/book/{user?.tenant_id}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${user?.tenant_id}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar Enlace'}
              </button>
              <a 
                href={`/book/${user?.tenant_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Abrir y probar el enlace"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Working Hours */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-800">Horario de Operación</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hora de Apertura (0-23)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="23"
                    value={config?.startHour ?? 8}
                    onChange={e => setConfig({...config, startHour: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-sm font-medium text-slate-500">:00</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hora de Cierre (0-23)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="23"
                    value={config?.endHour ?? 20}
                    onChange={e => setConfig({...config, endHour: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-sm font-medium text-slate-500">:00</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={config?.has_break || false}
                  onChange={e => setConfig({...config, has_break: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="font-medium text-slate-900">Añadir Hora de Descanso / Almuerzo</p>
                  <p className="text-sm text-slate-500">Bloqueará este horario para que los clientes no puedan agendar citas.</p>
                </div>
              </label>

              {config?.has_break && (
                <div className="flex gap-4 pl-8">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Inicio del Descanso (0-23)
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={config?.startHour || 0}
                        max={config?.endHour || 23}
                        value={config?.break_start ?? 13}
                        onChange={e => setConfig({...config, break_start: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-sm font-medium text-slate-500">:00</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fin del Descanso (0-23)
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min={(config?.break_start || 0) + 1}
                        max={config?.endHour || 23}
                        value={config?.break_end ?? 14}
                        onChange={e => setConfig({...config, break_end: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-sm font-medium text-slate-500">:00</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Esto definirá el tamaño y las horas visibles en la Agenda Diaria.
            </p>
          </div>
        </div>

        {/* Loyalty Program */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-lg text-slate-800">Programa de Lealtad</h3>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={config?.enableLoyalty || false}
                onChange={e => setConfig({...config, enableLoyalty: e.target.checked})}
                className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
              />
              <div>
                <p className="font-medium text-slate-900">Activar acumulación de puntos</p>
                <p className="text-sm text-slate-500">Los clientes ganarán 1 punto por cada cita completada.</p>
              </div>
            </label>

            {config?.enableLoyalty && (
              <div className="pl-8 pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Premios Disponibles
                </label>
                
                <div className="space-y-3 mb-4">
                  {(config.loyalty_rewards || []).map((reward, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Descripción del Premio (Ej. Corte Gratis)"
                            value={reward.name}
                            onChange={e => {
                              const newRewards = [...config.loyalty_rewards];
                              newRewards[index].name = e.target.value;
                              setConfig({...config, loyalty_rewards: newRewards});
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2">
                            <input 
                              type="number" 
                              min="1"
                              value={reward.points}
                              onChange={e => {
                                const newRewards = [...config.loyalty_rewards];
                                newRewards[index].points = parseInt(e.target.value) || 1;
                                setConfig({...config, loyalty_rewards: newRewards});
                              }}
                              className="w-full py-2 outline-none text-sm text-center"
                            />
                            <span className="text-xs text-slate-500 font-medium">pts</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newRewards = config.loyalty_rewards.filter((_, i) => i !== index);
                            setConfig({...config, loyalty_rewards: newRewards});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-end pr-12">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={reward.resets_points || false}
                            onChange={e => {
                              const newRewards = [...config.loyalty_rewards];
                              newRewards[index].resets_points = e.target.checked;
                              setConfig({...config, loyalty_rewards: newRewards});
                            }}
                            className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                          />
                          <span className="text-xs font-medium text-slate-600">Al reclamar este premio, los puntos del cliente volverán a cero</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  
                  {(config.loyalty_rewards || []).length === 0 && (
                    <p className="text-sm text-slate-500 italic py-2">No hay premios configurados. Añade uno para empezar.</p>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const current = config.loyalty_rewards || [];
                    setConfig({...config, loyalty_rewards: [...current, { name: '', points: 10, resets_points: false }]});
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Añadir Premio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inventory System */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-lg text-slate-800">Control de Inventario</h3>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={config?.enableInventory || false}
                onChange={e => setConfig({...config, enableInventory: e.target.checked})}
                className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
              />
              <div>
                <p className="font-medium text-slate-900">Descontar inventario automáticamente</p>
                <p className="text-sm text-slate-500">Al cobrar una cita, se descontarán los productos asociados a los servicios realizados.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Cash Register System */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-800">Caja Registradora</h3>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={config?.enableCashRegister || false}
                onChange={e => setConfig({...config, enableCashRegister: e.target.checked})}
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <div>
                <p className="font-medium text-slate-900">Activar Arqueo de Caja Diario</p>
                <p className="text-sm text-slate-500">Obliga a tener una caja abierta antes de cobrar citas. (Desactivado si trabajas solo y no lo necesitas).</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
