import { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../lib/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Plus, Loader2, Edit2, Trash2, X } from 'lucide-react';

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({ description: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'Insumos' });

  const categories = ['Insumos', 'Servicios', 'Nómina', 'Mantenimiento', 'Marketing', 'Otro'];

  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getExpenses(startDate, endDate);
      setExpenses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({ 
        description: expense.description, 
        amount: expense.amount, 
        date: expense.date, 
        category: expense.category 
      });
    } else {
      setEditingExpense(null);
      setFormData({ description: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'Insumos' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
      } else {
        await createExpense(formData);
      }
      setShowModal(false);
      loadExpenses();
    } catch (e) {
      alert('Error al guardar el gasto');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      try {
        await deleteExpense(id);
        loadExpenses();
      } catch (e) {
        alert('Error al eliminar el gasto');
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
          Gastos
        </h3>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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

          <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Registrar Gasto
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    Cargando gastos...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No hay gastos registrados en este periodo.
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {format(new Date(expense.date), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">
                      ${parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleOpenModal(expense)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 p-1">
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
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
              Cargando...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay gastos registrados en este periodo.
            </div>
          ) : (
            expenses.map(expense => (
              <div key={expense.id} className="p-4 bg-white flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{expense.description}</h4>
                    <p className="text-xs text-slate-500">
                      {format(new Date(expense.date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium mb-1">
                      {expense.category}
                    </span>
                  </div>
                </div>
                <div className="text-lg font-bold text-rose-600">
                  ${parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-50">
                  <button onClick={() => handleOpenModal(expense)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDelete(expense.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" /> Eliminar
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
              <h3 className="font-bold text-lg text-slate-800">{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input required autoFocus type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Ej. Pago de luz" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($)</label>
                  <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || ''})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
