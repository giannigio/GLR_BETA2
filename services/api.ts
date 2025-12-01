import { Job, CrewMember, Location, InventoryItem, AppSettings, StandardMaterialList, CostCenter, F24Payment, Rental, Task } from '../types';

// Default Settings Fallback
const DEFAULT_SETTINGS: AppSettings = {
    companyName: 'GLR Productions Srl',
    pIva: '',
    address: '',
    bankName: '',
    iban: '',
    logoUrl: '',
    defaultDailyIndemnity: 50,
    kmCost: 0.5,
    defaultVatRate: 22,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarId: '',
    crewRoles: ['Project Manager', 'Audio Engineer', 'Light Operator', 'Video Tech'],
    permissions: {
        ADMIN: {
            canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: true,
            canManageJobs: true, canDeleteJobs: true, canViewBudget: true, canManageCrew: true, canManageExpenses: true, canManageInventory: true, canManageLocations: true, canManageRentals: true,
        },
        MANAGER: { canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: false, canManageJobs: true, canDeleteJobs: false, canViewBudget: true, canManageCrew: true, canManageExpenses: true, canManageInventory: true, canManageLocations: true, canManageRentals: true },
        TECH: { canViewDashboard: true, canViewJobs: true, canViewTasks: true, canViewKits: true, canViewRentals: true, canViewInventory: true, canViewLocations: true, canViewCrew: true, canViewExpenses: true, canViewCompany: false, canManageJobs: false, canDeleteJobs: false, canViewBudget: false, canManageCrew: false, canManageExpenses: false, canManageInventory: false, canManageLocations: false, canManageRentals: false }
    }
};

const API_URL = '/api';

const fetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(`${API_URL}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
};

export const api = {
  // AUTH
  login: async (email: string, pass: string) => {
      return fetchJson('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: pass })
      });
  },

  // JOBS
  getJobs: () => fetchJson('/jobs'),
  createJob: (job: Job) => fetchJson('/jobs', { method: 'POST', body: JSON.stringify(job) }),
  updateJob: (job: Job) => fetchJson(`/jobs/${job.id}`, { method: 'PUT', body: JSON.stringify(job) }),
  deleteJob: (id: string) => fetchJson(`/jobs/${id}`, { method: 'DELETE' }),

  // CREW
  getCrew: () => fetchJson('/crew'),
  createCrewMember: (member: Partial<CrewMember>) => fetchJson('/crew', { method: 'POST', body: JSON.stringify(member) }),
  updateCrewMember: (member: CrewMember) => fetchJson(`/crew/${member.id}`, { method: 'PUT', body: JSON.stringify(member) }),

  // LOCATIONS
  getLocations: () => fetchJson('/locations'),
  createLocation: (loc: Location) => fetchJson('/locations', { method: 'POST', body: JSON.stringify(loc) }),
  updateLocation: (loc: Location) => fetchJson(`/locations/${loc.id}`, { method: 'PUT', body: JSON.stringify(loc) }),
  deleteLocation: (id: string) => fetchJson(`/locations/${id}`, { method: 'DELETE' }),

  // INVENTORY
  getInventory: () => fetchJson('/inventory'),
  createInventoryItem: (item: InventoryItem) => fetchJson('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  updateInventoryItem: (item: InventoryItem) => fetchJson(`/inventory/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventoryItem: (id: string) => fetchJson(`/inventory/${id}`, { method: 'DELETE' }),

  // RENTALS
  getRentals: () => fetchJson('/rentals'),
  createRental: (rental: Rental) => fetchJson('/rentals', { method: 'POST', body: JSON.stringify(rental) }),
  updateRental: (rental: Rental) => fetchJson(`/rentals/${rental.id}`, { method: 'PUT', body: JSON.stringify(rental) }),
  deleteRental: (id: string) => fetchJson(`/rentals/${id}`, { method: 'DELETE' }),

  // STANDARD LISTS
  getStandardLists: () => fetchJson('/standard-lists'),
  createStandardList: (list: StandardMaterialList) => fetchJson('/standard-lists', { method: 'POST', body: JSON.stringify(list) }),
  updateStandardList: (list: StandardMaterialList) => fetchJson(`/standard-lists/${list.id}`, { method: 'PUT', body: JSON.stringify(list) }),
  deleteStandardList: (id: string) => fetchJson(`/standard-lists/${id}`, { method: 'DELETE' }),

  // SETTINGS
  getSettings: async () => {
      const data = await fetchJson('/settings');
      return Object.keys(data).length > 0 ? data : DEFAULT_SETTINGS;
  },
  updateSettings: (s: AppSettings) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(s) }),

  // NOTIFICATIONS
  getNotifications: () => fetchJson('/notifications'),

  // COMPANY MANAGEMENT
  getCostCenters: () => fetchJson('/cost-centers'),
  createCostCenter: (c: CostCenter) => fetchJson('/cost-centers', { method: 'POST', body: JSON.stringify(c) }),
  updateCostCenter: (c: CostCenter) => fetchJson(`/cost-centers/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCostCenter: (id: string) => fetchJson(`/cost-centers/${id}`, { method: 'DELETE' }),

  getF24Payments: () => fetchJson('/f24-payments'),
  createF24Payment: (f: F24Payment) => fetchJson('/f24-payments', { method: 'POST', body: JSON.stringify(f) }),
  deleteF24Payment: (id: string) => fetchJson(`/f24-payments/${id}`, { method: 'DELETE' }),

  // TASKS
  getTasks: () => fetchJson('/tasks'),
  createTask: (t: Task) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(t) }),
  updateTask: (t: Task) => fetchJson(`/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify(t) }),
  deleteTask: (id: string) => fetchJson(`/tasks/${id}`, { method: 'DELETE' })
};