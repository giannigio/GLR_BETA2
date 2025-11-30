




import { Job, CrewMember, Location, InventoryItem, AppSettings, Notification, JobStatus, CrewType, CrewRole, ApprovalStatus, VehicleType, StandardMaterialList, CostCenter, F24Payment, Rental, RentalStatus, Task } from '../types';

// --- MOCK DATA FOR DEMO MODE ---

let MOCK_SETTINGS: AppSettings = {
    companyName: 'GLR Productions Srl',
    pIva: '12345678901',
    address: 'Via Roma 1, Milano',
    bankName: 'Intesa Sanpaolo',
    iban: 'IT0000000000000000000000000',
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNWZlMGIiIHN0cm9rZS13aWR0aD0iNSI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIC8+CiAgPHRleHQgeD0iNTAiIHk9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZjVmZTBiIiBzdHJva2U9Im5vbmUiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+R0xSPC90ZXh0Pgo8L3N2Zz4=',
    defaultDailyIndemnity: 50,
    kmCost: 0.5,
    defaultVatRate: 22,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarId: '',
    crewRoles: ['Project Manager', 'Audio Engineer', 'Light Operator', 'Video Tech', 'Rigger', 'Stage Hand'],
    permissions: {
        MANAGER: {
            // View Permissions
            canViewDashboard: true,
            canViewJobs: true,
            canViewTasks: true,
            canViewKits: true,
            canViewRentals: true,
            canViewInventory: true,
            canViewLocations: true,
            canViewCrew: true,
            canViewExpenses: true,
            canViewCompany: false,
            
            // Action Permissions
            canManageJobs: true,
            canDeleteJobs: false,
            canViewBudget: true,
            canManageCrew: true,
            canManageExpenses: true,
            canManageInventory: true,
            canManageLocations: true,
            canManageRentals: true
        },
        TECH: {
            // View Permissions
            canViewDashboard: true,
            canViewJobs: true,
            canViewTasks: true,
            canViewKits: true,
            canViewRentals: true,
            canViewInventory: true,
            canViewLocations: true,
            canViewCrew: true,
            canViewExpenses: true,
            canViewCompany: false,

            // Action Permissions
            canManageJobs: false,
            canDeleteJobs: false,
            canViewBudget: false,
            canManageCrew: false,
            canManageExpenses: false,
            canManageInventory: false,
            canManageLocations: false,
            canManageRentals: false
        }
    }
};

let MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantityOwned: 10, serialNumber: 'SN001', accessories: 'Cavo XLR, Asta', status: 'Operativo' },
    { id: '2', name: 'Yamaha QL1', category: 'Audio', type: 'Mixer', quantityOwned: 2, serialNumber: 'SN002', accessories: 'Cavo Alimentazione, Case', status: 'Operativo' },
    { id: '3', name: 'Panasonic PTZ', category: 'Video', type: 'Camera', quantityOwned: 4, serialNumber: 'SN003', accessories: 'Cavo SDI, Controller PTZ', status: 'Operativo' },
    { id: '4', name: 'Cavo XLR 10m', category: 'Cavi', type: 'XLR', quantityOwned: 50, status: 'Operativo' },
    { id: '5', name: 'Par LED', category: 'Luci', type: 'Faro', quantityOwned: 20, accessories: 'Cavo DMX, Gancio', status: 'Operativo' },
    { id: '6', name: 'Americana 2m', category: 'Strutture', type: 'Truss', quantityOwned: 12, accessories: 'Spine, Coppiglie', status: 'Operativo' },
    { id: '7', name: 'HDMI 10m', category: 'Cavi', type: 'HDMI', quantityOwned: 15, status: 'Operativo' },
    { id: '8', name: 'Macchina Fumo', category: 'Luci', type: 'Effetti', quantityOwned: 2, accessories: 'Liquido Fumo', status: 'Operativo' },
    { id: '9', name: 'Video Proiettore 10k', category: 'Video', type: 'Proiettore', quantityOwned: 1, accessories: 'Ottica, Cavo HDMI, Staffa', status: 'Operativo' }
];

let MOCK_LOCATIONS: Location[] = [
    {
        id: '1', name: 'Teatro Nazionale', address: 'Piazza Piemonte 12, Milano', hallSizeMQ: 500, mapsLink: '', isZtl: true, contactName: 'Mario Rossi', contactPhone: '3331234567', accessHours: '08:00 - 20:00',
        power: { hasCivil: false, hasIndustrial: true, industrialSockets: ['32A', '63A'], requiresGenerator: false, distanceFromPanel: 20, notes: '' },
        network: { isUnavailable: false, hasWired: true, hasWifi: true, hasWallLan: true, wallLanDistance: 15, addressing: 'DHCP', staticDetails: '', firewallProxyNotes: '' },
        logistics: { loadFloor: 'Piano Terra', hasParking: true, hasLift: false, stairsDetails: '', hasEmptyStorage: true, emptyStorageNotes: '' },
        equipment: {
            audio: { present: true, hasPA: true, paNotes: 'Impianto L-Acoustics residente', hasMics: false, micsNotes: '', hasMixerOuts: true, mixerNotes: 'Left/Right XLR su palco' },
            video: { present: false, hasTV: false, hasProjector: false, hasLedwall: false, hasMonitorGobo: false, signals: [], notes: '' },
            hasLights: true, lightsNotes: 'Americana frontale con piazzato generico',
            hasPerimeterSockets: true
        },
        generalSurveyNotes: 'Scaricare dal retro, attenzione alla ZTL attiva fino alle 19.30'
    }
];

let MOCK_CREW: CrewMember[] = [
    { id: 'demo-admin-id', name: 'Admin Demo', type: CrewType.INTERNAL, roles: [CrewRole.PROJECT_MGR], dailyRate: 0, phone: '3339999999', email: 'admin@glr.it', password: 'password', accessRole: 'ADMIN', absences: [], expenses: [], monthlyNetCost: 2500, monthlyTaxCost: 1200 },
    { id: '2', name: 'Luca Bianchi', type: CrewType.INTERNAL, roles: [CrewRole.AUDIO_ENG], dailyRate: 0, phone: '3338888888', email: 'luca@glr.it', password: 'password', accessRole: 'TECH', absences: [], expenses: [], monthlyNetCost: 1800, monthlyTaxCost: 900 },
    { id: '3', name: 'Marco Verdi', type: CrewType.FREELANCE, roles: [CrewRole.LIGHT_OP], dailyRate: 250, phone: '3337777777', absences: [], expenses: [] },
    { id: '4', name: 'Giulia Neri', type: CrewType.FREELANCE, roles: [CrewRole.VIDEO_TECH], dailyRate: 300, phone: '3336666666', absences: [], expenses: [] }
];

let MOCK_JOBS: Job[] = [
    {
        id: '1', title: 'Convention Aziendale Alpha', client: 'Alpha Corp', location: 'Teatro Nazionale', locationId: '1',
        startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: JobStatus.CONFIRMED, description: 'Convention annuale con streaming', departments: ['Audio', 'Video'],
        isAwayJob: false, isSubcontracted: false, outfitNoLogo: false,
        internalClient: 'Agenzia Eventi XY', contactName: 'Sig. Brambilla', contactPhone: '3334445555', outfit: 'Polo',
        phases: [
            { id: 'p1', name: 'Allestimento', start: new Date().toISOString(), end: new Date(Date.now() + 14400000).toISOString(), callTimeWarehouse: new Date().toISOString(), callTimeSite: new Date(Date.now() + 3600000).toISOString() }
        ],
        vehicles: [{ id: 'v1', type: VehicleType.DUCATO, quantity: 2, isRental: false }],
        materialList: [
            { id: 'm1', inventoryId: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantity: 2, isExternal: false },
            { id: 'm2', inventoryId: '2', name: 'Yamaha QL1', category: 'Audio', type: 'Mixer', quantity: 1, isExternal: false }
        ],
        assignedCrew: ['2', '3'], notes: '',
        invoiceAmount: 5000, extraCosts: []
    }
];

let MOCK_RENTALS: Rental[] = [
    {
        id: 'r1', status: RentalStatus.CONFIRMED, client: 'Band Rock', contactName: 'Mario', contactPhone: '333000000',
        pickupDate: new Date().toISOString().split('T')[0], returnDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        deliveryMethod: 'RITIRO',
        items: [
            { id: 'ri1', inventoryId: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantity: 2, isExternal: false }
        ]
    }
];

let MOCK_STANDARD_LISTS: StandardMaterialList[] = [
    {
        id: '1', name: 'Kit Conferenza Base', labels: ['Audio'],
        items: [
            { id: 'sl1', inventoryId: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantity: 4, isExternal: false },
            { id: 'sl2', inventoryId: '4', name: 'Cavo XLR 10m', category: 'Cavi', type: 'XLR', quantity: 10, isExternal: false }
        ]
    }
];

let MOCK_COST_CENTERS: CostCenter[] = [
    { id: 'c1', category: 'Affitto', description: 'Affitto Magazzino', amount: 1500, periodicity: 'Mensile', expiryDate: '2024-12-31', supplier: 'Immobiliare SRL', autoRenew: true },
    { id: 'c2', category: 'Leasing', description: 'Leasing Furgone Ducato', amount: 450, periodicity: 'Mensile', expiryDate: '2025-06-30', supplier: 'Leasys', autoRenew: false },
    { id: 'c3', category: 'Software', description: 'Abbonamento Adobe', amount: 600, periodicity: 'Annuale', expiryDate: '2024-11-15', supplier: 'Adobe', autoRenew: true }
];

let MOCK_F24: F24Payment[] = [
    { id: 'f1', month: 1, year: 2024, amount: 2100, paymentDate: '2024-02-16' },
    { id: 'f2', month: 2, year: 2024, amount: 2100, paymentDate: '2024-03-16' }
];

let MOCK_TASKS: Task[] = [
    { id: 't1', title: 'Backup Schede SD', description: 'Scaricare girato su NAS', assignedTo: '2', createdBy: 'demo-admin-id', deadline: new Date().toISOString().split('T')[0], status: 'PENDING', jobId: '1' }
];

// --- MOCK API ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  login: async (email: string, pass: string) => {
      await delay(500);
      return { success: true, user: MOCK_CREW[0], token: 'demo' };
  },

  getJobs: async () => { await delay(300); return [...MOCK_JOBS]; },
  createJob: async (job: Job) => { await delay(300); const n = {...job, id: Date.now().toString()}; MOCK_JOBS.push(n); return n; },
  updateJob: async (job: Job) => { await delay(300); MOCK_JOBS = MOCK_JOBS.map(j => j.id === job.id ? job : j); return job; },
  deleteJob: async (id: string) => { await delay(300); MOCK_JOBS = MOCK_JOBS.filter(j => j.id !== id); return true; },

  getCrew: async () => { await delay(300); return [...MOCK_CREW]; },
  updateCrewMember: async (member: CrewMember) => { 
      await delay(300); 
      if(member.id.length < 10) { // New
          const n = {...member, id: Date.now().toString()};
          MOCK_CREW.push(n);
          return n;
      } else {
          MOCK_CREW = MOCK_CREW.map(c => c.id === member.id ? member : c);
          return member;
      }
  },

  getLocations: async () => { await delay(300); return [...MOCK_LOCATIONS]; },
  createLocation: async (loc: Location) => { await delay(300); const n = {...loc, id: Date.now().toString()}; MOCK_LOCATIONS.push(n); return n; },
  updateLocation: async (loc: Location) => { await delay(300); MOCK_LOCATIONS = MOCK_LOCATIONS.map(l => l.id === loc.id ? loc : l); return loc; },
  deleteLocation: async (id: string) => { await delay(300); MOCK_LOCATIONS = MOCK_LOCATIONS.filter(l => l.id !== id); return true; },

  getInventory: async () => { await delay(300); return [...MOCK_INVENTORY]; },
  createInventoryItem: async (item: InventoryItem) => { await delay(300); const n = {...item, id: Date.now().toString()}; MOCK_INVENTORY.push(n); return n; },
  updateInventoryItem: async (item: InventoryItem) => { await delay(300); MOCK_INVENTORY = MOCK_INVENTORY.map(i => i.id === item.id ? item : i); return item; },
  deleteInventoryItem: async (id: string) => { await delay(300); MOCK_INVENTORY = MOCK_INVENTORY.filter(i => i.id !== id); return true; },

  getRentals: async () => { await delay(300); return [...MOCK_RENTALS]; },
  createRental: async (rental: Rental) => { await delay(300); const n = {...rental, id: Date.now().toString()}; MOCK_RENTALS.push(n); return n; },
  updateRental: async (rental: Rental) => { await delay(300); MOCK_RENTALS = MOCK_RENTALS.map(r => r.id === rental.id ? rental : r); return rental; },
  deleteRental: async (id: string) => { await delay(300); MOCK_RENTALS = MOCK_RENTALS.filter(r => r.id !== id); return true; },

  getStandardLists: async () => { await delay(300); return [...MOCK_STANDARD_LISTS]; },
  createStandardList: async (list: StandardMaterialList) => { await delay(300); const n = {...list, id: Date.now().toString()}; MOCK_STANDARD_LISTS.push(n); return n; },
  updateStandardList: async (list: StandardMaterialList) => { await delay(300); MOCK_STANDARD_LISTS = MOCK_STANDARD_LISTS.map(l => l.id === list.id ? list : l); return list; },
  deleteStandardList: async (id: string) => { await delay(300); MOCK_STANDARD_LISTS = MOCK_STANDARD_LISTS.filter(l => l.id !== id); return true; },

  getSettings: async () => { await delay(300); return MOCK_SETTINGS; },
  updateSettings: async (s: AppSettings) => { await delay(300); MOCK_SETTINGS = s; return s; },

  getNotifications: async () => { await delay(300); return []; },

  // COMPANY MANAGEMENT APIs (MOCKED)
  getCostCenters: async () => { await delay(300); return [...MOCK_COST_CENTERS]; },
  createCostCenter: async (c: CostCenter) => { await delay(300); const n = {...c, id: Date.now().toString()}; MOCK_COST_CENTERS.push(n); return n; },
  updateCostCenter: async (c: CostCenter) => { await delay(300); MOCK_COST_CENTERS = MOCK_COST_CENTERS.map(x => x.id === c.id ? c : x); return c; },
  deleteCostCenter: async (id: string) => { await delay(300); MOCK_COST_CENTERS = MOCK_COST_CENTERS.filter(x => x.id !== id); return true; },

  getF24Payments: async () => { await delay(300); return [...MOCK_F24]; },
  createF24Payment: async (f: F24Payment) => { await delay(300); const n = {...f, id: Date.now().toString()}; MOCK_F24.push(n); return n; },
  deleteF24Payment: async (id: string) => { await delay(300); MOCK_F24 = MOCK_F24.filter(f => f.id !== id); return true; },

  // TASKS
  getTasks: async () => { await delay(300); return [...MOCK_TASKS]; },
  createTask: async (t: Task) => { await delay(300); const n = {...t, id: Date.now().toString()}; MOCK_TASKS.push(n); return n; },
  updateTask: async (t: Task) => { await delay(300); MOCK_TASKS = MOCK_TASKS.map(x => x.id === t.id ? t : x); return t; },
  deleteTask: async (id: string) => { await delay(300); MOCK_TASKS = MOCK_TASKS.filter(x => x.id !== id); return true; }
};