
import React, { useState, useMemo } from 'react';
import { Job, JobStatus, CrewMember, ApprovalStatus, CrewExpense, WorkflowLog, CrewType, VehicleType } from '../types';
import { calculateMissedRestDaysHelper } from '../services/helpers';
import { ChevronLeft, ChevronRight, Briefcase, AlertCircle, Truck, Users, AlertTriangle, Calendar as CalIcon, Clock, Wallet, Plus, X, FileText, CheckCircle, Download, ArrowRight, ArrowLeft, Wrench, Package } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  crew: CrewMember[]; 
  currentUser?: { id: string; role: 'ADMIN' | 'MANAGER' | 'TECH' };
  onUpdateCrew?: (member: CrewMember) => void;
}

// Mock Fleet Limits for Conflict Detection
const FLEET_LIMITS: Record<string, number> = {
    [VehicleType.DUCATO]: 2,
    [VehicleType.DAILY_35]: 1,
    [VehicleType.EUROCARGO_75]: 1,
    [VehicleType.MOTRICE]: 0 // Always external
};

export const Dashboard: React.FC<DashboardProps> = ({ jobs, crew = [], currentUser, onUpdateCrew }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Weekly Navigation State
  const [weekOffset, setWeekOffset] = useState(0);

  // TECH DASHBOARD STATE
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpJobId, setNewExpJobId] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Viaggio');

  // --- DATA PREP ---
  const myCrewProfile = crew.find(c => c.id === currentUser?.id);
  
  // Jobs Assigned to Me (for Tech)
  const myJobs = useMemo(() => {
      if (!currentUser) return [];
      return jobs.filter(j => 
        j.assignedCrew.includes(currentUser.id) && 
        j.status !== JobStatus.CANCELLED
      ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs, currentUser]);

  // --- HANDLERS FOR TECH ---
  const handleCreateExpense = () => {
      if (!myCrewProfile || !onUpdateCrew) return;

      const job = jobs.find(j => j.id === newExpJobId);
      
      const newExpense: CrewExpense = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          jobId: newExpJobId,
          jobTitle: job?.title,
          amount: parseFloat(newExpAmount),
          description: newExpDesc,
          category: newExpCategory as any,
          status: ApprovalStatus.PENDING,
          workflowLog: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: myCrewProfile.name,
              action: 'Richiesta inserita da Dashboard'
          }]
      };

      const updatedMember = {
          ...myCrewProfile,
          expenses: [...(myCrewProfile.expenses || []), newExpense]
      };

      onUpdateCrew(updatedMember);
      setIsExpenseModalOpen(false);
      setNewExpAmount('');
      setNewExpDesc('');
      setNewExpJobId('');
  };

  // --- ADMIN LOGIC HELPERS ---
  const getStartOfWeek = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + (offset * 7));
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      d.setDate(diff);
      d.setHours(0,0,0,0);
      return d;
  };

  const startOfCurrentWeek = useMemo(() => getStartOfWeek(weekOffset), [weekOffset]);
  
  const weekDays = useMemo(() => Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfCurrentWeek);
      d.setDate(d.getDate() + i);
      return d;
  }), [startOfCurrentWeek]);

  // --- RENDER TECH DASHBOARD ---
  if (currentUser?.role === 'TECH') {
      // ... (Existing Tech Dashboard Logic kept intact for brevity, same as previous version)
      const pendingTotal = (myCrewProfile?.expenses || []).filter(e => e.status === ApprovalStatus.PENDING).reduce((acc, e) => acc + e.amount, 0);
      const approvedTotal = (myCrewProfile?.expenses || []).filter(e => e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED).reduce((acc, e) => acc + e.amount, 0);
      const myWorkload = calculateMissedRestDaysHelper(jobs, currentUser.id, new Date().getFullYear(), new Date().getMonth(), myCrewProfile?.tasks || [], myCrewProfile?.absences || []);

      return (
          <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-y-auto pb-10">
              <div className="flex items-center gap-4 mb-2">
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 flex items-center justify-center text-3xl font-bold text-glr-accent border border-glr-600 shadow-lg">
                        {myCrewProfile?.name.charAt(0)}
                   </div>
                   <div>
                       <h2 className="text-2xl font-bold text-white">Ciao, {myCrewProfile?.name}</h2>
                       <p className="text-gray-400">Bentornato nel tuo HUB personale.</p>
                   </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-start gap-4 ${myWorkload.missedRest > 0 ? 'bg-orange-900/20 border-orange-800' : 'bg-green-900/20 border-green-800'}`}>
                  {myWorkload.missedRest > 0 ? <AlertTriangle size={24} className="text-orange-500 mt-1"/> : <CheckCircle size={24} className="text-green-500 mt-1"/>}
                  <div>
                      <h4 className={`font-bold ${myWorkload.missedRest > 0 ? 'text-orange-400' : 'text-green-400'}`}>Stato Riposi</h4>
                      <p className="text-gray-300 text-sm mt-1">
                          Hai lavorato <b>{myWorkload.totalWorked}</b> giorni questo mese.
                          {myWorkload.missedRest > 0 
                            ? ` ⚠ Attenzione: Hai accumulato ${myWorkload.missedRest} giorni di mancato riposo da recuperare.` 
                            : ' ✅ Sei in linea con i riposi (5+2).'}
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-glr-800 border border-glr-700 rounded-xl p-5 shadow-lg">
                          <h3 className="text-glr-accent font-bold uppercase text-sm mb-4 flex items-center gap-2"><Briefcase size={16}/> I Miei Prossimi Lavori</h3>
                          <div className="space-y-3">
                              {myJobs.length === 0 && <p className="text-gray-500 italic">Nessun lavoro in programma.</p>}
                              {myJobs.map(job => (
                                  <div key={job.id} className="bg-glr-900/50 border border-glr-700 p-4 rounded-lg flex justify-between items-center">
                                      <div>
                                          <h4 className="font-bold text-white text-lg">{job.title}</h4>
                                          <div className="text-sm text-gray-400 flex gap-2 mt-1">
                                              <span>{new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</span>
                                              <span>• {job.location}</span>
                                          </div>
                                      </div>
                                      <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${job.status === JobStatus.CONFIRMED ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>{job.status}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  {/* EXPENSES SECTION */}
                  <div className="bg-glr-800 border border-glr-700 rounded-xl p-5 shadow-lg flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-glr-accent font-bold uppercase text-sm flex items-center gap-2"><Wallet size={16}/> Le Mie Spese</h3>
                           <button onClick={() => setIsExpenseModalOpen(true)} className="bg-glr-accent text-glr-900 p-1.5 rounded hover:bg-amber-400 transition-colors"><Plus size={18}/></button>
                       </div>
                       <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="bg-glr-900 p-3 rounded border border-glr-700">
                               <p className="text-xs text-gray-500 uppercase">In Attesa</p>
                               <p className="text-xl font-bold text-yellow-500">€ {pendingTotal.toFixed(2)}</p>
                           </div>
                           <div className="bg-glr-900 p-3 rounded border border-glr-700">
                               <p className="text-xs text-gray-500 uppercase">Approvati</p>
                               <p className="text-xl font-bold text-green-500">€ {approvedTotal.toFixed(2)}</p>
                           </div>
                       </div>
                       <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[400px]">
                           {(myCrewProfile?.expenses || []).length === 0 && <p className="text-gray-500 italic text-sm text-center">Nessuna spesa recente.</p>}
                           {[...(myCrewProfile?.expenses || [])].reverse().map(exp => (
                               <div key={exp.id} className="border-b border-glr-700 pb-3 last:border-0">
                                   <div className="flex justify-between items-start mb-1">
                                       <span className="font-bold text-white text-sm">{exp.description}</span>
                                       <span className="font-mono text-white font-bold">€ {exp.amount}</span>
                                   </div>
                                   <div className="flex justify-between items-center text-xs">
                                       <span className="text-gray-400">{new Date(exp.date).toLocaleDateString()}</span>
                                       <span className={`px-1.5 py-0.5 rounded border uppercase text-[10px] ${exp.status === ApprovalStatus.PENDING ? 'text-yellow-400 border-yellow-800' : 'text-green-400 border-green-800'}`}>{exp.status}</span>
                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>

              {/* MODAL NUOVA SPESA */}
              {isExpenseModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                      <div className="bg-glr-800 rounded-xl border border-glr-600 p-6 w-full max-w-md shadow-2xl animate-fade-in">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-bold text-white">Nuova Richiesta Rimborso</h3>
                              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs text-gray-400 mb-1">Lavoro di Riferimento</label>
                                  <select value={newExpJobId} onChange={e => setNewExpJobId(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                      <option value="">-- Seleziona Lavoro --</option>
                                      {myJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                  </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs text-gray-400 mb-1">Importo (€)</label>
                                      <input type="number" step="0.01" value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/>
                                  </div>
                                  <div>
                                      <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                                      <select value={newExpCategory} onChange={e => setNewExpCategory(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                          <option>Viaggio</option>
                                          <option>Pasto</option>
                                          <option>Alloggio</option>
                                          <option>Materiale</option>
                                          <option>Altro</option>
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs text-gray-400 mb-1">Descrizione</label>
                                  <input type="text" value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Benzina Milano"/>
                              </div>
                              <div className="pt-2">
                                  <button onClick={handleCreateExpense} disabled={!newExpAmount || !newExpDesc || !newExpJobId} className="w-full bg-glr-accent text-glr-900 font-bold py-2 rounded hover:bg-amber-400 disabled:opacity-50 transition-colors">Invia Richiesta</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- ADMIN / MANAGER DASHBOARD ---

  // 1. Task & Priorities Logic
  const priorityTasks = useMemo(() => {
      const alerts: { id: string, type: 'CRITICAL' | 'WARNING' | 'INFO', msg: string, sub: string, job: Job }[] = [];
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(); 
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      jobs.forEach(j => {
          if (j.status === JobStatus.CANCELLED || j.status === JobStatus.COMPLETED) return;

          // Critical: Confirmed but missing resources
          if (j.status === JobStatus.CONFIRMED) {
              if (j.assignedCrew.length === 0) {
                  alerts.push({ id: `crew-${j.id}`, type: 'CRITICAL', msg: 'Crew Non Assegnata', sub: `Evento: ${j.startDate}`, job: j });
              }
              if (j.materialList.length === 0) {
                  alerts.push({ id: `kit-${j.id}`, type: 'CRITICAL', msg: 'Lista Materiale Vuota', sub: 'Nessun articolo in scheda', job: j });
              }
              if (j.vehicles.length === 0 && !j.isAwayJob) {
                  alerts.push({ id: `veh-${j.id}`, type: 'WARNING', msg: 'Nessun Mezzo Assegnato', sub: 'Verifica logistica', job: j });
              }
          }

          // Warning: Draft expiring soon
          if (j.status === JobStatus.DRAFT && j.startDate <= nextWeekStr && j.startDate >= today) {
              alerts.push({ id: `draft-${j.id}`, type: 'INFO', msg: 'Opzione in Scadenza', sub: 'Confermare o Annullare', job: j });
          }
      });

      return alerts.sort((a,b) => {
          if (a.type === 'CRITICAL' && b.type !== 'CRITICAL') return -1;
          if (a.type !== 'CRITICAL' && b.type === 'CRITICAL') return 1;
          return new Date(a.job.startDate).getTime() - new Date(b.job.startDate).getTime();
      });
  }, [jobs]);

  // 2. Weekly Agenda Data
  const weeklyJobs = useMemo(() => {
      const weekStartStr = weekDays[0].toISOString().split('T')[0];
      const weekEndStr = weekDays[6].toISOString().split('T')[0];
      
      const jobsInWeek: Record<string, Job[]> = {};
      weekDays.forEach(d => jobsInWeek[d.toISOString().split('T')[0]] = []);

      jobs.filter(j => j.status !== JobStatus.CANCELLED).forEach(j => {
          if (j.endDate < weekStartStr || j.startDate > weekEndStr) return;
          
          // Add to days where it is active
          weekDays.forEach(d => {
              const dStr = d.toISOString().split('T')[0];
              if (dStr >= j.startDate && dStr <= j.endDate) {
                  jobsInWeek[dStr].push(j);
              }
          });
      });
      return jobsInWeek;
  }, [jobs, weekDays]);

  // 3. Crew Load Data
  const crewLoad = useMemo(() => {
      const internalCrew = crew.filter(c => c.type === CrewType.INTERNAL);
      const stats: Record<string, { available: number, working: number, rest: number }> = {};

      weekDays.forEach(d => {
          const dStr = d.toISOString().split('T')[0];
          let working = 0;
          let rest = 0;

          internalCrew.forEach(c => {
              // Check Rest (Weekend default or override?) - Simple Weekend Logic for Dash
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const isOnJob = jobs.some(j => j.status !== JobStatus.CANCELLED && j.assignedCrew.includes(c.id) && dStr >= j.startDate && dStr <= j.endDate);
              const hasTask = c.tasks?.some(t => t.date === dStr);
              
              if (isOnJob || hasTask) working++;
              else if (isWeekend) rest++;
          });

          stats[dStr] = {
              available: internalCrew.length - working - rest,
              working,
              rest
          };
      });
      return stats;
  }, [crew, jobs, weekDays]);

  // 4. Vehicle Fleet Status
  const vehicleStatus = useMemo(() => {
      const stats: Record<string, Record<string, number>> = {};
      
      weekDays.forEach(d => {
          const dStr = d.toISOString().split('T')[0];
          stats[dStr] = {};
          
          jobs.forEach(j => {
              if (j.status === JobStatus.CANCELLED) return;
              if (dStr >= j.startDate && dStr <= j.endDate) {
                  j.vehicles.forEach(v => {
                      // Sum quantity for this vehicle type on this day
                      stats[dStr][v.type] = (stats[dStr][v.type] || 0) + v.quantity;
                  });
              }
          });
      });
      return stats;
  }, [jobs, weekDays]);

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-y-auto pb-8">
       
       {/* 1. TASK & PRIORITIES WIDGET */}
       <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg shrink-0">
           <h3 className="text-white font-bold flex items-center gap-2 mb-4">
               <AlertCircle className="text-glr-accent"/> Task & Priorità
               <span className="text-xs font-normal text-gray-400 bg-glr-900 px-2 py-0.5 rounded-full">{priorityTasks.length} avvisi</span>
           </h3>
           
           {priorityTasks.length === 0 ? (
               <div className="flex items-center gap-3 text-green-400 p-4 bg-green-900/10 border border-green-900/30 rounded-lg">
                   <CheckCircle size={20}/>
                   <p className="text-sm font-bold">Tutto in ordine! Nessuna criticità rilevata.</p>
               </div>
           ) : (
               <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-glr-700">
                   {priorityTasks.map(alert => (
                       <div key={alert.id} className={`min-w-[280px] p-3 rounded-lg border flex items-start gap-3 relative group transition-transform hover:scale-[1.02] 
                            ${alert.type === 'CRITICAL' ? 'bg-red-900/20 border-red-800' : alert.type === 'WARNING' ? 'bg-orange-900/20 border-orange-800' : 'bg-blue-900/20 border-blue-800'}`}>
                           <div className={`mt-1 ${alert.type === 'CRITICAL' ? 'text-red-500' : alert.type === 'WARNING' ? 'text-orange-500' : 'text-blue-500'}`}>
                               {alert.type === 'CRITICAL' ? <AlertCircle size={20}/> : <AlertTriangle size={20}/>}
                           </div>
                           <div>
                               <h4 className={`font-bold text-sm ${alert.type === 'CRITICAL' ? 'text-red-300' : alert.type === 'WARNING' ? 'text-orange-300' : 'text-blue-300'}`}>{alert.msg}</h4>
                               <p className="text-white text-xs font-bold mt-1 truncate max-w-[180px]" title={alert.job.title}>{alert.job.title}</p>
                               <p className="text-gray-400 text-[10px]">{alert.sub}</p>
                           </div>
                           {/* Quick Action Button (Mock) */}
                           <button className="absolute bottom-2 right-2 p-1.5 bg-glr-900 rounded-full hover:bg-glr-700 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                               <ArrowRight size={14}/>
                           </button>
                       </div>
                   ))}
               </div>
           )}
       </div>

       {/* MAIN CONTENT GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1">
           
           {/* LEFT COL: WEEKLY AGENDA (3/5) */}
           <div className="lg:col-span-3 bg-glr-800 border border-glr-700 rounded-xl flex flex-col overflow-hidden shadow-lg h-[600px]">
               <div className="p-4 border-b border-glr-700 bg-glr-900/50 flex justify-between items-center shrink-0">
                   <h3 className="text-white font-bold flex items-center gap-2"><CalIcon size={18} className="text-glr-accent"/> Agenda Settimanale</h3>
                   <div className="flex items-center gap-2 bg-glr-900 rounded-lg p-1 border border-glr-700">
                       <button onClick={() => setWeekOffset(p => p - 1)} className="p-1 hover:bg-glr-700 rounded text-gray-400"><ChevronLeft size={18}/></button>
                       <span className="text-xs font-bold text-gray-300 w-32 text-center">
                           {weekDays[0].getDate()} {weekDays[0].toLocaleDateString('it-IT',{month:'short'})} - {weekDays[6].getDate()} {weekDays[6].toLocaleDateString('it-IT',{month:'short'})}
                       </span>
                       <button onClick={() => setWeekOffset(p => p + 1)} className="p-1 hover:bg-glr-700 rounded text-gray-400"><ChevronRight size={18}/></button>
                       <button onClick={() => setWeekOffset(0)} className="text-[10px] bg-glr-800 px-2 py-1 rounded ml-1 hover:text-white text-gray-500">Oggi</button>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {weekDays.map(day => {
                       const dateStr = day.toISOString().split('T')[0];
                       const dayJobs = weeklyJobs[dateStr];
                       const isToday = new Date().toDateString() === day.toDateString();

                       return (
                           <div key={dateStr} className={`flex gap-4 ${isToday ? 'bg-glr-900/30 -mx-2 px-2 rounded-lg py-2 border border-glr-700/50' : ''}`}>
                               {/* Date Column */}
                               <div className="flex flex-col items-center w-14 shrink-0 pt-1">
                                   <span className={`text-xs uppercase font-bold ${isToday ? 'text-glr-accent' : 'text-gray-500'}`}>{day.toLocaleDateString('it-IT', {weekday: 'short'})}</span>
                                   <span className={`text-xl font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>{day.getDate()}</span>
                               </div>
                               
                               {/* Jobs List */}
                               <div className="flex-1 space-y-2 border-l-2 border-glr-700 pl-4 py-1">
                                   {dayJobs.length === 0 && <p className="text-xs text-gray-600 italic">Nessun evento</p>}
                                   {dayJobs.map(job => (
                                       <div key={job.id} className="bg-glr-900 border border-glr-700 p-3 rounded-lg flex justify-between items-center group hover:border-glr-500 transition-colors">
                                           <div>
                                               <h4 className="text-sm font-bold text-white group-hover:text-glr-accent">{job.title}</h4>
                                               <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                   <span className="flex items-center gap-1"><Truck size={12}/> {job.location}</span>
                                                   <span className="flex items-center gap-1"><Users size={12}/> {job.assignedCrew.length} Crew</span>
                                               </div>
                                           </div>
                                           <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold border 
                                                ${job.status === JobStatus.CONFIRMED ? 'bg-green-900/20 text-green-400 border-green-800' : 
                                                  job.status === JobStatus.IN_PROGRESS ? 'bg-blue-900/20 text-blue-400 border-blue-800' :
                                                  'bg-gray-800 text-gray-400 border-gray-600'}`}>
                                               {job.status === JobStatus.IN_PROGRESS ? 'In Corso' : job.status}
                                           </span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )
                   })}
               </div>
           </div>

           {/* RIGHT COL: CREW & FLEET (2/5) */}
           <div className="lg:col-span-2 space-y-6">
               
               {/* 1. CREW LOAD MATRIX */}
               <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg">
                   <h3 className="text-white font-bold flex items-center gap-2 mb-4 text-sm uppercase text-gray-400"><Users size={16} className="text-blue-400"/> Impegno Tecnici Interni</h3>
                   
                   <div className="space-y-2">
                       {weekDays.map(day => {
                           const dateStr = day.toISOString().split('T')[0];
                           const stats = crewLoad[dateStr];
                           const isToday = new Date().toDateString() === day.toDateString();

                           return (
                               <div key={dateStr} className={`flex items-center gap-3 text-xs ${isToday ? 'bg-glr-900/50 p-1.5 rounded border border-glr-700' : 'p-1'}`}>
                                   <div className={`w-8 font-bold uppercase ${isToday ? 'text-glr-accent' : 'text-gray-500'}`}>{day.toLocaleDateString('it-IT', {weekday:'short'})}</div>
                                   <div className="flex-1 flex h-2 bg-glr-900 rounded-full overflow-hidden">
                                       <div style={{width: `${(stats.working / (stats.working+stats.available+stats.rest)) * 100}%`}} className="bg-blue-500 h-full" title={`In Lavoro: ${stats.working}`}></div>
                                       <div style={{width: `${(stats.available / (stats.working+stats.available+stats.rest)) * 100}%`}} className="bg-glr-700 h-full" title={`In Sede: ${stats.available}`}></div>
                                       <div style={{width: `${(stats.rest / (stats.working+stats.available+stats.rest)) * 100}%`}} className="bg-gray-600 h-full" title={`Riposo: ${stats.rest}`}></div>
                                   </div>
                                   <div className="w-12 text-right font-mono text-gray-400">
                                       <span className="text-blue-400 font-bold">{stats.working}</span>/{stats.working+stats.available+stats.rest}
                                   </div>
                               </div>
                           )
                       })}
                   </div>
                   <div className="flex justify-between mt-3 text-[10px] text-gray-500 px-2">
                       <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Su Lavoro</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 bg-glr-700 rounded-full"></span> In Sede</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-600 rounded-full"></span> Riposo</span>
                   </div>
               </div>

               {/* 2. FLEET STATUS & CONFLICTS */}
               <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg flex-1">
                   <h3 className="text-white font-bold flex items-center gap-2 mb-4 text-sm uppercase text-gray-400"><Wrench size={16} className="text-orange-400"/> Stato Flotta & Mezzi</h3>
                   
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                       {weekDays.map(day => {
                           const dateStr = day.toISOString().split('T')[0];
                           const usage = vehicleStatus[dateStr] || {};
                           const hasUsage = Object.keys(usage).length > 0;
                           if (!hasUsage) return null; // Skip empty days to save space

                           return (
                               <div key={dateStr} className="border-l-2 border-glr-700 pl-3 pb-1">
                                   <p className="text-xs text-gray-500 font-bold mb-1">{day.toLocaleDateString('it-IT', {weekday: 'long', day:'numeric'})}</p>
                                   <div className="flex flex-wrap gap-2">
                                       {Object.entries(usage).map(([type, count]) => {
                                           const limit = FLEET_LIMITS[type] || 99;
                                           const isConflict = count > limit;
                                           
                                           return (
                                               <div key={type} className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 font-bold 
                                                    ${isConflict ? 'bg-red-900/30 text-red-300 border-red-800 animate-pulse' : 'bg-glr-900 text-gray-300 border-glr-600'}`}>
                                                   {isConflict ? <AlertTriangle size={10}/> : <Truck size={10}/>}
                                                   {type}: {count} {isConflict && `(Max ${limit})`}
                                               </div>
                                           )
                                       })}
                                   </div>
                               </div>
                           )
                       })}
                       {Object.keys(vehicleStatus).every(k => Object.keys(vehicleStatus[k]).length === 0) && (
                           <p className="text-center text-gray-500 text-xs py-4">Nessun mezzo impegnato questa settimana.</p>
                       )}
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};
