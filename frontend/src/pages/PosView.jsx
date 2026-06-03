import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Package, Loader2, AlertTriangle, UserCircle } from 'lucide-react';
import { getInventory, posCheckout, getClients } from '../lib/api';

export default function PosView() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Client selection (Optional)
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, TRANSFER

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, clientsData] = await Promise.all([
        getInventory(),
        getClients(1, '') // Load first page of clients for quick select
      ]);
      // Only show items with stock
      setInventory(invData.filter(item => item.stock_quantity > 0));
      setClients(clientsData.data || []);
    } catch (error) {
      console.error('Error loading POS data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) {
          alert('No hay más stock disponible de este producto.');
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQ = item.quantity + delta;
          if (newQ > item.stock_quantity) {
             alert('No hay más stock disponible.');
             return item;
          }
          if (newQ < 1) return item; // Handled by remove
          return { ...item, quantity: newQ };
        }
        return item;
      });
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        client_id: selectedClient || null,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          inventory_item_id: item.id,
          quantity: item.quantity
        }))
      };

      await posCheckout(payload);
      
      // Success
      setCart([]);
      setShowCheckoutModal(false);
      setSelectedClient('');
      loadData(); // Refresh inventory stock
      
      alert('Venta registrada con éxito.');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Error al procesar la venta';
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] relative">
      {/* Left Panel: Products Grid */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Catálogo de Productos
          </h2>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p>Cargando inventario...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
              <Package className="w-12 h-12 mb-4 text-slate-300" />
              <p>No hay productos con stock disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventory.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between aspect-square"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{item.name}</h3>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="font-bold text-indigo-700">${Number(item.price).toLocaleString()}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                      Stock: {item.stock_quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px] lg:h-auto shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            Carrito
          </h2>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm">Selecciona productos para agregarlos al carrito.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-center py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 text-sm truncate">{item.name}</h4>
                    <p className="text-emerald-600 font-semibold text-sm">${Number(item.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-1 text-sm font-medium w-8 text-center bg-white border-x border-slate-200">
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Selection (Optional) */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <UserCircle className="w-3.5 h-3.5" /> Cliente (Opcional)
            </label>
            <select 
              value={selectedClient} 
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Cliente Ocasional</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          </div>
        )}

        {/* Checkout Footer */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium text-sm">Total a cobrar:</span>
            <span className="text-3xl font-black text-emerald-600">${total.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            Cobrar Total
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1 text-center">Confirmar Cobro</h3>
            <p className="text-center text-slate-500 mb-6 text-sm">Elige el método de pago para finalizar.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
              <span className="block text-slate-500 text-xs font-medium mb-1">Monto a cobrar</span>
              <span className="block text-3xl font-black text-emerald-600">${total.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-colors ${
                  paymentMethod === 'CASH' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-bold">Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-colors ${
                  paymentMethod === 'CARD' 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold">Tarjeta</span>
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-colors ${
                  paymentMethod === 'TRANSFER' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-xs font-bold">Transfer</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCheckoutModal(false)} 
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCheckout} 
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
