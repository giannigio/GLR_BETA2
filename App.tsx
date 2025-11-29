


import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Jobs } from './components/Jobs';
import { Crew } from './components/Crew';
import { Locations } from './components/Locations';
import { Inventory } from './components/Inventory'; 
import { ExpensesDashboard } from './components/ExpensesDashboard';
import { Settings } from './components/Settings';
import { StandardLists } from './components/StandardLists';
import { CompanyManagement } from './components/CompanyManagement';
import { Login } from './components/Login';
import { Job, CrewMember, Location, InventoryItem, Notification, SystemRole, AppSettings, StandardMaterialList } from './types';
import { api } from './services/api'; 
import { LayoutDashboard, ClipboardList, Users, Settings as SettingsIcon, LogOut, Menu, X, Loader2, MapPin, Package, Bell, Info, AlertTriangle, CheckCircle, FileText, Boxes, Building2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'JOBS' | 'CREW' | 'LOCATIONS' | 'INVENTORY' | 'STD_LISTS' | 'EXPENSES' | 'SETTINGS' | 'COMPANY'>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [standardLists, setStandardLists] = useState<StandardMaterialList[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication State - DEMO MODE: Default to ADMIN
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string; role: SystemRole } | null>({
      id: 'demo-admin-id',
      name: 'Admin Demo',
      role: 'ADMIN'
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        const [fetchedJobs, fetchedCrew, fetchedLocations, fetchedInventory, fetchedStdLists, fetchedNotifs, fetchedSettings] = await Promise.all([
          api.getJobs(),
          api.getCrew(),
          api.getLocations(),
          api.getInventory(),
          api.getStandardLists(),
          api.getNotifications(),
          api.getSettings()
        ]);
        setJobs(fetchedJobs);
        setCrew(fetchedCrew);
        setLocations(fetchedLocations);
        setInventory(fetchedInventory);
        setStandardLists(fetchedStdLists);
        setNotifications(fetchedNotifs);
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    loadData();
  }, [currentUser]);

  const handleLogout = () => {
      if (confirm("Sei in modalità Demo. Vuoi uscire?")) {
          setCurrentUser(null);
      }
  };

  // CRUD Handlers
  const handleAddJob = async (job: Job) => {
    const savedJob = await api.createJob(job);
    setJobs(prev => [...prev, savedJob]);
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    await api.updateJob(updatedJob);
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const handleDeleteJob = async (id: string) => {
    await api.deleteJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleAddLocation = async (loc: Location) => {
      const savedLoc = await api.createLocation(loc);
      setLocations(prev => [...prev, savedLoc]);
  };

  const handleUpdateLocation = async (loc: Location) => {
      await api.updateLocation(loc);
      setLocations(prev => prev.map(l => l.id === loc.id ? loc : l));
  };

  const handleDeleteLocation = async (id: string) => {
      await api.deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
  };

  const handleAddInventory = async (item: InventoryItem) => {
      const savedItem = await api.createInventoryItem(item);
      setInventory(prev => [...prev, savedItem]);
  };

  const handleUpdateInventory = async (item: InventoryItem) => {
      await api.updateInventoryItem(item);
      setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteInventory = async (id: string) => {
      await api.deleteInventoryItem(id);
      setInventory(prev => prev.filter(i => i.id !== id));
  };

  const handleAddStdList = async (list: StandardMaterialList) => {
      const saved = await api.createStandardList(list);
      setStandardLists(prev => [...prev, saved]);
  };

  const handleUpdateStdList = async (list: StandardMaterialList) => {
      await api.updateStandardList(list);
      setStandardLists(prev => prev.map(l => l.id === list.id ? list : l));
  };

  const handleDeleteStdList = async (id: string) => {
      await api.deleteStandardList(id);
      setStandardLists(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateCrew = async (member: CrewMember) => {
      const updated = await api.updateCrewMember(member);
      setCrew(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
  };

  // Permissions Check
  const canAccess = (section: 'CREW' | 'INVENTORY' | 'LOCATIONS' | 'SETTINGS' | 'COMPANY') => {
      if (!currentUser || !settings?.permissions) return false;
      if (currentUser.role === 'ADMIN') return true;
      
      const role = currentUser.role as 'MANAGER' | 'TECH';
      const perms = settings.permissions[role];

      if (section === 'CREW') return perms.canManageCrew;
      if (section === 'INVENTORY') return perms.canManageInventory;
      if (section === 'LOCATIONS') return perms.canManageLocations;
      if (section === 'SETTINGS' || section === 'COMPANY') return false; // Only Admin
      
      return true; // Default visible
  };

  const NavItem = ({ id, icon: Icon, label, visible = true }: { id: typeof activeTab, icon: any, label: string, visible?: boolean }) => {
    if (!visible) return null;
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
          activeTab === id 
          ? 'bg-glr-accent text-glr-900 font-bold shadow-lg shadow-amber-500/20' 
          : 'text-gray-400 hover:bg-glr-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  if (isLoading) {
      return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>
  }

  if (!currentUser) {
      return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-glr-900 text-gray-100 overflow-hidden font-sans">
      <aside className="hidden md:flex flex-col w-64 bg-glr-900 border-r border-glr-800 p-4 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          {settings?.logoUrl ? (
               <img src={settings.logoUrl} className="w-10 h-10 object-contain brightness-0 invert" alt="GLR" />
          ) : (
            <div className="w-10 h-10 bg-glr-accent rounded-lg flex items-center justify-center font-bold text-xl text-glr-900 shadow-lg shadow-amber-500/20">
                GLR
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight">HUB</h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="JOBS" icon={ClipboardList} label="Schede Lavoro" />
          <NavItem id="COMPANY" icon={Building2} label="Gestione Azienda" visible={canAccess('COMPANY')} />
          <NavItem id="INVENTORY" icon={Package} label="Magazzino" visible={canAccess('INVENTORY')} />
          <NavItem id="STD_LISTS" icon={Boxes} label="Kit & Liste" visible={canAccess('INVENTORY')} />
          <NavItem id="LOCATIONS" icon={MapPin} label="Locations" visible={canAccess('LOCATIONS')} />
          <NavItem id="CREW" icon={Users} label="Crew & Tecnici" visible={canAccess('CREW')} />
          <NavItem id="EXPENSES" icon={FileText} label="Rimborsi" visible={currentUser.role === 'ADMIN'} />
        </nav>

        <div className="border-t border-glr-800 pt-4 mt-auto space-y-2">
          <NavItem id="SETTINGS" icon={SettingsIcon} label="Impostazioni" visible={currentUser.role === 'ADMIN'} />
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-400 hover:bg-glr-800 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">{currentUser.name.charAt(0)}</div>
            <div className="flex-1 text-left"><p className="text-sm font-medium text-white">{currentUser.name}</p><p className="text-xs text-gray-500">{currentUser.role}</p></div>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-glr-900 border-b border-glr-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
             <div className="md:hidden flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">{isMobileMenuOpen ? <X /> : <Menu />}</button>
                <span className="font-bold text-lg">GLR HUB</span>
             </div>
             <div className="hidden md:block"></div>
             <div className="flex items-center gap-4 relative">
                 <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative text-gray-400 hover:text-white transition-colors">
                     <Bell size={22} />
                     {notifications.some(n => !n.read) && (<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-glr-900"></span>)}
                 </button>
                 {isNotifOpen && (
                     <div className="absolute top-10 right-0 w-80 bg-glr-800 border border-glr-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                         <div className="p-3 border-b border-glr-700 flex justify-between items-center bg-glr-900"><h4 className="font-bold text-sm text-white">Notifiche</h4><button className="text-xs text-glr-accent hover:underline">Segna lette</button></div>
                         <div className="max-h-80 overflow-y-auto">
                             {notifications.map(n => (
                                 <div key={n.id} className={`p-3 border-b border-glr-700/50 hover:bg-glr-700 transition-colors cursor-pointer ${!n.read ? 'bg-glr-700/20' : ''}`} onClick={() => { if (n.linkTo) setActiveTab(n.linkTo as any); setIsNotifOpen(false); }}>
                                     <div className="flex gap-3">
                                         <div className={`mt-1 ${n.type === 'WARNING' ? 'text-amber-500' : n.type === 'SUCCESS' ? 'text-green-500' : n.type === 'ERROR' ? 'text-red-500' : 'text-blue-500'}`}>{n.type === 'WARNING' ? <AlertTriangle size={16}/> : n.type === 'SUCCESS' ? <CheckCircle size={16}/> : <Info size={16}/>}</div>
                                         <div><p className="text-sm font-semibold text-gray-200">{n.title}</p><p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</p></div>
                                     </div>
                                 </div>
                             ))}
                             {notifications.length === 0 && (<div className="p-6 text-center text-gray-500 text-sm">Nessuna notifica.</div>)}
                         </div>
                     </div>
                 )}
             </div>
        </header>

        {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 top-16 bg-glr-900 z-40 p-4 space-y-2">
            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="JOBS" icon={ClipboardList} label="Schede Lavoro" />
            <NavItem id="COMPANY" icon={Building2} label="Gestione Azienda" visible={canAccess('COMPANY')} />
            <NavItem id="INVENTORY" icon={Package} label="Magazzino" visible={canAccess('INVENTORY')} />
            <NavItem id="STD_LISTS" icon={Boxes} label="Kit & Liste" visible={canAccess('INVENTORY')} />
            <NavItem id="LOCATIONS" icon={MapPin} label="Locations" visible={canAccess('LOCATIONS')} />
            <NavItem id="CREW" icon={Users} label="Crew & Tecnici" visible={canAccess('CREW')} />
            <NavItem id="SETTINGS" icon={SettingsIcon} label="Impostazioni" visible={currentUser.role === 'ADMIN'} />
            </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#0b1120]">
            <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'DASHBOARD' && <Dashboard jobs={jobs} crew={crew} currentUser={currentUser} onUpdateCrew={handleUpdateCrew} />}
            {activeTab === 'JOBS' && <Jobs jobs={jobs} crew={crew} locations={locations} inventory={inventory} standardLists={standardLists} onAddJob={handleAddJob} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} currentUser={currentUser} settings={settings} />}
            {activeTab === 'COMPANY' && canAccess('COMPANY') && <CompanyManagement jobs={jobs} crew={crew} settings={settings} />}
            {activeTab === 'INVENTORY' && canAccess('INVENTORY') && <Inventory inventory={inventory} onAddItem={handleAddInventory} onUpdateItem={handleUpdateInventory} onDeleteItem={handleDeleteInventory} />}
            {activeTab === 'STD_LISTS' && canAccess('INVENTORY') && <StandardLists lists={standardLists} inventory={inventory} onAddList={handleAddStdList} onUpdateList={handleUpdateStdList} onDeleteList={handleDeleteStdList} />}
            {activeTab === 'LOCATIONS' && canAccess('LOCATIONS') && <Locations locations={locations} onAddLocation={handleAddLocation} onUpdateLocation={handleUpdateLocation} onDeleteLocation={handleDeleteLocation} currentUser={currentUser} />}
            {activeTab === 'CREW' && canAccess('CREW') && <Crew crew={crew} onUpdateCrew={handleUpdateCrew} jobs={jobs} settings={settings} />}
            {activeTab === 'EXPENSES' && currentUser.role === 'ADMIN' && <ExpensesDashboard crew={crew} jobs={jobs} />}
            {activeTab === 'SETTINGS' && settings && currentUser.role === 'ADMIN' && <Settings settings={settings} onUpdateSettings={handleUpdateSettings} />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;