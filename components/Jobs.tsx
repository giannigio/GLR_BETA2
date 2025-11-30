






import React, { useState, useMemo, useEffect } from 'react';
import { Job, JobStatus, MaterialItem, CrewMember, Location, InventoryItem, JobPhase, JobVehicle, VehicleType, OutfitType, StandardMaterialList, AppSettings, ApprovalStatus, CrewType, ExtraCost, Task } from '../types';
import { checkAvailabilityHelper } from '../services/helpers';
import { Plus, Calendar, MapPin, Trash2, Edit3, UserPlus, Package, Check, Clock, X, Truck, AlertTriangle, Info, ClipboardList, Speaker, Monitor, Zap, Box, Cable, ChevronRight, Search, Lightbulb, CheckSquare, Printer, Minus, Filter, ClipboardCheck, Copy, CalendarRange, Phone, Network, Archive, FolderOpen, Folder, ArrowDownCircle, ArrowLeft, ArrowRight, List, Briefcase, Mail, User, BriefcaseIcon, Shirt, FilePlus, Hotel, BedDouble, Plane, Navigation, Layers, Wifi, WifiOff, Users, Handshake, Euro, Calculator, TrendingUp, TrendingDown, Receipt, Landmark, CheckCircle } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
  crew: CrewMember[];
  locations: Location[];
  inventory: InventoryItem[]; 
  standardLists?: StandardMaterialList[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH', id: string, name: string };
  settings?: AppSettings;
  tasks?: Task[];
  onAddTask?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
}

const BASE_QUICK_ITEMS = [
    { name: 'Tavolo Regia', category: 'Strutture', type: 'Arredo' },
    { name: 'Gaffa', category: 'Altro', type: 'Consumabili' },
    { name: 'Nastri', category: 'Altro', type: 'Consumabili' },
    { name: 'Batterie', category: 'Altro', type: 'Consumabili' },
    { name: 'DPI', category: 'Altro', type: 'Sicurezza' },
    { name: 'Teli pioggia', category: 'Accessori', type: 'Meteo' },
    { name: 'Canaline', category: 'Cavi', type: 'Pedane' },
    { name: 'Ciabatte AC', category: 'Cavi', type: 'Elettrico' },
];

export const Jobs: React.FC<JobsProps> = ({ jobs, crew, locations, inventory, standardLists = [], onAddJob, onUpdateJob, onDeleteJob, currentUser, settings, tasks = [], onAddTask, onUpdateTask, onDeleteTask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'LOCATION' | 'PHASES' | 'MATERIAL' | 'CREW' | 'PLAN' | 'BUDGET' | 'TASKS'>('DETAILS');
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ARCHIVE'>('TIMELINE');
  
  // Material State
  const [addMode, setAddMode] = useState<'BROWSE' | 'MANUAL'>('BROWSE');
  const [isImportKitModalOpen, setIsImportKitModalOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({}); 
  
  // Manual Add State
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Audio');
  const [manualType, setManualType] = useState(''); 
  const [manualQty, setManualQty] = useState(1);
  const [manualCost, setManualCost] = useState(0);
  const [manualNotes, setManualNotes] = useState('');
  const [manualIsExternal, setManualIsExternal] = useState(false);
  const [manualSupplier, setManualSupplier] = useState('');
  
  // Inventory Browser Filters
  const [invSearchTerm, setInvSearchTerm] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('ALL');
  const [invTypeFilter, setInvTypeFilter] = useState('ALL');

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE'); 
  
  // Archive State
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Budget Extra Costs State
  const [newExtraDesc, setNewExtraDesc] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState('');

  // Tasks State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  const userRole = currentUser?.role || 'TECH';
  const permissions = settings?.permissions?.[userRole as 'MANAGER' | 'TECH'] || { canViewBudget: false };
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'TECH';
  const showBudget = userRole === 'ADMIN' || permissions.canViewBudget;

  // --- AUTOMATED STATUS CHECK ---
  useEffect(() => {
      if (activeJob && isEditing && canEdit) {
          const today = new Date().toISOString().split('T')[0];
          
          // Rule: If CONFIRMED and Today is between Start and End -> Set to IN_PROGRESS
          if (activeJob.status === JobStatus.CONFIRMED) {
              if (today >= activeJob.startDate && today <= activeJob.endDate) {
                  setActiveJob(prev => prev ? { ...prev, status: JobStatus.IN_PROGRESS } : null);
              }
          }
      }
  }, [isEditing, activeJob?.id]); // Only check when opening/switching jobs

  const handleNewJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      title: '', client: '', internalClient: '', location: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0],
      status: JobStatus.DRAFT, description: '', departments: [], isAwayJob: false, isSubcontracted: false, outfitNoLogo: false,
      contactName: '', contactPhone: '', contactEmail: '', hotelName: '', hotelAddress: '',
      phases: [], vehicles: [], materialList: [], assignedCrew: [], notes: '',
      invoiceAmount: 0, extraCosts: [], logisticsStatus: 'PREPARATION'
    };
    setActiveJob(newJob); setIsEditing(true); setActiveTab('DETAILS');
  };

  const handleCreateFromExisting = (sourceJob: Job) => {
      const newJob: Job = {
          ...sourceJob,
          id: Date.now().toString(),
          title: `Copia di ${sourceJob.title}`,
          status: JobStatus.DRAFT,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          assignedCrew: [], 
          invoiceAmount: 0,
          extraCosts: [],
          logisticsStatus: 'PREPARATION',
          materialList: sourceJob.materialList.map(item => ({ ...item, loaded: false, returned: false })) // Reset logistics flags
      };
      setActiveJob(newJob);
      setIsEditing(true);
      setActiveTab('DETAILS');
      setIsTemplateModalOpen(false);
  };

  const toggleDepartment = (dept: string) => {
      if (!activeJob) return;
      const current = activeJob.departments || [];
      const updated = current.includes(dept) ? current.filter(d => d !== dept) : [...current, dept];
      setActiveJob({ ...activeJob, departments: updated });
  };

  const handleImportKit = (kit: StandardMaterialList) => {
      if (!activeJob) return;
      const newItems: MaterialItem[] = kit.items.map(item => ({
          ...item,
          id: Date.now().toString() + Math.random().toString().slice(2),
          loaded: false,
          returned: false
      }));
      
      setActiveJob(prev => {
          if (!prev) return null;
          const mergedList = [...prev.materialList];
          newItems.forEach(newItem => {
              const existingIdx = mergedList.findIndex(m => m.inventoryId === newItem.inventoryId && !m.isExternal);
              if (existingIdx >= 0 && newItem.inventoryId) {
                  mergedList[existingIdx].quantity += newItem.quantity;
              } else {
                  mergedList.push(newItem);
              }
          });
          return { ...prev, materialList: mergedList };
      });
      setIsImportKitModalOpen(false);
  };

  const handleSave = () => {
    if (activeJob) {
      const exists = jobs.find(j => j.id === activeJob.id);
      if (exists) onUpdateJob(activeJob); else onAddJob(activeJob);
      setIsEditing(false); setActiveJob(null);
    }
  };

  const handlePrint = () => window.print();

  const getRouteLink = (dest: string) => {
        const origin = encodeURIComponent(settings?.address || "Via San Giuseppe Cafasso 41, Roma");
        const destination = encodeURIComponent(dest);
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  const addItemToList = (itemData: MaterialItem) => {
      setActiveJob(prev => { 
          if (!prev) return null; 
          const existingIndex = prev.materialList.findIndex(m => m.inventoryId === itemData.inventoryId && !m.isExternal);
          if (existingIndex >= 0 && itemData.inventoryId) {
              const newList = [...prev.materialList];
              newList[existingIndex].quantity += itemData.quantity;
              if (itemData.notes) {
                  newList[existingIndex].notes = newList[existingIndex].notes ? `${newList[existingIndex].notes} | ${itemData.notes}` : itemData.notes;
              }
              return { ...prev, materialList: newList };
          }
          return { ...prev, materialList: [...prev.materialList, itemData] }; 
      });
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
      if (!activeJob) return;
      setActiveJob({
          ...activeJob,
          materialList: activeJob.materialList.map(m => m.id === itemId ? { ...m, quantity: Math.max(1, m.quantity + delta) } : m)
      });
  };

  const updateItemNotes = (itemId: string, newNotes: string) => {
      if (!activeJob) return;
      setActiveJob({
          ...activeJob,
          materialList: activeJob.materialList.map(m => m.id === itemId ? { ...m, notes: newNotes } : m)
      });
  };

  const handleAddManualItem = () => {
      if (!activeJob || !manualName) return;
      const newItem: MaterialItem = {
          id: Date.now().toString(),
          name: manualName,
          category: manualCategory,
          type: manualType,
          quantity: manualQty,
          isExternal: manualIsExternal,
          cost: manualIsExternal ? manualCost : undefined,
          supplier: manualIsExternal ? manualSupplier : undefined,
          notes: manualNotes,
          loaded: false,
          returned: false
      };
      addItemToList(newItem);
      setManualName(''); setManualType(''); setManualQty(1); setManualNotes(''); setManualCost(0); setManualSupplier('');
  };

  // --- DYNAMIC QUICK ITEMS LOGIC ---
  const activeLocationData = useMemo(() => {
      if (!activeJob || !activeJob.locationId) return null;
      return locations.find(l => l.id === activeJob.locationId);
  }, [activeJob, locations]);

  const quickItems = useMemo(() => {
      const items = [...BASE_QUICK_ITEMS];
      // Logic: If Location Network is unavailable, suggest Router 5G
      if (activeLocationData?.network.isUnavailable) {
          items.push({ name: 'Router 5G', category: 'Rete', type: 'Network' });
      }
      return items;
  }, [activeLocationData]);

  const handleQuickItemToggle = (qItem: typeof BASE_QUICK_ITEMS[0]) => {
        if (!activeJob) return;
        const newItem: MaterialItem = {
            id: Date.now().toString(), name: qItem.name, category: qItem.category, type: qItem.type, quantity: 1, isExternal: false, notes: 'Aggiunta rapida', loaded: false, returned: false
        };
        addItemToList(newItem);
        // Feedback loop
        const mockId = `quick-${qItem.name}`;
        setAddedFeedback(prev => ({...prev, [mockId]: true}));
        setTimeout(() => { setAddedFeedback(prev => ({...prev, [mockId]: false})); }, 1000);
  };

  // UPDATED: Toggle Crew in specific phase
  const toggleCrewInPhase = (phaseId: string, crewId: string) => {
    if (!activeJob) return;

    // 1. Update the specific phase
    const updatedPhases = activeJob.phases.map(p => {
        if (p.id === phaseId) {
            const currentAssignments = p.assignedCrew || [];
            const newAssignments = currentAssignments.includes(crewId) 
                ? currentAssignments.filter(id => id !== crewId) 
                : [...currentAssignments, crewId];
            return { ...p, assignedCrew: newAssignments };
        }
        return p;
    });

    // 2. Recalculate top-level assignedCrew (Union of all phase assignments)
    // This maintains backward compatibility with dashboard filters
    const allAssignedCrew = new Set<string>();
    updatedPhases.forEach(p => {
        if (p.assignedCrew) {
            p.assignedCrew.forEach(id => allAssignedCrew.add(id));
        }
    });

    setActiveJob({ 
        ...activeJob, 
        phases: updatedPhases,
        assignedCrew: Array.from(allAssignedCrew)
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locId = e.target.value;
      if (!activeJob) return;
      if (locId === "custom") setActiveJob({...activeJob, locationId: undefined, location: ''});
      else {
          const selectedLoc = locations.find(l => l.id === locId);
          if (selectedLoc) setActiveJob({...activeJob, locationId: selectedLoc.id, location: selectedLoc.name});
      }
  };

  const addPhase = () => {
      if (!activeJob) return;
      const newPhase: JobPhase = { id: Date.now().toString(), name: '', start: `${activeJob.startDate}T09:00`, end: `${activeJob.startDate}T18:00`, assignedCrew: [] };
      setActiveJob({...activeJob, phases: [...activeJob.phases, newPhase]});
  };

  const removePhase = (phaseId: string) => { if(!activeJob) return; setActiveJob({...activeJob, phases: activeJob.phases.filter(p => p.id !== phaseId)}); }
  const updatePhase = (phaseId: string, field: keyof JobPhase, value: any) => { if(!activeJob) return; setActiveJob({...activeJob, phases: activeJob.phases.map(p => p.id === phaseId ? {...p, [field]: value} : p)}); }

  const addVehicle = () => {
      if (!activeJob) return;
      const newVehicle: JobVehicle = { id: Date.now().toString(), type: VehicleType.DUCATO, quantity: 1, isRental: false };
      setActiveJob({...activeJob, vehicles: [...activeJob.vehicles, newVehicle]});
  };
  const updateVehicle = (vId: string, field: keyof JobVehicle, value: any) => { if(!activeJob) return; setActiveJob({...activeJob, vehicles: activeJob.vehicles.map(v => v.id === vId ? {...v, [field]: value} : v)}); };
  const removeVehicle = (vId: string) => { if(!activeJob) return; setActiveJob({...activeJob, vehicles: activeJob.vehicles.filter(v => v.id !== vId)}); };

  const availableTypes = useMemo(() => {
      let items = inventory;
      if (invCategoryFilter !== 'ALL') items = items.filter(i => i.category === invCategoryFilter);
      const types = new Set(items.map(i => i.type).filter(Boolean) as string[]);
      return ['ALL', ...Array.from(types).sort()];
  }, [inventory, invCategoryFilter]);

  const filteredInventory = useMemo(() => {
      const s = invSearchTerm.toLowerCase();
      return inventory.filter(i => {
          const matchSearch = i.name.toLowerCase().includes(s) || (i.serialNumber && i.serialNumber.toLowerCase().includes(s));
          const matchCat = invCategoryFilter === 'ALL' || i.category === invCategoryFilter;
          const matchType = invTypeFilter === 'ALL' || i.type === invTypeFilter;
          return matchSearch && matchCat && matchType;
      });
  }, [inventory, invSearchTerm, invCategoryFilter, invTypeFilter]);

  const handleInventoryAdd = (item: InventoryItem) => {
      if (!activeJob) return;
      const newItem: MaterialItem = { id: Date.now().toString(), inventoryId: item.id, name: item.name, category: item.category, type: item.type, quantity: 1, isExternal: false, loaded: false, returned: false };
      addItemToList(newItem);
      setAddedFeedback(prev => ({...prev, [item.id]: true}));
      setTimeout(() => { setAddedFeedback(prev => ({...prev, [item.id]: false})); }, 1000);
  };

  const materialByCategory = useMemo(() => {
    if (!activeJob) return {};
    const groups: Record<string, MaterialItem[]> = { 'Audio': [], 'Video': [], 'Luci': [], 'Strutture': [], 'Cavi': [] };
    activeJob.materialList.forEach(item => {
        if (groups[item.category]) groups[item.category].push(item);
        else { if(!groups['Altro']) groups['Altro'] = []; groups['Altro'].push(item); }
    });
    return groups;
  }, [activeJob?.materialList]);

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Audio': return <Speaker size={16}/>;
        case 'Video': return <Monitor size={16}/>;
        case 'Luci': return <Zap size={16}/>;
        case 'Strutture': return <Box size={16}/>;
        case 'Cavi': return <Cable size={16}/>;
        default: return <Package size={16}/>;
    }
  };

  const filteredJobs = useMemo(() => {
      let filtered = jobs.filter(j => {
          const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.client.toLowerCase().includes(searchTerm.toLowerCase()) || j.location.toLowerCase().includes(searchTerm.toLowerCase());
          let matchStatus = true;
          
          if (statusFilter === 'ACTIVE') {
              matchStatus = j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED;
          } else if (statusFilter === 'ARCHIVED') {
              matchStatus = j.status === JobStatus.COMPLETED || j.status === JobStatus.CANCELLED;
          } else if (statusFilter !== 'ALL') {
              matchStatus = j.status === statusFilter;
          }
          
          return matchSearch && matchStatus;
      });
      return filtered.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs, searchTerm, statusFilter]);

  // --- TIMELINE GROUPING ---
  const timelineWeeks = useMemo(() => {
      const weeks: Record<string, { start: Date, end: Date, jobs: Job[] }> = {};
      
      filteredJobs.forEach(job => {
          const date = new Date(job.startDate);
          const day = date.getDay() || 7; 
          if (day !== 1) date.setHours(-24 * (day - 1));
          
          const weekKey = date.toISOString().split('T')[0];
          if (!weeks[weekKey]) {
              const endDate = new Date(date);
              endDate.setDate(date.getDate() + 6);
              weeks[weekKey] = { start: new Date(date), end: endDate, jobs: [] };
          }
          weeks[weekKey].jobs.push(job);
      });
      
      return Object.values(weeks).sort((a,b) => a.start.getTime() - b.start.getTime());
  }, [filteredJobs]);

  const archiveTree = useMemo(() => {
      const tree: Record<string, Record<string, Job[]>> = {};
      const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
      
      jobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.CANCELLED).forEach(j => {
          const d = new Date(j.startDate);
          const y = d.getFullYear().toString();
          const m = months[d.getMonth()];
          
          if (!tree[y]) tree[y] = {};
          if (!tree[y][m]) tree[y][m] = [];
          tree[y][m].push(j);
      });
      return tree;
  }, [jobs]);

  const getStatusBadge = (status: JobStatus) => {
      switch(status) {
          case JobStatus.DRAFT: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-600 text-gray-200">Bozza</span>;
          case JobStatus.CONFIRMED: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-600 text-white">Confermato</span>;
          case JobStatus.IN_PROGRESS: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-600 text-white">In Corso</span>;
          case JobStatus.COMPLETED: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-600 text-white">Completato</span>;
          default: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-900 text-red-200">Annullato</span>;
      }
  }

  // --- WORKFLOW HANDLERS ---
  const handleQuoteAccepted = (checked: boolean) => {
      if (!activeJob) return;
      if (checked) setActiveJob({ ...activeJob, status: JobStatus.CONFIRMED });
      else setActiveJob({ ...activeJob, status: JobStatus.DRAFT });
  };

  const handleInvoiceIssued = (checked: boolean) => {
      if (!activeJob) return;
      if (checked) setActiveJob({ ...activeJob, status: JobStatus.COMPLETED });
      else setActiveJob({ ...activeJob, status: JobStatus.CONFIRMED }); // Revert to confirmed
  };

  const handleAddExtraCost = () => {
      if (!activeJob || !newExtraDesc || !newExtraAmount) return;
      const newItem: ExtraCost = {
          id: Date.now().toString(),
          description: newExtraDesc,
          amount: parseFloat(newExtraAmount)
      };
      setActiveJob({ ...activeJob, extraCosts: [...(activeJob.extraCosts || []), newItem] });
      setNewExtraDesc(''); setNewExtraAmount('');
  };

  const removeExtraCost = (id: string) => {
      if (!activeJob) return;
      setActiveJob({ ...activeJob, extraCosts: (activeJob.extraCosts || []).filter(c => c.id !== id) });
  };

  // --- ADVANCED BUDGET CALCULATION ---
  const budget = useMemo(() => {
      if (!activeJob) return { 
          freelance: 0, internalTravel: 0, materials: 0, vehicles: 0, expenses: 0, 
          extra: 0, ztl: 0, totalCosts: 0, revenue: 0, margin: 0 
      };
      
      const days = Math.max(1, Math.ceil((new Date(activeJob.endDate).getTime() - new Date(activeJob.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      // 1. Crew Costs
      const freelanceCost = activeJob.assignedCrew.reduce((acc, crewId) => {
          const member = crew.find(c => c.id === crewId);
          return acc + (member && member.type === CrewType.FREELANCE ? member.dailyRate * days : 0);
      }, 0);

      // 2. Internal Per Diem
      const perDiemRate = settings?.defaultDailyIndemnity || 50;
      const internalTravelCost = activeJob.isAwayJob ? activeJob.assignedCrew.reduce((acc, crewId) => {
          const member = crew.find(c => c.id === crewId);
          return acc + (member && member.type === CrewType.INTERNAL ? perDiemRate * days : 0);
      }, 0) : 0;

      // 3. Materials & Vehicles
      const materialCost = activeJob.materialList.reduce((acc, m) => acc + (m.isExternal ? (m.cost || 0) * m.quantity : 0), 0);
      const vehicleCost = activeJob.vehicles.reduce((acc, v) => acc + (v.isRental ? (v.cost || 0) : 0), 0);
      
      // 4. Crew Expenses (Approved/Paid only)
      const approvedExpenses = crew.reduce((acc, c) => {
          const jobExpenses = c.expenses?.filter(e => 
            e.jobId === activeJob.id && 
            (e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED)
          ) || [];
          return acc + jobExpenses.reduce((sum, e) => sum + e.amount, 0);
      }, 0);

      // 5. ZTL Fine (Automated)
      const ztlCost = activeLocationData?.isZtl ? 70 : 0;

      // 6. Extra Costs
      const extraCost = (activeJob.extraCosts || []).reduce((acc, c) => acc + c.amount, 0);

      // Totals
      const totalCosts = freelanceCost + internalTravelCost + materialCost + vehicleCost + approvedExpenses + ztlCost + extraCost;
      const revenue = activeJob.invoiceAmount || 0;
      const margin = revenue - totalCosts;

      return {
          freelance: freelanceCost,
          internalTravel: internalTravelCost,
          materials: materialCost,
          vehicles: vehicleCost,
          expenses: approvedExpenses,
          extra: extraCost,
          ztl: ztlCost,
          totalCosts,
          revenue,
          margin
      };
  }, [activeJob, crew, settings, activeLocationData]);

  // List of expenses for the table
  const jobExpensesList = useMemo(() => {
      if (!activeJob) return [];
      const list: any[] = [];
      crew.forEach(c => {
          const validExpenses = c.expenses?.filter(e => 
              e.jobId === activeJob.id && 
              (e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED)
          ) || [];
          validExpenses.forEach(e => list.push({ ...e, crewName: c.name }));
      });
      return list;
  }, [activeJob, crew]);

  // --- ASSIGNED CREW OBJECTS (For Plan View) ---
  const assignedCrewObjects = useMemo(() => {
      if (!activeJob) return [];
      return crew.filter(c => activeJob.assignedCrew.includes(c.id));
  }, [activeJob, crew]);

  // --- TASK HANDLERS ---
  const handleAddNewTask = () => {
      if (!newTaskTitle || !activeJob || !onAddTask) return;
      const task: Task = {
          id: Date.now().toString(),
          title: newTaskTitle,
          assignedTo: newTaskAssignee,
          jobId: activeJob.id,
          createdBy: currentUser?.id || 'system',
          deadline: newTaskDeadline || activeJob.endDate,
          status: 'PENDING'
      };
      onAddTask(task);
      setNewTaskTitle(''); setNewTaskAssignee(''); setNewTaskDeadline('');
  };

  const jobTasks = useMemo(() => {
      if (!activeJob) return [];
      return tasks.filter(t => t.jobId === activeJob.id);
  }, [activeJob, tasks]);

  if (isEditing && activeJob) {
    return (
      <div className={`bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl h-[calc(100vh-140px)] flex flex-col print-only`}>
        <div className="flex justify-between items-center mb-4 shrink-0 no-print">
          <h2 className="text-xl font-bold text-white">{jobs.find(j => j.id === activeJob.id) ? 'Modifica Scheda Lavoro' : 'Nuova Scheda Lavoro'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
            {canEdit && <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400">Salva</button>}
          </div>
        </div>

        <div className="flex border-b border-glr-700 mb-4 shrink-0 overflow-x-auto no-print">
             {['DETAILS', 'LOCATION', 'PHASES', 'MATERIAL', 'CREW', 'TASKS', 'PLAN', ...(showBudget ? ['BUDGET'] : [])].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-glr-accent text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                     {tab === 'DETAILS' ? 'Dettagli Evento' : tab === 'LOCATION' ? 'Scheda Location' : tab === 'PHASES' ? 'Fasi & Logistica' : tab === 'MATERIAL' ? 'Materiale' : tab === 'CREW' ? 'Crew' : tab === 'TASKS' ? 'Task & Attività' : tab === 'PLAN' ? 'Piano di Produzione' : 'Budget & Costi'}
                 </button>
             ))}
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
            {/* ... (DETAILS, LOCATION, PHASES, MATERIAL, CREW TABS REMAIN UNCHANGED - SKIPPING FOR BREVITY) ... */}
            {activeTab === 'DETAILS' && (
                <div className="space-y-6 w-full">
                    {/* ... (Existing Details Content) ... */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            <div className="bg-glr-900 p-6 rounded-xl border border-glr-700 shadow-md">
                                <label className="block text-xs text-glr-accent mb-2 uppercase font-bold tracking-wider">Titolo Evento (Nome Scheda)</label>
                                <input disabled={!canEdit} type="text" value={activeJob.title} onChange={e => setActiveJob({...activeJob, title: e.target.value})} className="w-full bg-transparent border-b-2 border-glr-700 focus:border-glr-accent text-white font-bold text-3xl outline-none placeholder-gray-600 transition-colors" placeholder="Es. Convention Annuale 2024" />
                                <div className="mt-4 pt-4 border-t border-glr-800">
                                    <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Settori Coinvolti</label>
                                    <div className="flex gap-2">
                                        {['Audio', 'Video', 'Luci'].map(d => (
                                            <button key={d} onClick={() => canEdit && toggleDepartment(d)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${activeJob.departments.includes(d) ? 'bg-glr-accent text-glr-900 border-glr-accent' : 'bg-glr-800 text-gray-400 border-glr-600 hover:border-gray-400'}`}>{activeJob.departments.includes(d) && <Check size={12} className="inline mr-1"/>}{d}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-glr-900 p-5 rounded-xl border border-glr-700"><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Committente Principale</label><div className="flex items-center gap-3"><Briefcase size={20} className="text-gray-500"/><input disabled={!canEdit} type="text" value={activeJob.client} onChange={e => setActiveJob({...activeJob, client: e.target.value})} className="w-full bg-transparent border-b border-glr-700 focus:border-glr-accent text-white text-lg font-medium outline-none" placeholder="Azienda / Cliente" /></div></div>
                                <div className="bg-glr-900 p-5 rounded-xl border border-glr-700"><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Cliente Interno / Agenzia</label><div className="flex items-center gap-3"><User size={20} className="text-gray-500"/><input disabled={!canEdit} type="text" value={activeJob.internalClient || ''} onChange={e => setActiveJob({...activeJob, internalClient: e.target.value})} className="w-full bg-transparent border-b border-glr-700 focus:border-glr-accent text-white text-lg font-medium outline-none" placeholder="Opzionale" /></div></div>
                            </div>
                            <div className="bg-glr-900 p-5 rounded-xl border border-glr-700">
                                <label className="block text-xs text-gray-400 mb-3 uppercase font-bold flex items-center gap-2"><Handshake size={14}/> Partner & Collaborazioni</label>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer mt-1"><input disabled={!canEdit} type="checkbox" checked={activeJob.isSubcontracted} onChange={e => setActiveJob({...activeJob, isSubcontracted: e.target.checked})} className="rounded bg-glr-800 border-glr-600 text-glr-accent"/><span className="text-sm font-bold text-white">Subappalto</span></label>
                                        {activeJob.isSubcontracted && (<div className="flex-1 animate-fade-in"><input disabled={!canEdit} type="text" value={activeJob.subcontractorName || ''} onChange={e => setActiveJob({...activeJob, subcontractorName: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-1.5 text-white text-sm" placeholder="Azienda Subappalto"/></div>)}
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2 border-t border-glr-800">
                                         <label className="flex items-center gap-2 cursor-pointer w-fit"><input disabled={!canEdit} type="checkbox" checked={activeJob.hasExternalService} onChange={e => setActiveJob({...activeJob, hasExternalService: e.target.checked})} className="rounded bg-glr-800 border-glr-600 text-glr-accent"/><span className="text-sm font-bold text-white">Altri Service Coinvolti</span></label>
                                        {activeJob.hasExternalService && (<div className="flex gap-4 animate-fade-in pl-6"><div className="flex-1"><input disabled={!canEdit} type="text" value={activeJob.externalServiceName || ''} onChange={e => setActiveJob({...activeJob, externalServiceName: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-1.5 text-white text-sm" placeholder="Nome Service"/></div><div className="w-40"><select disabled={!canEdit} value={activeJob.externalServiceRole || ''} onChange={e => setActiveJob({...activeJob, externalServiceRole: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-1.5 text-white text-sm"><option value="">Settore...</option><option value="Audio">Audio</option><option value="Video">Video</option><option value="Luci">Luci</option><option value="Strutture">Strutture</option></select></div></div>)}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-glr-900 p-5 rounded-xl border border-glr-700">
                                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Location & Indirizzo</label>
                                <div className="flex gap-4"><select disabled={!canEdit} value={activeJob.locationId || "custom"} onChange={handleLocationChange} className="w-1/3 bg-glr-800 border border-glr-600 rounded-lg p-3 text-white text-sm font-bold shadow-sm"><option value="custom">Manuale / Custom...</option>{locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}</select><div className="flex-1 relative"><MapPin size={18} className="absolute left-3 top-3.5 text-gray-400"/><input disabled={!canEdit} type="text" value={activeJob.location} onChange={e => setActiveJob({...activeJob, location: e.target.value, locationId: undefined})} placeholder="Indirizzo Completo" className="w-full bg-glr-800 border border-glr-600 rounded-lg pl-10 pr-3 py-3 text-white text-sm" /></div></div>
                            </div>
                             <div className="bg-glr-900 p-5 rounded-xl border border-glr-700"><label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Descrizione Operativa & Note</label><textarea disabled={!canEdit} value={activeJob.description} onChange={e => setActiveJob({...activeJob, description: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-4 text-white h-40 text-sm leading-relaxed resize-none focus:border-glr-accent outline-none" placeholder="Dettagli aggiuntivi sull'evento, orari di massima, necessità particolari..." /></div>
                        </div>
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <div className="bg-glr-800 p-5 rounded-xl border border-glr-600 shadow-lg space-y-4">
                                 <div><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Stato Lavoro</label><select disabled={!canEdit} value={activeJob.status} onChange={e => setActiveJob({...activeJob, status: e.target.value as JobStatus})} className="w-full bg-glr-900 border border-glr-500 rounded p-3 text-white font-bold text-base focus:ring-2 ring-glr-accent outline-none">{Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                 {activeJob.logisticsStatus && (<div className="bg-glr-900/50 p-2 rounded border border-glr-700 flex justify-between items-center text-xs"><span className="text-gray-400 font-bold uppercase">Stato Logistica</span><span className={`px-2 py-1 rounded font-bold uppercase ${activeJob.logisticsStatus === 'LOADED' ? 'bg-blue-900/30 text-blue-300' : activeJob.logisticsStatus === 'RETURNED' ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-gray-400'}`}>{activeJob.logisticsStatus === 'PREPARATION' ? 'In Prep.' : activeJob.logisticsStatus === 'LOADED' ? 'Caricato' : activeJob.logisticsStatus === 'ON_SITE' ? 'In Evento' : 'Rientrato'}</span></div>)}
                                 {canEdit && (<div className="space-y-2 bg-glr-900/50 p-2 rounded border border-glr-700/50"><label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-glr-800 transition-colors"><input type="checkbox" checked={activeJob.status !== JobStatus.DRAFT} onChange={e => handleQuoteAccepted(e.target.checked)} className="rounded bg-glr-800 border-glr-600 text-green-500 w-4 h-4"/><span className="text-sm text-gray-300 font-bold">Preventivo Accettato</span></label>{(activeJob.status === JobStatus.CONFIRMED || activeJob.status === JobStatus.IN_PROGRESS || activeJob.status === JobStatus.COMPLETED) && (<label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-glr-800 transition-colors animate-fade-in"><input type="checkbox" checked={activeJob.status === JobStatus.COMPLETED} onChange={e => handleInvoiceIssued(e.target.checked)} className="rounded bg-glr-800 border-glr-600 text-purple-500 w-4 h-4"/><span className="text-sm text-gray-300 font-bold">Fattura Emessa</span></label>)}</div>)}
                                 <div className="space-y-3 pt-2"><div><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Inizio Evento</label><input disabled={!canEdit} type="date" value={activeJob.startDate} onChange={e => setActiveJob({...activeJob, startDate: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white" /></div><div><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Fine Evento</label><input disabled={!canEdit} type="date" value={activeJob.endDate} onChange={e => setActiveJob({...activeJob, endDate: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white" /></div></div>
                                 <div className="pt-2 border-t border-glr-700 mt-2"><label className="flex items-center gap-3 cursor-pointer bg-blue-900/20 p-3 rounded border border-blue-800/50 hover:bg-blue-900/30 transition-colors"><input disabled={!canEdit} type="checkbox" checked={activeJob.isAwayJob} onChange={e => setActiveJob({...activeJob, isAwayJob: e.target.checked})} className="rounded bg-glr-800 border-glr-600 text-blue-500 w-5 h-5"/><span className="text-sm text-blue-300 font-bold flex items-center gap-2"><Plane size={16}/> Trasferta / Away Job</span></label></div>
                            </div>
                            <div className="bg-glr-900/50 p-5 rounded-xl border border-glr-700"><h4 className="text-xs font-bold text-glr-accent uppercase mb-4 flex items-center gap-2 border-b border-glr-700/50 pb-2"><User size={14}/> Referente Lavoro</h4><div className="space-y-3"><input disabled={!canEdit} type="text" value={activeJob.contactName || ''} onChange={e => setActiveJob({...activeJob, contactName: e.target.value})} className="w-full bg-glr-800 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Nome Cognome" /><div className="flex items-center gap-2 relative"><Phone size={14} className="absolute left-3 text-gray-500"/><input disabled={!canEdit} type="text" value={activeJob.contactPhone || ''} onChange={e => setActiveJob({...activeJob, contactPhone: e.target.value})} className="w-full bg-glr-800 border border-glr-700 rounded p-2 pl-9 text-white text-sm" placeholder="Telefono" /></div><div className="flex items-center gap-2 relative"><Mail size={14} className="absolute left-3 text-gray-500"/><input disabled={!canEdit} type="text" value={activeJob.contactEmail || ''} onChange={e => setActiveJob({...activeJob, contactEmail: e.target.value})} className="w-full bg-glr-800 border border-glr-700 rounded p-2 pl-9 text-white text-sm" placeholder="Email" /></div></div></div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ... Other Tabs Logic ... */}
            {activeTab === 'LOCATION' && (
                <div className="space-y-6">
                    {activeLocationData ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                <div className="flex justify-between items-start mb-4"><h3 className="text-glr-accent font-bold uppercase text-sm flex items-center gap-2"><MapPin size={16}/> Accesso & Contatti</h3><a href={getRouteLink(activeLocationData.address)} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 transition-colors"><Navigation size={14}/> Calcola Percorso da Sede</a></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p className="text-white font-bold text-lg mb-1">{activeLocationData.name}</p><p className="text-gray-400 text-sm mb-2">{activeLocationData.address}</p>{activeLocationData.mapsLink && <a href={activeLocationData.mapsLink} target="_blank" className="text-blue-400 text-xs hover:underline">Vedi posizione esatta (Maps)</a>}</div><div className="text-sm space-y-1"><p><span className="text-gray-500">Referente Location:</span> <span className="text-white font-bold">{activeLocationData.contactName}</span></p><p><span className="text-gray-500">Telefono:</span> <span className="text-white font-bold">{activeLocationData.contactPhone}</span></p><p><span className="text-gray-500">Orari:</span> <span className="text-white">{activeLocationData.accessHours}</span></p><p><span className="text-gray-500">ZTL:</span> <span className={activeLocationData.isZtl ? 'text-red-400 font-bold' : 'text-green-400'}>{activeLocationData.isZtl ? 'ATTIVA' : 'NO'}</span></p></div></div>
                                {activeLocationData.generalSurveyNotes && (<div className="mt-4 pt-4 border-t border-glr-700"><p className="text-xs text-gray-500 uppercase mb-1">Note Generali</p><p className="text-sm text-gray-300 italic">"{activeLocationData.generalSurveyNotes}"</p></div>)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700"><h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Truck size={16}/> Logistica</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Piano Scarico:</span> <span className="text-white font-bold">{activeLocationData.logistics.loadFloor}</span></div><div className="flex justify-between"><span>Parcheggio:</span> <span className={activeLocationData.logistics.hasParking ? "text-green-400" : "text-red-400"}>{activeLocationData.logistics.hasParking ? 'SI' : 'NO'}</span></div><div className="flex justify-between"><span>Montacarichi:</span> <span className={activeLocationData.logistics.hasLift ? "text-green-400" : "text-gray-400"}>{activeLocationData.logistics.hasLift ? 'SI' : 'NO'}</span></div>{activeLocationData.logistics.stairsDetails && <div className="text-xs text-gray-400 mt-2">Scale: {activeLocationData.logistics.stairsDetails}</div>}</div></div>
                                <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700"><h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Zap size={16}/> Corrente</h3><div className="space-y-2 text-sm"><div className="flex gap-2">{activeLocationData.power.hasCivil && <span className="bg-glr-800 px-2 py-1 rounded text-xs">Civile</span>}{activeLocationData.power.hasIndustrial && <span className="bg-glr-800 px-2 py-1 rounded text-xs">Industriale {activeLocationData.power.industrialSockets.join(', ')}</span>}</div>{activeLocationData.power.requiresGenerator && <p className="text-red-400 font-bold">Serve Generatore</p>}<p>Distanza Quadro: <span className="font-bold text-white">{activeLocationData.power.distanceFromPanel} mt</span></p></div></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700"><h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Network size={16}/> Rete & IT</h3>{activeLocationData.network.isUnavailable ? <p className="text-red-400 text-sm font-bold flex items-center gap-2"><WifiOff size={16}/> Non Disponibile</p> : (<div className="space-y-2 text-sm"><div className="flex gap-2">{activeLocationData.network.hasWired && <span className="text-green-400">Cablata</span>}{activeLocationData.network.hasWifi && <span className="text-green-400">Wi-Fi</span>}</div>{activeLocationData.network.hasWallLan && <p>Lan Muro: {activeLocationData.network.wallLanDistance} mt</p>}<p>IP: {activeLocationData.network.addressing}</p></div>)}</div><div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700"><h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Monitor size={16}/> Dotazioni Sala</h3><div className="space-y-2 text-sm">{activeLocationData.equipment.hasPerimeterSockets && <p className="text-green-400">Prese Perimetrali Presenti</p>}{activeLocationData.equipment.audio.present && <p>Audio: {activeLocationData.equipment.audio.hasPA ? 'PA' : ''} {activeLocationData.equipment.audio.hasMics ? 'Mic' : ''}</p>}{activeLocationData.equipment.video.present && <p>Video: {activeLocationData.equipment.video.hasProjector ? 'VPR' : ''} {activeLocationData.equipment.video.hasLedwall ? 'Ledwall' : ''}</p>}{activeLocationData.equipment.hasLights && <p>Luci: Presenti</p>}</div></div></div>
                        </div>
                    ) : <p className="text-center text-gray-500 py-10">Nessuna location selezionata. Torna ai "Dettagli Evento" per selezionarne una o inserire un indirizzo manuale.</p>}
                </div>
            )}
            
            {activeTab === 'PHASES' && (
                <div className="space-y-8 animate-fade-in">
                     {/* ... (Existing Phases & Logistics Code) ... */}
                     {activeJob.isAwayJob && (<div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 mb-6"><h3 className="text-blue-300 font-bold flex items-center gap-2 text-lg mb-4"><Hotel size={20}/> Soggiorno & Hotel</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs text-blue-200 mb-1 font-bold">Nome Hotel / Struttura</label><div className="flex items-center gap-2"><BedDouble size={16} className="text-blue-400"/><input disabled={!canEdit} type="text" value={activeJob.hotelName || ''} onChange={e => setActiveJob({...activeJob, hotelName: e.target.value})} className="w-full bg-glr-900 border border-blue-800 rounded p-2 text-white text-sm" placeholder="Es. Hotel Da Vinci"/></div></div><div><label className="block text-xs text-blue-200 mb-1 font-bold">Indirizzo</label><div className="flex items-center gap-2"><MapPin size={16} className="text-blue-400"/><input disabled={!canEdit} type="text" value={activeJob.hotelAddress || ''} onChange={e => setActiveJob({...activeJob, hotelAddress: e.target.value})} className="w-full bg-glr-900 border border-blue-800 rounded p-2 text-white text-sm" placeholder="Via dei Fiori 2, Roma"/></div></div></div></div>)}
                     <div className="bg-glr-900/30 p-4 rounded-xl border border-glr-700/50"><div className="flex justify-between items-center mb-4"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><Clock size={20} className="text-glr-accent"/> Fasi Operative</h3>{canEdit && <button onClick={addPhase} className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors"><Plus size={18}/> Aggiungi Fase</button>}</div><div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs uppercase font-bold text-gray-500 border-b border-glr-700/50 mb-2"><div className="col-span-1 text-center">#</div><div className="col-span-5">Descrizione Attività</div><div className="col-span-3">Inizio</div><div className="col-span-3">Fine</div></div><div className="space-y-3">{activeJob.phases.map((phase, idx) => (<div key={phase.id} className="bg-glr-800 border border-glr-700 p-4 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-4 items-center shadow-sm hover:border-glr-500 transition-colors relative group"><div className="col-span-1 text-center"><span className="bg-glr-900 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</span></div><div className="col-span-11 md:col-span-5"><input disabled={!canEdit} type="text" value={phase.name} onChange={e => updatePhase(phase.id, 'name', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-3 text-white text-base focus:border-glr-accent outline-none" placeholder="Nome fase (es. Montaggio)"/></div><div className="col-span-6 md:col-span-3"><label className="block md:hidden text-xs text-gray-500 mb-1">Inizio</label><input disabled={!canEdit} type="datetime-local" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-3 text-white text-sm"/></div><div className="col-span-6 md:col-span-3 relative"><label className="block md:hidden text-xs text-gray-500 mb-1">Fine</label><input disabled={!canEdit} type="datetime-local" value={phase.end} onChange={e => updatePhase(phase.id, 'end', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-3 text-white text-sm"/>{canEdit && <button onClick={() => removePhase(phase.id)} className="absolute -right-2 -top-2 md:top-3 md:-right-12 bg-red-900/20 text-red-400 p-2 rounded-full hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>}</div></div>))}{activeJob.phases.length === 0 && <p className="text-center text-gray-500 py-4 italic">Nessuna fase operativa inserita.</p>}</div></div>
                     <div className="bg-glr-900/30 p-4 rounded-xl border border-glr-700/50"><div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><Truck size={20} className="text-glr-accent"/> Logistica Mezzi</h3>{canEdit && <button onClick={addVehicle} className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors"><Plus size={18}/> Aggiungi Mezzo</button>}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{activeJob.vehicles.map(v => (<div key={v.id} className="bg-glr-800 border border-glr-700 p-5 rounded-xl shadow-lg relative hover:border-glr-500 transition-all group"><div className="flex gap-4 mb-4 items-center"><div className="flex-1"><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Tipologia Mezzo</label><select disabled={!canEdit} value={v.type} onChange={e => updateVehicle(v.id, 'type', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-base p-3">{Object.values(VehicleType).map(t => <option key={t} value={t}>{t}</option>)}</select></div><div className="w-20"><label className="block text-xs text-gray-400 mb-1 uppercase font-bold text-center">Qtà</label><input disabled={!canEdit} type="number" min="1" value={v.quantity} onChange={e => updateVehicle(v.id, 'quantity', parseInt(e.target.value))} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-base p-3 text-center"/></div></div><div className="flex items-center gap-3 mb-2"><label className="flex items-center gap-2 cursor-pointer bg-glr-900 px-3 py-2 rounded border border-glr-600 hover:border-glr-400 transition-colors w-full"><input disabled={!canEdit} type="checkbox" checked={v.isRental} onChange={e => updateVehicle(v.id, 'isRental', e.target.checked)} className="w-5 h-5 rounded text-glr-accent bg-glr-800 border-glr-500"/><span className="text-sm font-bold text-white">Richiede Noleggio Esterno</span></label></div>{v.isRental && (<div className="mt-4 p-4 bg-blue-900/10 border border-blue-800/50 rounded-lg space-y-4 animate-fade-in"><div className="flex items-center gap-2 text-blue-300 text-xs uppercase font-bold border-b border-blue-800/30 pb-2 mb-2"><BriefcaseIcon size={12}/> Dettagli Noleggio</div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Fornitore</label><input disabled={!canEdit} type="text" placeholder="Nome Azienda" value={v.rentalCompany || ''} onChange={e => updateVehicle(v.id, 'rentalCompany', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-sm text-white"/></div><div><label className="block text-xs text-gray-400 mb-1">Data Ritiro</label><input disabled={!canEdit} type="datetime-local" value={v.pickupDate || ''} onChange={e => updateVehicle(v.id, 'pickupDate', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-sm text-white"/></div><div><label className="block text-xs text-gray-400 mb-1">Data Riconsegna</label><input disabled={!canEdit} type="datetime-local" value={v.returnDate || ''} onChange={e => updateVehicle(v.id, 'returnDate', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-sm text-white"/></div><div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Costo Stimato (€)</label><input disabled={!canEdit} type="number" placeholder="0.00" value={v.cost || ''} onChange={e => updateVehicle(v.id, 'cost', parseFloat(e.target.value))} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-sm text-white"/></div></div></div>)}{canEdit && <button onClick={() => removeVehicle(v.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-glr-900 p-2 rounded-full shadow-sm"><Trash2 size={18}/></button>}</div>))}{activeJob.vehicles.length === 0 && <p className="col-span-full text-center text-gray-500 py-4 italic">Nessun mezzo assegnato.</p>}</div></div>
                     <div className="bg-glr-900/30 p-4 rounded-xl border border-glr-700/50"><div className="flex items-center gap-3 mb-4"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><Users size={20} className="text-glr-accent"/> Gestione Facchinaggio</h3></div><label className="flex items-center gap-2 cursor-pointer w-fit mb-4"><input disabled={!canEdit} type="checkbox" checked={activeJob.hasPorterage} onChange={e => setActiveJob({...activeJob, hasPorterage: e.target.checked})} className="rounded bg-glr-800 border-glr-600 text-glr-accent w-5 h-5"/><span className="text-sm font-bold text-white">Servizio Facchinaggio Richiesto</span></label>{activeJob.hasPorterage && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in bg-glr-800 border border-glr-700 p-4 rounded-lg"><div><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Cooperativa / Azienda</label><input disabled={!canEdit} type="text" value={activeJob.porterageAgency || ''} onChange={e => setActiveJob({...activeJob, porterageAgency: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Nome Cooperativa"/></div><div><label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Data & Ora Convocazione</label><input disabled={!canEdit} type="datetime-local" value={activeJob.porterageTime || ''} onChange={e => setActiveJob({...activeJob, porterageTime: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/></div></div>)}</div>
                </div>
            )}
            
            {activeTab === 'MATERIAL' && (
                <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
                    {/* ... (Existing Material Code) ... */}
                    {canEdit && (
                        <div className="w-full md:w-1/2 flex flex-col gap-4 border-r border-glr-700 md:pr-4 overflow-hidden">
                             <div className="flex flex-wrap gap-2 mb-2 pb-2 shrink-0">
                                {quickItems.map(qItem => {
                                    const mockId = `quick-${qItem.name}`;
                                    const justAdded = addedFeedback[mockId];
                                    const isSpecial = qItem.name === 'Router 5G';
                                    return (<button key={qItem.name} onClick={() => handleQuickItemToggle(qItem)} className={`text-xs px-3 py-2 rounded border flex items-center gap-2 transition-all shadow-sm ${justAdded ? 'bg-green-600 text-white border-green-500 scale-105' : isSpecial ? 'bg-orange-900/40 text-orange-200 border-orange-500 hover:bg-orange-800' :'bg-glr-900 border-glr-600 text-gray-300 hover:bg-glr-800 hover:text-white'}`}>{justAdded ? <Check size={14}/> : <Plus size={14}/>} {qItem.name}</button>)
                                })}
                                <button onClick={() => setIsImportKitModalOpen(true)} className="text-xs px-3 py-2 rounded border border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 whitespace-nowrap flex items-center gap-2"><Box size={14}/> Importa Kit</button>
                             </div>
                            <div className="flex bg-glr-900 p-1 rounded-lg shrink-0"><button onClick={() => setAddMode('BROWSE')} className={`flex-1 py-2 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${addMode === 'BROWSE' ? 'bg-glr-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}><Search size={16}/> Magazzino</button><button onClick={() => setAddMode('MANUAL')} className={`flex-1 py-2 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${addMode === 'MANUAL' ? 'bg-glr-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}><Edit3 size={16}/> Manuale / Esterno</button></div>
                            {addMode === 'BROWSE' ? (
                                <div className="flex flex-col flex-1 overflow-hidden gap-3">
                                    <div className="flex gap-2 shrink-0"><div className="w-1/2"><select value={invCategoryFilter} onChange={e => setInvCategoryFilter(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-xs p-2 outline-none focus:border-glr-accent"><option value="ALL">Cat: Tutte</option>{['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Rete', 'Accessori'].map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="w-1/2"><select value={invTypeFilter} onChange={e => setInvTypeFilter(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-xs p-2 outline-none focus:border-glr-accent">{availableTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'Tipo: Tutti' : t}</option>)}</select></div></div>
                                    <div className="relative shrink-0"><Search size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" placeholder="Cerca articolo..." value={invSearchTerm} onChange={e => setInvSearchTerm(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"/></div>
                                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">{filteredInventory.map(item => { const added = addedFeedback[item.id]; return (<div key={item.id} onClick={() => handleInventoryAdd(item)} className="bg-glr-900 p-3 rounded border border-glr-700 cursor-pointer hover:border-glr-500 hover:bg-glr-800 transition-all group flex justify-between items-center relative"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white truncate group-hover:text-glr-accent">{item.name}</span><span className="text-[10px] text-gray-500 font-mono">Disp: {item.quantityOwned}</span></div><div className="flex gap-2 text-[10px] text-gray-500"><span className="bg-glr-950 px-1.5 py-0.5 rounded border border-glr-800">{item.category}</span>{item.type && <span className="opacity-70">• {item.type}</span>}</div></div><button className={`p-2 rounded-full transition-colors border ${added ? 'bg-green-600 text-white border-green-500' : 'bg-glr-950 text-green-500 hover:bg-green-500 hover:text-white border-glr-800 group-hover:border-green-500'}`}>{added ? <Check size={16}/> : <Plus size={16}/>}</button></div>)})} {filteredInventory.length === 0 && <div className="text-center text-gray-500 py-10 italic">Nessun articolo trovato.</div>}</div>
                                </div>
                            ) : (
                                <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl space-y-4">
                                    <div><label className="block text-xs text-gray-400 mb-1">Nome Materiale</label><input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm focus:border-glr-accent outline-none" placeholder="Es. Noleggio Service Audio"/></div>
                                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-400 mb-1">Categoria</label><select value={manualCategory} onChange={e => setManualCategory(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded text-white text-sm p-2"><option>Audio</option><option>Video</option><option>Luci</option><option>Cavi</option><option>Strutture</option><option>Altro</option></select></div><div><label className="block text-xs text-gray-400 mb-1">Tipologia</label><input type="text" value={manualType} onChange={e => setManualType(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Extra"/></div></div>
                                    <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-400 mb-1">Quantità</label><input type="number" min="1" value={manualQty} onChange={e => setManualQty(parseInt(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/></div><div><label className="block text-xs text-gray-400 mb-1">Costo Unit. (€)</label><input type="number" value={manualCost} onChange={e => setManualCost(parseFloat(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="0.00"/></div></div>
                                     <label className="flex items-center gap-2 cursor-pointer bg-glr-800 p-2 rounded border border-glr-600"><input type="checkbox" checked={manualIsExternal} onChange={e => setManualIsExternal(e.target.checked)} className="rounded bg-glr-900 border-glr-500 text-glr-accent"/><span className="text-sm text-gray-300">Noleggio Esterno</span></label>
                                    {manualIsExternal && (<div><label className="block text-xs text-gray-400 mb-1">Fornitore</label><input type="text" value={manualSupplier} onChange={e => setManualSupplier(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Nome fornitore"/></div>)}
                                    <button onClick={handleAddManualItem} disabled={!manualName} className="w-full bg-glr-700 hover:bg-white hover:text-glr-900 text-white py-2 rounded font-bold transition-colors disabled:opacity-50 mt-2">Aggiungi Materiale</button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="w-full md:w-1/2 flex flex-col bg-glr-900 rounded-xl border border-glr-700 overflow-hidden">
                        <div className="bg-glr-950 p-3 border-b border-glr-800 flex justify-between items-center shrink-0"><h4 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2"><Layers size={14}/> Lista Materiale</h4><span className="bg-glr-800 text-glr-accent px-2 py-0.5 rounded text-xs font-mono">{activeJob.materialList.reduce((acc, i) => acc + i.quantity, 0)} Pz.</span></div>
                        <div className="overflow-y-auto flex-1 p-2">
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Rete', 'Accessori', 'Altro'].map(cat => {
                            const items = materialByCategory[cat];
                            if (!items || items.length === 0) return null;
                            return (
                                <div key={cat} className="mb-4 last:mb-0">
                                    <div className="bg-glr-800 px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-glr-accent uppercase tracking-wider rounded-t-lg border-b border-glr-700">{getCategoryIcon(cat)} {cat}</div>
                                    <table className="w-full text-left text-sm bg-glr-800/20"><tbody className="divide-y divide-glr-800/50">{items.map((item) => (<tr key={item.id} className="hover:bg-glr-800/50 group"><td className="pl-3 py-2 font-medium text-white w-1/3">{item.name}<div className="text-[10px] text-gray-500">{item.category} {item.type ? `• ${item.type}` : ''} {item.isExternal && <span className="text-orange-400 ml-1">(Ext)</span>}</div></td><td className="py-2 w-1/3"><input type="text" value={item.notes || ''} onChange={e => updateItemNotes(item.id, e.target.value)} className="bg-transparent border-b border-transparent hover:border-gray-600 text-xs text-gray-300 w-full focus:border-glr-accent focus:outline-none" placeholder="Note..."/></td><td className="py-2 text-right pr-2 w-24"><div className="flex items-center justify-end gap-1">{canEdit && <button onClick={() => updateItemQuantity(item.id, -1)} className="p-0.5 hover:bg-glr-700 rounded text-gray-500"><Minus size={12}/></button>}<span className="font-bold text-glr-accent w-6 text-center">{item.quantity}</span>{canEdit && <button onClick={() => updateItemQuantity(item.id, 1)} className="p-0.5 hover:bg-glr-700 rounded text-gray-500"><Plus size={12}/></button>}</div></td><td className="py-2 text-right w-8">{canEdit && <button onClick={() => setActiveJob({...activeJob, materialList: activeJob.materialList.filter(m => m.id !== item.id)})} className="text-gray-600 hover:text-red-400"><X size={14}/></button>}</td></tr>))}</tbody></table>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                    {isImportKitModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                            <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md shadow-2xl animate-fade-in">
                                <div className="p-4 border-b border-glr-700 flex justify-between items-center"><h3 className="text-lg font-bold text-white">Importa Kit Standard</h3><button onClick={() => setIsImportKitModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button></div>
                                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">{standardLists.length === 0 && <p className="text-gray-500 italic text-center">Nessun kit salvato.</p>}{standardLists.map(list => (<button key={list.id} onClick={() => handleImportKit(list)} className="w-full text-left bg-glr-900 border border-glr-700 p-3 rounded hover:border-glr-accent transition-colors"><h4 className="font-bold text-white">{list.name}</h4><p className="text-xs text-gray-400">{list.items.length} articoli</p></button>))}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'CREW' && (
                <div className="space-y-6">
                    {/* ... (Existing Crew Assignment Code) ... */}
                    <h3 className="text-glr-accent font-semibold uppercase text-sm tracking-wider flex items-center gap-2"><UserPlus size={16}/> Assegnazione Tecnici per Fase</h3>
                    <p className="text-gray-400 text-xs">Assegna i tecnici alle specifiche fasi operative dell'evento. I tecnici selezionati appariranno nel planning globale.</p>
                    {activeJob.phases.length === 0 && (<div className="bg-red-900/20 border border-red-800 rounded p-4 text-center"><p className="text-red-300 text-sm font-bold mb-2">Nessuna Fase Operativa definita</p><p className="text-gray-400 text-xs mb-3">Devi prima creare le fasi (es. Montaggio, Evento) nella sezione "Fasi & Logistica" per poter assegnare la crew.</p><button onClick={() => setActiveTab('PHASES')} className="text-white bg-glr-700 px-3 py-1 rounded text-xs hover:bg-glr-600">Vai a Fasi</button></div>)}
                    <div className="grid grid-cols-1 gap-6">{activeJob.phases.map(phase => (<div key={phase.id} className="bg-glr-800 border border-glr-700 rounded-lg overflow-hidden"><div className="bg-glr-900/50 p-3 border-b border-glr-700 flex justify-between items-center"><div className="flex items-center gap-2"><div className="bg-glr-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{activeJob.phases.indexOf(phase) + 1}</div><h4 className="font-bold text-white">{phase.name}</h4></div><div className="text-xs text-gray-400 flex items-center gap-2"><Calendar size={12}/>{new Date(phase.start).toLocaleDateString()} {new Date(phase.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(phase.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div></div><div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{crew.map(c => { const isAssigned = (phase.assignedCrew || []).includes(c.id); return (<button key={c.id} onClick={() => canEdit && toggleCrewInPhase(phase.id, c.id)} disabled={!canEdit} className={`p-4 h-24 rounded-lg border text-left transition-all relative flex flex-col justify-between shadow-md hover:shadow-lg hover:scale-[1.02] ${isAssigned ? 'bg-green-600/20 border-green-500' : 'bg-glr-900 border-glr-700 hover:border-gray-500'}`}><div className="flex justify-between w-full"><div className="w-8 h-8 rounded-full bg-glr-800 flex items-center justify-center text-sm font-bold text-gray-300 border border-glr-600">{c.name.charAt(0)}</div>{isAssigned && <div className="bg-green-500 text-white rounded-full p-0.5"><Check size={14}/></div>}</div><div><span className={`block font-bold text-sm ${isAssigned ? 'text-white' : 'text-gray-400'}`}>{c.name}</span><span className="text-[10px] text-gray-500 block truncate">{c.roles[0]}</span></div></button>)})}</div></div>))}</div>
                </div>
            )}

            {activeTab === 'TASKS' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2"><ClipboardCheck size={18}/> Task & Attività</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Task Form */}
                        {canEdit && (
                            <div className="bg-glr-900/50 p-4 rounded-xl border border-glr-700 h-fit">
                                <h4 className="text-glr-accent font-bold text-sm mb-4 uppercase">Nuovo Task</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Titolo Attività</label>
                                        <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Scaricare SD Card"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Assegna a</label>
                                        <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm">
                                            <option value="">-- Seleziona Tecnico --</option>
                                            {assignedCrewObjects.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Scadenza</label>
                                        <input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/>
                                    </div>
                                    <button onClick={handleAddNewTask} disabled={!newTaskTitle || !newTaskAssignee} className="w-full bg-glr-700 hover:bg-white hover:text-glr-900 text-white font-bold py-2 rounded text-sm transition-colors disabled:opacity-50">Aggiungi Task</button>
                                </div>
                            </div>
                        )}

                        {/* Task List */}
                        <div className="md:col-span-2 space-y-3">
                            {jobTasks.length === 0 && <div className="text-center text-gray-500 py-10 bg-glr-900/30 rounded-xl border border-dashed border-glr-700">Nessun task assegnato per questo lavoro.</div>}
                            {jobTasks.map(task => {
                                const assigneeName = crew.find(c => c.id === task.assignedTo)?.name || 'Sconosciuto';
                                const isCompleted = task.status === 'COMPLETED';
                                
                                return (
                                    <div key={task.id} className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${isCompleted ? 'bg-green-900/20 border-green-800 opacity-70' : 'bg-glr-800 border-glr-700'}`}>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => onUpdateTask && onUpdateTask({...task, status: isCompleted ? 'PENDING' : 'COMPLETED'})} className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 text-transparent hover:border-white'}`}>
                                                <Check size={16} strokeWidth={3}/>
                                            </button>
                                            <div>
                                                <p className={`font-bold text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</p>
                                                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><User size={12}/> {assigneeName}</span>
                                                    <span className={`flex items-center gap-1 ${!isCompleted && new Date(task.deadline) < new Date() ? 'text-red-400 font-bold' : ''}`}><Clock size={12}/> Scadenza: {new Date(task.deadline).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <button onClick={() => onDeleteTask && onDeleteTask(task.id)} className="text-gray-600 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BUDGET' && showBudget && (
                <div className="space-y-8 animate-fade-in h-full flex flex-col">
                    {/* ... (Existing Budget Code) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0"><div className="bg-glr-900 p-5 rounded-xl border border-glr-700 shadow-md"><h4 className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2"><Receipt size={14}/> Totale Fattura (Revenue)</h4><div className="flex items-center gap-2"><Euro size={20} className="text-green-500"/><input disabled={!canEdit} type="number" step="0.01" value={activeJob.invoiceAmount || ''} onChange={e => setActiveJob({...activeJob, invoiceAmount: parseFloat(e.target.value)})} placeholder="0.00" className="w-full bg-transparent border-b border-glr-700 text-3xl font-bold text-white focus:border-green-500 outline-none"/></div></div><div className="bg-glr-900 p-5 rounded-xl border border-glr-700 shadow-md"><h4 className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2"><Calculator size={14}/> Totale Costi</h4><div className="flex items-center gap-2"><Euro size={20} className="text-red-400"/><span className="text-3xl font-bold text-white">{budget.totalCosts.toFixed(2)}</span></div></div><div className={`p-5 rounded-xl border shadow-md flex flex-col justify-center ${budget.margin >= 0 ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}><h4 className={`text-xs uppercase font-bold mb-1 flex items-center gap-2 ${budget.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>{budget.margin >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} Margine Utile</h4><div className="flex items-center gap-2"><Euro size={24} className={budget.margin >= 0 ? 'text-green-500' : 'text-red-500'}/><span className={`text-4xl font-bold ${budget.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>{budget.margin.toFixed(2)}</span></div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden"><div className="bg-glr-900/50 border border-glr-700 rounded-xl overflow-hidden flex flex-col"><div className="p-4 border-b border-glr-700 bg-glr-800"><h4 className="font-bold text-white flex items-center gap-2"><Landmark size={18}/> Dettaglio Costi</h4></div><div className="p-4 space-y-3 flex-1 overflow-y-auto"><div className="flex justify-between p-3 bg-glr-800/50 rounded border border-glr-700/50"><span className="text-gray-300 text-sm">Personale Esterno (Freelance)</span><span className="text-white font-mono font-bold flex items-center gap-1"><Euro size={12}/> {budget.freelance.toFixed(2)}</span></div><div className="flex justify-between p-3 bg-glr-800/50 rounded border border-glr-700/50"><span className="text-gray-300 text-sm">Diarie Trasferta (Interni)</span><span className="text-white font-mono font-bold flex items-center gap-1"><Euro size={12}/> {budget.internalTravel.toFixed(2)}</span></div><div className="flex justify-between p-3 bg-glr-800/50 rounded border border-glr-700/50"><span className="text-gray-300 text-sm">Noleggi Materiale (Esterno)</span><span className="text-white font-mono font-bold flex items-center gap-1"><Euro size={12}/> {budget.materials.toFixed(2)}</span></div><div className="flex justify-between p-3 bg-glr-800/50 rounded border border-glr-700/50"><span className="text-gray-300 text-sm">Logistica & Mezzi (Noleggi)</span><span className="text-white font-mono font-bold flex items-center gap-1"><Euro size={12}/> {budget.vehicles.toFixed(2)}</span></div>{budget.ztl > 0 && (<div className="flex justify-between p-3 bg-red-900/10 rounded border border-red-900/30"><span className="text-red-300 text-sm flex items-center gap-2"><AlertTriangle size={14}/> Multa ZTL (Automated)</span><span className="text-red-300 font-mono font-bold flex items-center gap-1"><Euro size={12}/> {budget.ztl.toFixed(2)}</span></div>)}<div className="border-t border-glr-700 pt-3 mt-2"><div className="flex justify-between items-center mb-2"><h5 className="text-xs font-bold text-glr-accent uppercase">Oneri Accessori</h5></div><div className="space-y-2 mb-3">{(activeJob.extraCosts || []).map(extra => (<div key={extra.id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-glr-700"><span className="text-gray-400">{extra.description}</span><div className="flex items-center gap-3"><span className="text-white font-mono"><Euro size={10} className="inline"/> {extra.amount.toFixed(2)}</span>{canEdit && <button onClick={() => removeExtraCost(extra.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={12}/></button>}</div></div>))}</div>{canEdit && (<div className="flex gap-2"><input type="text" value={newExtraDesc} onChange={e => setNewExtraDesc(e.target.value)} placeholder="Descrizione onere..." className="flex-1 bg-glr-900 border border-glr-600 rounded p-1.5 text-xs text-white"/><input type="number" value={newExtraAmount} onChange={e => setNewExtraAmount(e.target.value)} placeholder="€" className="w-20 bg-glr-900 border border-glr-600 rounded p-1.5 text-xs text-white"/><button onClick={handleAddExtraCost} disabled={!newExtraAmount} className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white rounded px-2"><Plus size={16}/></button></div>)}</div></div></div><div className="bg-glr-900/50 border border-glr-700 rounded-xl overflow-hidden flex flex-col"><div className="p-4 border-b border-glr-700 bg-glr-800 flex justify-between items-center"><h4 className="font-bold text-white flex items-center gap-2"><Receipt size={18}/> Rimborsi Spese Crew</h4><span className="bg-glr-900 text-gray-400 text-xs px-2 py-1 rounded">Approvati</span></div><div className="flex-1 overflow-y-auto"><table className="w-full text-left text-sm"><thead className="bg-glr-900 text-gray-500 text-xs uppercase sticky top-0"><tr><th className="p-3">Data</th><th className="p-3">Tecnico</th><th className="p-3">Descrizione</th><th className="p-3 text-right">Importo</th></tr></thead><tbody className="divide-y divide-glr-700/50">{jobExpensesList.map((exp: any) => (<tr key={exp.id} className="hover:bg-glr-800/30"><td className="p-3 text-gray-400 text-xs">{new Date(exp.date).toLocaleDateString()}</td><td className="p-3 font-bold text-white text-xs">{exp.crewName}</td><td className="p-3 text-gray-300 text-xs">{exp.description}</td><td className="p-3 text-right font-mono text-white text-xs flex justify-end items-center gap-1"><Euro size={10}/> {exp.amount.toFixed(2)}</td></tr>))}{jobExpensesList.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500 italic text-xs">Nessuna spesa approvata per questo lavoro.</td></tr>}</tbody><tfoot className="bg-glr-900 border-t border-glr-700"><tr><td colSpan={3} className="p-3 text-right font-bold text-gray-400 uppercase text-xs">Totale Rimborsi</td><td className="p-3 text-right font-bold text-white font-mono flex justify-end items-center gap-1"><Euro size={12}/> {budget.expenses.toFixed(2)}</td></tr></tfoot></table></div></div></div>
                </div>
            )}

            {activeTab === 'PLAN' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center no-print">
                        <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList size={18}/> Piano di Produzione & Call Sheet</h3>
                        <button onClick={handlePrint} className="bg-glr-accent text-glr-900 font-bold px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-400"><Printer size={16}/> Stampa PDF</button>
                    </div>
                    
                    {/* --- PRINTABLE CALL SHEET --- */}
                    <div className="bg-white text-black p-8 rounded shadow-lg min-h-[1000px] font-sans print-only text-sm">
                        
                        {/* HEADER */}
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                            <div className="flex items-center gap-4">
                                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" alt="Logo"/> : <div className="text-2xl font-bold text-black">GLR</div>}
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-tight text-black">{settings?.companyName || 'GLR Productions'}</h1>
                                    <p className="text-sm text-black">{settings?.address}</p>
                                    <p className="text-sm text-black">P.IVA: {settings?.pIva}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold uppercase tracking-tight text-black">Call Sheet</h2>
                                <p className="text-sm font-bold mt-1 text-black">Stato: {activeJob.status}</p>
                            </div>
                        </div>

                        {/* SECTION 1: EVENT INFO */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="border border-black p-3">
                                <h4 className="font-bold uppercase bg-gray-200 border-b border-black p-1 text-xs mb-2 text-black">Evento</h4>
                                <p className="text-lg font-bold mb-1 text-black">{activeJob.title}</p>
                                <p className="text-black"><strong>Cliente:</strong> {activeJob.client}</p>
                                <p className="text-black"><strong>Date:</strong> {new Date(activeJob.startDate).toLocaleDateString()} - {new Date(activeJob.endDate).toLocaleDateString()}</p>
                                {activeJob.departments.length > 0 && <p className="text-black text-xs mt-1"><strong>Settori:</strong> {activeJob.departments.join(', ')}</p>}
                            </div>
                             <div className="border border-black p-3">
                                <h4 className="font-bold uppercase bg-gray-200 border-b border-black p-1 text-xs mb-2 text-black">Location</h4>
                                <p className="text-lg font-bold mb-1 text-black">{activeJob.location}</p>
                                <p className="text-black">{activeLocationData?.address || activeJob.location}</p>
                                <p className="text-xs italic mt-1 text-black">{activeLocationData?.generalSurveyNotes || ''}</p>
                            </div>
                        </div>

                        {/* SECTION 2: LOGISTICS & ACCESS (DETAILED) */}
                        <div className="mb-6 border border-black p-3">
                            <h4 className="font-bold uppercase bg-gray-200 border-b border-black p-1 text-xs mb-2 text-black">Logistica & Accessi</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p><strong>Orari Accesso:</strong> {activeLocationData?.accessHours || 'N/D'}</p>
                                    <p><strong>Piano Scarico:</strong> {activeLocationData?.logistics.loadFloor || 'N/D'}</p>
                                    <p><strong>Parcheggio:</strong> {activeLocationData?.logistics.hasParking ? 'Disponibile' : 'Non Disponibile'}</p>
                                    <p><strong>ZTL:</strong> {activeLocationData?.isZtl ? 'ATTIVA (Comunicare targhe)' : 'NO'}</p>
                                </div>
                                <div>
                                    <p><strong>Corrente:</strong> {activeLocationData?.power.hasIndustrial ? `Industriale (${activeLocationData.power.industrialSockets.join(', ')})` : 'Civile'}</p>
                                    <p><strong>Distanza Quadro:</strong> {activeLocationData?.power.distanceFromPanel ? `${activeLocationData.power.distanceFromPanel} mt` : 'N/D'}</p>
                                    {activeLocationData?.power.requiresGenerator && <p className="font-bold">⚠️ RICHIESTO GENERATORE</p>}
                                </div>
                            </div>
                            
                            {/* Porterage Highlight */}
                            {activeJob.hasPorterage && activeJob.porterageAgency && (
                                <div className="mt-3 pt-2 border-t border-black border-dashed">
                                    <p className="font-bold uppercase text-black">Servizio Facchinaggio</p>
                                    <div className="flex justify-between items-center bg-gray-100 p-2 mt-1 border border-black">
                                        <span><strong>Fornitore:</strong> {activeJob.porterageAgency}</span>
                                        <span className="text-sm font-bold">CONVOCAZIONE: {activeJob.porterageTime ? new Date(activeJob.porterageTime).toLocaleString([], {weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : 'TBD'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: CREW LIST (NEW) */}
                        <div className="mb-6">
                            <h4 className="font-bold uppercase border-b-2 border-black mb-2 text-black">Team Tecnico & Crew</h4>
                            <table className="w-full border-collapse border border-black text-xs">
                                <thead className="bg-gray-200 text-black">
                                    <tr>
                                        <th className="border border-black p-1 text-left w-1/4">Ruolo</th>
                                        <th className="border border-black p-1 text-left w-1/2">Nome Cognome</th>
                                        <th className="border border-black p-1 text-left w-1/4">Telefono</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black">
                                    {assignedCrewObjects.length === 0 && <tr><td colSpan={3} className="p-2 text-center italic">Nessuna crew assegnata</td></tr>}
                                    {assignedCrewObjects.map(c => (
                                        <tr key={c.id}>
                                            <td className="border border-black p-1 font-bold">{c.roles[0]}</td>
                                            <td className="border border-black p-1">{c.name}</td>
                                            <td className="border border-black p-1">{c.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* SECTION 4: CONTACTS */}
                        <div className="mb-6">
                            <h4 className="font-bold uppercase border-b-2 border-black mb-2 text-black">Contatti Utili</h4>
                            <table className="w-full border-collapse border border-black text-xs">
                                <thead className="bg-gray-200 text-black">
                                    <tr>
                                        <th className="border border-black p-1 text-left">Ruolo</th>
                                        <th className="border border-black p-1 text-left">Nome</th>
                                        <th className="border border-black p-1 text-left">Telefono</th>
                                        <th className="border border-black p-1 text-left">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black">
                                    <tr>
                                        <td className="border border-black p-1 font-bold">Referente Lavoro</td>
                                        <td className="border border-black p-1">{activeJob.contactName || '-'}</td>
                                        <td className="border border-black p-1">{activeJob.contactPhone || '-'}</td>
                                        <td className="border border-black p-1">{activeJob.contactEmail || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 font-bold">Referente Location</td>
                                        <td className="border border-black p-1">{activeLocationData?.contactName || '-'}</td>
                                        <td className="border border-black p-1">{activeLocationData?.contactPhone || '-'}</td>
                                        <td className="border border-black p-1">-</td>
                                    </tr>
                                    {activeJob.isSubcontracted && activeJob.subcontractorName && (
                                        <tr>
                                            <td className="border border-black p-1 font-bold">Subappalto</td>
                                            <td className="border border-black p-1">{activeJob.subcontractorName}</td>
                                            <td className="border border-black p-1">-</td>
                                            <td className="border border-black p-1">-</td>
                                        </tr>
                                    )}
                                    {activeJob.hasExternalService && activeJob.externalServiceName && (
                                        <tr>
                                            <td className="border border-black p-1 font-bold">Service {activeJob.externalServiceRole || 'Esterno'}</td>
                                            <td className="border border-black p-1">{activeJob.externalServiceName}</td>
                                            <td className="border border-black p-1">-</td>
                                            <td className="border border-black p-1">-</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* SECTION 5: LOGISTICS & OUTFIT */}
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <h4 className="font-bold uppercase border-b-2 border-black mb-2 text-black">Logistica & Hotel</h4>
                                <ul className="list-disc pl-4 text-xs space-y-1 text-black">
                                    <li><strong>Mezzi:</strong> {activeJob.vehicles.length > 0 ? activeJob.vehicles.map(v => `${v.quantity}x ${v.type}`).join(', ') : 'Nessun mezzo assegnato'}</li>
                                    {activeJob.isAwayJob && (
                                        <>
                                            <li><strong>Hotel:</strong> {activeJob.hotelName || 'Da definire'}</li>
                                            <li><strong>Indirizzo Hotel:</strong> {activeJob.hotelAddress || '-'}</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold uppercase border-b-2 border-black mb-2 text-black">Info Crew</h4>
                                <ul className="list-disc pl-4 text-xs space-y-1 text-black">
                                    <li><strong>Outfit:</strong> {activeJob.outfitNoLogo ? 'NO LOGO' : ''} {activeJob.outfit || 'Standard'}</li>
                                    <li><strong>Crew Assegnata:</strong> {activeJob.assignedCrew.length} Tecnici</li>
                                </ul>
                            </div>
                        </div>

                        {/* SECTION 6: SCHEDULE */}
                        <div className="mb-8">
                            <h4 className="font-bold uppercase border-b-2 border-black mb-2 text-black">Programma Orario (Phases)</h4>
                            <table className="w-full text-sm text-left border-collapse border border-black">
                                <thead className="bg-gray-200 text-black uppercase font-bold text-xs">
                                    <tr><th className="p-1 border border-black">Attività</th><th className="p-1 border border-black w-32">Inizio</th><th className="p-1 border border-black w-32">Fine</th></tr>
                                </thead>
                                <tbody className="text-black">
                                    {activeJob.phases.map(p => (
                                        <tr key={p.id}>
                                            <td className="p-1 border border-black font-bold">{p.name}</td>
                                            <td className="p-1 border border-black">{new Date(p.start).toLocaleString('it-IT', {weekday: 'short', hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="p-1 border border-black">{new Date(p.end).toLocaleString('it-IT', {hour: '2-digit', minute:'2-digit'})}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                         {/* SECTION 7: NOTES */}
                        {activeJob.description && (
                             <div className="mb-8 border border-black p-2 bg-gray-100">
                                 <h4 className="font-bold uppercase text-xs mb-1 text-black">Note di Produzione</h4>
                                 <p className="text-xs italic text-black">{activeJob.description}</p>
                             </div>
                        )}

                        {/* PAGE BREAK FOR PACKING LIST */}
                        <div className="page-break w-full h-1 bg-gray-200 my-8 print:h-0 print:my-0 print:bg-transparent"></div>

                        {/* LISTA MATERIALE (PACKING LIST) */}
                        <div className="border-b-2 border-black pb-4 mb-6 pt-8 flex justify-between items-center break-before-page">
                             <div className="flex items-center gap-4">
                                {settings?.logoUrl && <img src={settings.logoUrl} className="w-12 h-12 object-contain" alt="GLR" />}
                                <div><h1 className="text-2xl font-bold uppercase tracking-tight text-black">Lista Materiale</h1></div>
                            </div>
                            <div className="text-right text-black">
                                <p className="font-bold">{activeJob.title}</p>
                                <p className="text-xs">{activeJob.location}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Rete', 'Accessori', 'Altro'].map(cat => {
                            const items = materialByCategory[cat];
                            if (!items || items.length === 0) return null;
                            return (
                                <div key={cat} className="break-inside-avoid">
                                    <h4 className="font-bold uppercase bg-black text-white px-2 py-1 mb-0 text-sm border border-black">{cat}</h4>
                                    <table className="w-full text-sm border-2 border-black border-t-0 border-collapse">
                                        <thead className="bg-gray-200 uppercase text-xs text-black">
                                            <tr>
                                                <th className="border-2 border-black p-2 w-16 text-center">Check</th>
                                                <th className="border-2 border-black p-2 text-left">Descrizione Articolo</th>
                                                <th className="border-2 border-black p-2 w-24 text-center">Quantità</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(m => (
                                                <tr key={m.id}>
                                                    <td className="border-2 border-black p-2 text-center align-middle">
                                                        <div className="w-4 h-4 border-2 border-black mx-auto"></div>
                                                    </td>
                                                    <td className="border-2 border-black p-2 font-bold align-middle text-black">
                                                        {m.name}
                                                        {m.isExternal && <span className="text-[10px] ml-2 italic font-normal text-black">(NOLEGGIO)</span>}
                                                        {m.notes && <div className="text-[10px] font-normal italic mt-0.5 text-black">{m.notes}</div>}
                                                    </td>
                                                    <td className="border-2 border-black p-2 text-center font-bold align-middle text-black text-lg">{m.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        })}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {isTemplateModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
                     <div className="p-4 border-b border-glr-700 flex justify-between items-center">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2"><Copy size={18}/> Crea da Lavoro Esistente</h3>
                         <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                         {jobs.map(j => (
                             <button key={j.id} onClick={() => handleCreateFromExisting(j)} className="w-full text-left bg-glr-900 border border-glr-700 p-3 rounded hover:border-glr-accent transition-colors group">
                                 <h4 className="font-bold text-white group-hover:text-glr-accent">{j.title}</h4>
                                 <p className="text-xs text-gray-400">{j.client} • {j.location}</p>
                             </button>
                         ))}
                     </div>
                </div>
             </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-white">Schede Lavoro</h2></div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
             <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700 w-full sm:w-auto">
                <button onClick={() => setViewMode('TIMELINE')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors ${viewMode === 'TIMELINE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><List size={16}/><span className="hidden sm:inline">Timeline</span></button>
                <button onClick={() => setViewMode('ARCHIVE')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors ${viewMode === 'ARCHIVE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><Archive size={16}/><span className="hidden sm:inline">Archivio</span></button>
             </div>
             
             {viewMode !== 'ARCHIVE' && (
                 <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                     <button onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${statusFilter === 'ACTIVE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}>
                         {statusFilter === 'ACTIVE' ? 'Solo Attivi' : 'Tutti'}
                     </button>
                 </div>
             )}

             <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                 <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-glr-800 border border-glr-700 rounded-lg pl-10 pr-4 py-1.5 text-white text-sm focus:border-glr-accent outline-none"/>
             </div>
             {canEdit && (
                <div className="flex gap-2">
                     <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center justify-center gap-2 bg-glr-800 border border-glr-700 text-gray-300 font-bold px-3 py-1.5 rounded-lg hover:bg-glr-700 transition-colors" title="Da Modello"><Copy size={18} /></button>
                     <button onClick={handleNewJob} className="flex items-center justify-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"><Plus size={18} /> <span className="hidden sm:inline">Nuova</span></button>
                </div>
             )}
        </div>
      </div>

        {/* --- TIMELINE VIEW --- */}
        {viewMode === 'TIMELINE' && (
            <div className="space-y-6 animate-fade-in">
                {timelineWeeks.length === 0 && <p className="text-center text-gray-500 py-10">Nessun lavoro trovato per questo periodo.</p>}
                {timelineWeeks.map((week, index) => (
                    <div key={index} className="bg-glr-900 border border-glr-700 rounded-xl overflow-hidden">
                        <div className="bg-glr-800 px-4 py-3 border-b border-glr-700 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <CalendarRange size={16} className="text-glr-accent"/>
                                {week.start.toLocaleDateString()} - {week.end.toLocaleDateString()}
                            </h3>
                            <span className="text-xs bg-glr-900 text-gray-400 px-2 py-1 rounded">{week.jobs.length} Lavori</span>
                        </div>
                        <div className="divide-y divide-glr-700/50">
                            {week.jobs.map(job => (
                                <div key={job.id} onClick={() => { setActiveJob(job); setIsEditing(true); }} className="p-4 hover:bg-glr-800/50 cursor-pointer transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: job.status === JobStatus.CONFIRMED ? '#22c55e' : job.status === JobStatus.DRAFT ? '#9ca3af' : '#3b82f6' }}></div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-glr-accent">{job.title}</h4>
                                            <p className="text-xs text-gray-400">{job.client}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-300">
                                        <span className="hidden sm:flex items-center gap-1 w-32"><Calendar size={14}/> {new Date(job.startDate).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}</span>
                                        <span className="hidden md:flex items-center gap-1 w-48 truncate"><MapPin size={14}/> {job.location || 'N/D'}</span>
                                        <span className="hidden lg:flex items-center gap-1"><Briefcase size={14}/> {job.assignedCrew.length}</span>
                                        <div className="w-24 text-right">{getStatusBadge(job.status)}</div>
                                        <ChevronRight size={16} className="text-gray-600"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}

       {viewMode === 'ARCHIVE' && (
           <div className="bg-glr-800 rounded-xl border border-glr-700 p-4">
               {Object.keys(archiveTree).sort((a,b) => b.localeCompare(a)).map(year => (
                   <div key={year} className="mb-2">
                       <button 
                            onClick={() => setExpandedYears(p => ({...p, [year]: !p[year]}))}
                            className="w-full flex items-center gap-2 p-3 bg-glr-900 rounded-lg hover:bg-glr-700 transition-colors text-left"
                       >
                           {expandedYears[year] ? <FolderOpen size={18} className="text-glr-accent"/> : <Folder size={18} className="text-gray-400"/>}
                           <span className="font-bold text-white">{year}</span>
                       </button>
                       
                       {expandedYears[year] && (
                           <div className="ml-4 pl-4 border-l border-glr-700 mt-2 space-y-2">
                               {Object.keys(archiveTree[year]).map(month => (
                                   <div key={month}>
                                       <button 
                                            onClick={() => setExpandedMonths(p => ({...p, [year+month]: !p[year+month]}))}
                                            className="w-full flex items-center gap-2 p-2 hover:text-white text-gray-400 text-sm"
                                       >
                                           {expandedMonths[year+month] ? <FolderOpen size={14}/> : <Folder size={14}/>}
                                           <span>{month}</span>
                                           <span className="text-[10px] bg-glr-900 px-1.5 rounded">{archiveTree[year][month].length}</span>
                                       </button>
                                       {expandedMonths[year+month] && (
                                           <div className="ml-6 grid gap-2 mt-1">
                                               {archiveTree[year][month].map(job => (
                                                   <div key={job.id} onClick={() => { setActiveJob(job); setIsEditing(true); }} className="flex items-center gap-2 text-xs text-gray-300 hover:text-glr-accent cursor-pointer p-1">
                                                       <FilePlus size={12}/> {job.title}
                                                   </div>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               ))}
           </div>
       )}
    </div>
  );
};