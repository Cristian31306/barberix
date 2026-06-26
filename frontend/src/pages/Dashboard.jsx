import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Scissors, CalendarDays, Users, LayoutDashboard, Settings, Package, Store, DollarSign, Archive, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';

import AgendaView from './AgendaView';
import ClientsManager from './ClientsManager';
import ServicesManager from './ServicesManager';
import BarbersManager from './BarbersManager';
import InventoryManager from './InventoryManager';
import FinanceDashboard from './FinanceDashboard';
import ExpensesManager from './ExpensesManager';
import CashRegisterManager from './CashRegisterManager';
import TenantsManager from './TenantsManager';
import ConfigPanel from './ConfigPanel';

import PosView from './PosView';

export default function Dashboard() {
  const { user, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetchUser();
    import('../lib/api').then(api => {
      api.getSystemConfig().then(conf => setConfig(conf)).catch(console.error);
    });
  }, [fetchUser]);

  usePushNotifications(!!user);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        // Play notification sound
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user || !config) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
      Cargando...
    </div>
  );

  const isSuperAdmin = user.role === 'superadmin';

  let navigation = isSuperAdmin ? [
    { id: 'tenants', name: 'Suscripciones', icon: Store }
  ] : [
    { id: 'dashboard', name: 'Resumen', icon: LayoutDashboard },
    { id: 'agenda', name: 'Agenda', icon: CalendarDays },
    { id: 'pos', name: 'Punto de Venta', icon: ShoppingCart },
    { id: 'clients', name: 'Clientes', icon: Users },
    { id: 'barbers', name: 'Barberos', icon: Users },
    { id: 'services', name: 'Servicios', icon: Scissors },
    { id: 'inventory', name: 'Inventario', icon: Package },
    { id: 'expenses', name: 'Gastos', icon: DollarSign },
    { id: 'cashregister', name: 'Caja', icon: Archive },
    { id: 'settings', name: 'Ajustes', icon: Settings },
  ];

  if (!isSuperAdmin && (!config || !config.enableCashRegister)) {
    navigation = navigation.filter(n => n.id !== 'cashregister');
  }
  
  if (!isSuperAdmin && (!config || !config.enableInventory)) {
    navigation = navigation.filter(n => n.id !== 'pos' && n.id !== 'inventory');
  }

  // Asegurarnos de que el superadmin no empiece en agenda
  if (isSuperAdmin && activeTab === 'agenda') {
    setActiveTab('tenants');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100/50 border border-amber-200/50 flex items-center justify-center p-1">
            <img src="/logo.png" alt="Barberix Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Barberix</span>
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col shadow-sm z-10 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100/50 border border-amber-200/50 flex items-center justify-center p-1">
            <img src="/logo.png" alt="Barberix Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">Barberix</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-amber-50 text-amber-700 border border-amber-100/50' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-8 sticky top-0 z-0 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            {navigation.find(n => n.id === activeTab)?.name}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs font-medium text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {user.tenant && user.tenant.subscription_ends_at && (
          (() => {
            const daysLeft = (new Date(user.tenant.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24);
            if (daysLeft <= 7 && daysLeft >= 0) {
              return (
                <div className="bg-orange-50 border-b border-orange-200 px-4 md:px-8 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <p className="text-sm text-orange-800 font-medium">
                    Tu suscripción vence en {Math.ceil(daysLeft)} días ({new Date(user.tenant.subscription_ends_at).toLocaleDateString()}). Por favor contacta a soporte para renovar tu plan.
                  </p>
                </div>
              );
            } else if (daysLeft < 0) {
              return (
                <div className="bg-red-50 border-b border-red-200 px-4 md:px-8 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-sm text-red-800 font-medium">
                    Tu suscripción ha vencido. Ciertas funciones pueden estar limitadas. Por favor renueva tu plan.
                  </p>
                </div>
              );
            }
            return null;
          })()
        )}
        
        <div className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto w-full">
            {/* Mobile Title */}
            <h2 className="md:hidden text-2xl font-bold text-slate-800 mb-6">
              {navigation.find(n => n.id === activeTab)?.name}
            </h2>
            {activeTab === 'dashboard' && <FinanceDashboard />}
            {activeTab === 'agenda' && <AgendaView />}
            {activeTab === 'pos' && <PosView />}
            {activeTab === 'clients' && <ClientsManager />}
            {activeTab === 'barbers' && <BarbersManager />}
            {activeTab === 'services' && <ServicesManager />}
            {activeTab === 'inventory' && <InventoryManager />}
            {activeTab === 'expenses' && <ExpensesManager />}
            {activeTab === 'cashregister' && <CashRegisterManager />}
            {activeTab === 'tenants' && <TenantsManager />}
            {activeTab === 'settings' && <ConfigPanel onConfigUpdate={setConfig} />}
          </div>
        </div>
      </main>

      {/* Mobile Menu Drawer (Más) */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-white shadow-xl animate-in slide-in-from-left">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-lg">Más Opciones</span>
              <button onClick={() => setShowMobileMenu(false)} className="text-slate-500 hover:text-slate-900 p-2">
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navigation.slice(3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-3 font-medium transition-colors ${
                    activeTab === item.id 
                      ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-500' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navigation.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              activeTab === item.id 
                ? 'text-amber-600' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        ))}
        {navigation.length > 3 && (
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-500 hover:text-slate-900"
          >
            <div className="w-5 h-5 flex items-center justify-center gap-0.5">
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
            </div>
            <span className="text-[10px] font-medium">Más</span>
          </button>
        )}
      </nav>
    </div>
  );
}
