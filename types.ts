

// Enums for Statuses
export enum JobStatus {
  DRAFT = 'Bozza',
  CONFIRMED = 'Confermato',
  IN_PROGRESS = 'In Corso',
  COMPLETED = 'Completato',
  CANCELLED = 'Annullato'
}

export enum RentalStatus {
    DRAFT = 'Bozza',
    CONFIRMED = 'Confermato',
    OUT = 'In Uscita',
    RETURNED = 'Rientrato',
    CANCELLED = 'Annullato'
}

export enum CrewRole {
  AUDIO_ENG = 'Fellicista Audio',
  LIGHT_OP = 'Operatore Luci',
  VIDEO_TECH = 'Tecnico Video',
  RIGGER = 'Rigger',
  STAGE_HAND = 'Facchino',
  PROJECT_MGR = 'Project Manager'
}

export enum CrewType {
  INTERNAL = 'Interno',
  FREELANCE = 'Esterno'
}

export enum VehicleType {
  DUCATO = 'Ducato',
  DAILY_35 = 'Daily 35Q',
  EUROCARGO_75 = 'Eurocargo 75Q',
  MOTRICE = 'Motrice',
  RENTAL = 'Furgone a Noleggio'
}

export enum ApprovalStatus {
  PENDING = 'In Attesa',
  APPROVED_MANAGER = 'Approvato (Manager)',
  REJECTED = 'Rifiutato',
  COMPLETED = 'Completato / Pagato'
}

export type OutfitType = 'Polo' | 'Camicia' | 'Abito' | 'Felpa';
export type SystemRole = 'ADMIN' | 'MANAGER' | 'TECH';

// Data Models
export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTo?: string; 
}

export interface WorkflowLog {
  id: string;
  date: string;
  user: string;
  action: string;
  note?: string;
}

export interface InventoryItem {
  id: string;
  category: string; 
  type?: string; 
  quantityOwned: number; 
  name: string; 
  related?: string; 
  accessories?: string; 
  correlationType?: string; 
  notes?: string; 
  status?: string; 
  serialNumber?: string; 
  weightKg?: number; 
}

export interface MaterialItem {
  id: string;
  inventoryId?: string;
  category: string;
  type?: string;
  name: string;
  quantity: number;
  isExternal: boolean;
  cost?: number;
  supplier?: string;
  notes?: string;
  
  // Logistics Check Flags
  loaded?: boolean; // Load IN (Magazzino -> Furgone)
  returned?: boolean; // Load OUT (Furgone -> Magazzino)
}

export interface StandardMaterialList {
    id: string;
    name: string;
    labels: string[]; // Audio, Video, Luci
    items: MaterialItem[];
    type?: 'TEMPLATE' | 'ACTIVE'; // Template = Kit, Active = Operativa
}

export interface Rental {
    id: string;
    status: RentalStatus;
    client: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    pickupDate: string;
    returnDate: string;
    deliveryMethod: 'RITIRO' | 'CONSEGNA';
    deliveryAddress?: string;
    items: MaterialItem[];
    notes?: string;
    totalPrice?: number;
}

export interface CrewExpense {
  id: string;
  jobId?: string;
  jobTitle?: string;
  date: string;
  amount: number;
  description: string;
  category: 'Viaggio' | 'Pasto' | 'Alloggio' | 'Materiale' | 'Altro';
  status: ApprovalStatus;
  workflowLog: WorkflowLog[];
  attachmentUrl?: string;
}

export interface CrewAbsence {
  id: string;
  type: 'Ferie' | 'Permesso' | 'Malattia';
  startDate: string;
  endDate: string;
  status: ApprovalStatus;
  workflowLog: WorkflowLog[];
  notes?: string;
}

// NEW: Manual Tasks (e.g., Warehouse work, Vehicle Check)
export interface CrewTask {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    assignedBy: string;
    jobId?: string; // Optional link to job
}

// NEW: General Tasks (To-Do List)
export interface Task {
    id: string;
    title: string;
    description?: string;
    assignedTo: string; // Crew ID
    createdBy: string;
    jobId?: string;
    deadline: string; // ISO Date
    status: 'PENDING' | 'COMPLETED';
}

// NEW: Documents
export interface CrewDocument {
    id: string;
    name: string;
    type: 'Unilav' | 'Certificazione' | 'Visita Medica' | 'Patente' | 'Altro';
    expiryDate?: string;
    uploadDate: string;
    fileUrl?: string;
}

export interface FinancialDocument {
    id: string;
    name: string;
    type: 'Busta Paga' | 'CU';
    month?: string;
    year?: number;
    uploadDate?: string;
    fileUrl?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  type: CrewType;
  roles: CrewRole[];
  dailyRate: number;
  overtimeRate?: number;
  travelIndemnity?: number;
  email?: string;
  password?: string;
  accessRole?: SystemRole;
  phone: string;
  absences: CrewAbsence[];
  expenses: CrewExpense[];
  tasks?: CrewTask[]; // Manual tasks (Planning)
  documents?: CrewDocument[]; // Certs, Medical, etc.
  financialDocuments?: FinancialDocument[];
  
  // Financial (Company Management)
  monthlyNetCost?: number;
  monthlyTaxCost?: number; 
  notes?: string;
}

export interface LocationPower {
  hasCivil: boolean;
  hasIndustrial: boolean;
  industrialSockets: string[];
  requiresGenerator: boolean;
  distanceFromPanel: number;
  notes: string;
}

export interface LocationNetwork {
  isUnavailable: boolean;
  hasWired: boolean;
  hasWifi: boolean;
  hasWallLan: boolean;
  wallLanDistance: number;
  addressing: 'DHCP' | 'STATIC';
  staticDetails: string;
  firewallProxyNotes: string;
}

export interface LocationLogistics {
  loadFloor: string;
  hasParking: boolean;
  hasLift: boolean;
  stairsDetails: string;
  hasEmptyStorage: boolean;
  emptyStorageNotes: string;
}

export interface LocationAudioDetails {
  present: boolean;
  hasPA: boolean;
  paNotes: string;
  hasMics: boolean;
  micsNotes: string;
  hasMixerOuts: boolean;
  mixerNotes: string;
}

export interface LocationVideoDetails {
  present: boolean;
  hasTV: boolean;
  hasProjector: boolean;
  hasLedwall: boolean;
  hasMonitorGobo: boolean;
  signals: string[];
  notes: string;
}

export interface LocationEquipment {
  audio: LocationAudioDetails;
  video: LocationVideoDetails;
  hasLights: boolean; 
  lightsNotes: string;
  hasPerimeterSockets: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  hallSizeMQ: number;
  mapsLink: string;
  isZtl: boolean;
  contactName: string;
  contactPhone: string;
  accessHours: string;
  power: LocationPower;
  network: LocationNetwork;
  logistics: LocationLogistics;
  equipment: LocationEquipment;
  generalSurveyNotes: string;
  photos?: string[]; // Array of base64 strings or URLs
}

export interface JobPhase {
  id: string;
  name: string;
  start: string;
  end: string;
  callTimeWarehouse?: string;
  callTimeSite?: string;
  assignedCrew?: string[];
}

export interface JobVehicle {
  id: string;
  type: VehicleType;
  quantity: number;
  isRental: boolean;
  rentalCompany?: string;
  pickupDate?: string;
  returnDate?: string;
  cost?: number;
}

export interface ExtraCost {
    id: string;
    description: string;
    amount: number;
}

export type JobLogisticsStatus = 'PREPARATION' | 'LOADED' | 'ON_SITE' | 'RETURNED' | 'CHECKED';

export interface Job {
  id: string;
  title: string;
  client: string;
  internalClient?: string;
  location: string;
  locationId?: string;
  startDate: string;
  endDate: string;
  status: JobStatus;
  logisticsStatus?: JobLogisticsStatus; // New status for warehouse flow
  departments: string[];
  isAwayJob: boolean;
  isSubcontracted: boolean;
  subcontractorName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  outfit?: OutfitType;
  outfitNoLogo: boolean;
  phases: JobPhase[];
  vehicles: JobVehicle[];
  description: string;
  materialList: MaterialItem[];
  assignedCrew: string[];
  notes: string;
  
  // Financial
  invoiceAmount?: number;
  extraCosts?: ExtraCost[];
  hasExternalService?: boolean;
  externalServiceName?: string;
  externalServiceRole?: string;
  hasPorterage?: boolean;
  porterageAgency?: string;
  porterageTime?: string;
  hotelName?: string;
  hotelAddress?: string;
}

// COMPANY MANAGEMENT TYPES

export type CostCenterCategory = 'Affitto' | 'Assicurazione' | 'Leasing' | 'Telefonia' | 'Software' | 'Utenze' | 'Altro';
export type CostPeriodicity = 'Mensile' | 'Annuale' | 'Trimestrale' | 'Una Tantum';

export interface CostCenter {
    id: string;
    category: CostCenterCategory;
    description: string;
    amount: number;
    periodicity: CostPeriodicity;
    expiryDate: string;
    supplier: string;
    autoRenew: boolean;
    notes?: string;
}

export interface F24Payment {
    id: string;
    month: number; // 1-12
    year: number;
    amount: number;
    paymentDate: string;
    notes?: string;
}

export interface RolePermissions {
    // Menu Visibility (Nav Bar)
    canViewDashboard: boolean;
    canViewJobs: boolean;
    canViewTasks: boolean; // NEW
    canViewKits: boolean;
    canViewRentals: boolean;
    canViewInventory: boolean;
    canViewLocations: boolean;
    canViewCrew: boolean;
    canViewExpenses: boolean;
    canViewCompany: boolean;

    // Operational Actions
    canManageJobs: boolean;
    canDeleteJobs: boolean;
    canViewBudget: boolean;

    canManageCrew: boolean;
    
    canManageExpenses: boolean;

    canManageInventory: boolean;

    canManageLocations: boolean;

    canManageRentals: boolean;
}

export interface AppSettings {
    companyName: string;
    pIva: string;
    address: string;
    bankName: string;
    iban: string;
    logoUrl?: string;
    defaultDailyIndemnity: number;
    kmCost: number;
    defaultVatRate: number;
    googleCalendarClientId: string;
    googleCalendarClientSecret: string;
    googleCalendarId: string;
    crewRoles?: string[];
    permissions: {
        ADMIN: RolePermissions;
        MANAGER: RolePermissions;
        TECH: RolePermissions;
    }
}
