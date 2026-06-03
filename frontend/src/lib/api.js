import api from './axios';

// --- POS ---
export const posCheckout = async (data) => {
  const response = await api.post('/pos/checkout', data);
  return response.data;
};

// Clients
export const getClients = async (page = 1, q = '') => {
  const res = await api.get('/clients', { params: { page, q } });
  return res.data;
};
export const createClient = async (data) => (await api.post('/clients', data)).data;
export const updateClient = async (id, data) => (await api.put(`/clients/${id}`, data)).data;
export const deleteClient = async (id) => (await api.delete(`/clients/${id}`)).data;

// Barbers
export const getBarbers = async () => (await api.get('/barbers')).data;
export const createBarber = async (data) => (await api.post('/barbers', data)).data;
export const updateBarber = async (id, data) => (await api.put(`/barbers/${id}`, data)).data;
export const deleteBarber = async (id) => (await api.delete(`/barbers/${id}`)).data;
export const getBarberEarnings = async (id, startDate, endDate) => (await api.get(`/barbers/${id}/earnings`, { params: { start_date: startDate, end_date: endDate } })).data;

// Services
export const getServices = async () => (await api.get('/services')).data;
export const createService = async (data) => (await api.post('/services', data)).data;
export const updateService = async (id, data) => (await api.put(`/services/${id}`, data)).data;
export const deleteService = async (id) => (await api.delete(`/services/${id}`)).data;

// Appointments
export const getAppointments = async (date) => {
  const res = await api.get('/appointments', { params: { date } });
  return res.data;
};
export const createAppointment = async (data) => (await api.post('/appointments', data)).data;
export const updateAppointment = async (id, data) => (await api.put(`/appointments/${id}`, data)).data;
export const deleteAppointment = async (id) => (await api.delete(`/appointments/${id}`)).data;

export const checkoutAppointment = async (id, data) => (await api.post(`/appointments/${id}/checkout`, data)).data;

// Inventory
export const getInventory = async () => (await api.get('/inventory')).data;
export const createInventoryItem = async (data) => (await api.post('/inventory', data)).data;
export const updateInventoryItem = async (id, data) => (await api.put(`/inventory/${id}`, data)).data;
export const deleteInventoryItem = async (id) => (await api.delete(`/inventory/${id}`)).data;

// System Config
export const getSystemConfig = async () => (await api.get('/config')).data;
export const updateSystemConfig = async (data) => (await api.put('/config', data)).data;

// Expenses
export const getExpenses = async (startDate, endDate) => {
  const res = await api.get('/expenses', { params: { start_date: startDate, end_date: endDate } });
  return res.data;
};
export const createExpense = async (data) => (await api.post('/expenses', data)).data;
export const updateExpense = async (id, data) => (await api.put(`/expenses/${id}`, data)).data;
export const deleteExpense = async (id) => (await api.delete(`/expenses/${id}`)).data;

// Dashboard
export const getDashboardMetrics = async (startDate, endDate) => {
  const res = await api.get('/dashboard/metrics', { params: { start_date: startDate, end_date: endDate } });
  return res.data;
};

// Cash Register
export const getCurrentCashRegister = async () => (await api.get('/cash-register/current')).data;
export const openCashRegister = async (data) => (await api.post('/cash-register/open', data)).data;
export const closeCashRegister = async (data) => (await api.post('/cash-register/close', data)).data;
export const getCashRegisterHistory = async () => (await api.get('/cash-register/history')).data;
