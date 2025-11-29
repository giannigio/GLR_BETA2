
import React, { useState, useMemo } from 'react';
import { Job, JobStatus, CrewMember, ApprovalStatus, CrewExpense, WorkflowLog, CrewType } from '../types';
import { calculateMissedRestDaysHelper } from '../services/helpers';
import { ChevronLeft, ChevronRight, Briefcase, AlertCircle, Truck, Users, AlertTriangle, Calendar as CalIcon, Clock, Wallet, Plus, X, FileText, CheckCircle, Download } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  crew: CrewMember[]; 
  currentUser?: { id: string; role: 'ADMIN' | 'MANAGER' | 'TECH' };
  onUpdateCrew?: (member: CrewMember) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, crew = [], currentUser, onUpdateCrew }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun
  
  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // Calendar Grid Data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: adjustedStartDay }, (_, i) => i);
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

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

  // --- RENDER TECH DASHBOARD ---
  if (currentUser?.role === 'TECH') {
      const pendingTotal = (myCrewProfile?.expenses || []).filter(e => e.status === ApprovalStatus.PENDING).reduce((acc, e) => acc + e.amount, 0);
      const approvedTotal = (myCrewProfile?.expenses || []).filter(e => e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED).reduce((acc, e) => acc + e.amount, 0);

      // Workload 5+2 Calculation
      const myWorkload = calculateMissedRestDaysHelper(
          jobs, 
          currentUser.id, 
          new Date().getFullYear(), 
          new Date().getMonth(),
          myCrewProfile?.tasks || [],
          myCrewProfile?.absences || []
      );

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

              {/* ALERT 5+2 */}
              <div className={`p-4 rounded-xl border flex items-start gap-4 ${myWorkload.missedRest > 0 ? 'bg-orange-900/20 border-orange-800' : 'bg-green-900/20 border-green-800'}`}>
                  {myWorkload.missedRest > 0 ? <AlertTriangle size={24} className="text-orange-500 mt-1"/> : <CheckCircle size={24} className="text-green-500 mt-1"/>}
                  <div>
                      <h4 className={`font-bold ${myWorkload.missedRest > 0 ? 'text-orange-400' : 'text-green-400'}`}>Stato Riposi</h4>
                      <p className="text-gray-300 text-sm mt-1">
                          Hai lavorato <b>{myWorkload.totalWorked}</b> giorni questo mese.
                          {myWorkload.missedRest > 0 
                            ? ` ⚠ Attenzione: Hai accumulato ${myWorkload.missedRest} giorni di mancato riposo da recuperare o farti pagare.` 
                            : ' ✅ Sei in linea con i riposi settimanali (5+2).'}
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT COL: MY JOBS */}
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-glr-800 border border-glr-700 rounded-xl p-5 shadow-lg">
                          <h3 className="text-glr-accent font-bold uppercase text-sm mb-4 flex items-center gap-2">
                              <Briefcase size={16}/> I Miei Prossimi Lavori
                          </h3>
                          <div className="space-y-3">
                              {myJobs.length === 0 && <p className="text-gray-500 italic">Nessun lavoro in programma.</p>}
                              {myJobs.map(job => (
                                  <div key={job.id} className="bg-glr-900/50 border border-glr-700 p-4 rounded-lg flex justify-between items-center group hover:border-glr-500 transition-colors">
                                      <div>
                                          <h4 className="font-bold text-white text-lg">{job.title}</h4>
                                          <div className="text-sm text-gray-400 flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                              <span className="flex items-center gap-1"><CalIcon size={14} className="text-glr-accent"/> {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</span>
                                              <span className="hidden sm:inline">•</span>
                                              <span className="text-white">{job.location}</span>
                                          </div>
                                          {job.isAwayJob && <span className="inline-block mt-2 text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800 uppercase">Trasferta</span>}
                                      </div>
                                      <div className="text-right">
                                           <span className={`px-2 py-1 text-xs font-bold rounded uppercase 
                                                ${job.status === JobStatus.CONFIRMED ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                                {job.status}
                                            </span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* MY PLANNING (Mini) */}
                      <div className="bg-glr-800 border border-glr-700 rounded-xl p-5 shadow-lg">
                           <h3 className="text-white font-bold uppercase text-sm mb-4 flex items-center gap-2">
                              <CalIcon size={16}/> Il Mio Planning (Questa Settimana)
                           </h3>
                           <div className="grid grid-cols-7 gap-2">
                               {Array.from({length: 7}, (_, i) => {
                                   const d = new Date();
                                   const currentDay = d.getDay();
                                   const diff = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + i; // Start Monday
                                   d.setDate(diff);
                                   return d;
                               }).map(date => {
                                   // Simple status check just for display
                                   const dateStr = date.toISOString().split('T')[0];
                                   const hasJob = myJobs.some(j => dateStr >= j.startDate && dateStr <= j.endDate);
                                   const hasTask = myCrewProfile?.tasks?.some(t => t.date === dateStr);
                                   const isAbsence = myCrewProfile?.absences?.some(a => dateStr >= a.startDate && dateStr <= a.endDate);
                                   const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                   return (
                                       <div key={dateStr} className={`p-2 rounded border text-center ${
                                            hasJob ? 'bg-green-900/30 border-green-700 text-green-300' : 
                                            isAbsence ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300' :
                                            hasTask ? 'bg-purple-900/30 border-purple-700 text-purple-300' :
                                            isWeekend ? 'bg-glr-900 border-glr-700 text-gray-500' : 'bg-blue-900/10 border-blue-900/30 text-blue-400'
                                       }`}>
                                           <div className="text-[10px] uppercase font-bold mb-1">{date.toLocaleDateString('it-IT', {weekday: 'short'})}</div>
                                           <div className="text-lg font-bold">{date.getDate()}</div>
                                       </div>
                                   )
                               })}
                           </div>
                      </div>
                  </div>

                  {/* RIGHT COL: EXPENSES */}
                  <div className="bg-glr-800 border border-glr-700 rounded-xl p-5 shadow-lg flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-glr-accent font-bold uppercase text-sm flex items-center gap-2">
                               <Wallet size={16}/> Le Mie Spese
                           </h3>
                           <button onClick={() => setIsExpenseModalOpen(true)} className="bg-glr-accent text-glr-900 p-1.5 rounded hover:bg-amber-400 transition-colors" title="Nuova Spesa">
                               <Plus size={18}/>
                           </button>
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
                                       <span className="text-gray-400">{new Date(exp.date).toLocaleDateString()} • {exp.category}</span>
                                       <span className={`px-1.5 py-0.5 rounded border uppercase text-[10px] font-bold 
                                          ${exp.status === ApprovalStatus.PENDING ? 'text-yellow-400 border-yellow-800 bg-yellow-900/20' : 
                                            exp.status === ApprovalStatus.REJECTED ? 'text-red-400 border-red-800 bg-red-900/20' : 
                                            'text-green-400 border-green-800 bg-green-900/20'}`}>
                                           {exp.status === ApprovalStatus.APPROVED_MANAGER ? 'Approvato' : exp.status}
                                       </span>
                                   </div>
                                   {exp.jobTitle && <div className="text-[10px] text-glr-accent mt-1">{exp.jobTitle}</div>}
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
                                  <button onClick={handleCreateExpense} disabled={!newExpAmount || !newExpDesc || !newExpJobId} 
                                    className="w-full bg-glr-accent text-glr-900 font-bold py-2 rounded hover:bg-amber-400 disabled:opacity-50 transition-colors">
                                      Invia Richiesta
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- ADMIN / MANAGER DASHBOARD ---

  // KPI Stats
  const stats = {
    active: jobs.filter(j => j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.CONFIRMED).length,
    drafts: jobs.filter(j => j.status === JobStatus.DRAFT).length,
    completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
  };

  // Data Filtering
  const getJobsForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return jobs.filter(j => {
          if (j.status === JobStatus.CANCELLED) return false;
          return j.startDate <= dateStr && j.endDate >= dateStr;
      });
  };

  const upcomingJobs = jobs
    .filter(j => (j.status === JobStatus.CONFIRMED || j.status === JobStatus.IN_PROGRESS) && new Date(j.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const priorityTasks = jobs.filter(j => 
    j.status === JobStatus.CONFIRMED && (j.materialList.length === 0 || j.assignedCrew.length === 0)
  );

  // Expiring Documents Check
  const expiringDocs = crew.flatMap(c => 
      (c.documents || []).filter(d => {
          if(!d.expiryDate) return false;
          const expiry = new Date(d.expiryDate);
          const now = new Date();
          const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
      }).map(d => ({ member: c.name, doc: d.name, date: d.expiryDate }))
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-y-auto">
       {/* KPI Cards Row */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 mr-4"><Briefcase size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Attivi</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-amber-500/20 rounded-full text-amber-400 mr-4"><AlertCircle size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Bozze</p><p className="text-2xl font-bold text-white">{stats.drafts}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-green-500/20 rounded-full text-green-400 mr-4"><Truck size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Completati</p><p className="text-2xl font-bold text-white">{stats.completed}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-purple-500/20 rounded-full text-purple-400 mr-4"><Users size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Crew Totale</p><p className="text-2xl font-bold text-white">{crew.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN: CALENDAR */}
        <div className="lg:col-span-2 bg-glr-800 border border-glr-700 rounded-xl flex flex-col overflow-hidden shadow-2xl h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-glr-700 flex justify-between items-center bg-glr-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {monthNames[month]} <span className="text-glr-accent">{year}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronLeft/></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronRight/></button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-glr-700 bg-glr-900 text-center py-2 shrink-0">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500 uppercase">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {blanks.map(b => <div key={`blank-${b}`} className="border-b border-r border-glr-700/50 bg-glr-900/30"></div>)}
                
                {daysArray.map(day => {
                    const dayJobs = getJobsForDay(day);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    
                    return (
                        <div key={day} className={`min-h-[80px] border-b border-r border-glr-700/50 p-2 flex flex-col gap-1 relative transition-colors hover:bg-glr-700/20 ${isToday ? 'bg-glr-accent/5' : ''}`}>
                            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-glr-accent text-glr-900' : 'text-gray-400'}`}>
                                {day}
                            </span>
                            
                            {/* Jobs Indicators */}
                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                {dayJobs.map(job => (
                                    <div key={job.id} className={`text-[10px] px-1.5 py-1 rounded truncate border-l-2 cursor-pointer
                                      ${job.status === JobStatus.CONFIRMED ? 'bg-green-900/40 border-green-500 text-green-200' : 
                                        job.status === JobStatus.DRAFT ? 'bg-gray-700/50 border-gray-500 text-gray-300' : 
                                        'bg-blue-900/40 border-blue-500 text-blue-200'}`}>
                                        {job.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: LISTS & ALERTS */}
        <div className="flex flex-col gap-6 h-[600px] overflow-y-auto pr-2">
            
            {/* 1. UPCOMING JOBS */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg">
                <h3 className="text-glr-accent font-bold uppercase text-xs mb-3 flex items-center gap-2">
                    <CalIcon size={14}/> Lavori in Programma
                </h3>
                <div className="space-y-3">
                    {upcomingJobs.length === 0 && <p className="text-gray-500 text-sm italic">Nessun lavoro imminente.</p>}
                    {upcomingJobs.map(job => (
                        <div key={job.id} className="border-l-2 border-glr-accent pl-3 py-1">
                            <h4 className="text-white font-bold text-sm truncate">{job.title}</h4>
                            <p className="text-gray-400 text-xs">{job.startDate} • {job.location || 'N/D'}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. ALERTS: DOCS */}
            {expiringDocs.length > 0 && (
                <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg">
                    <h3 className="text-orange-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                        <FileText size={14}/> Documenti in Scadenza
                    </h3>
                    <div className="space-y-2">
                        {expiringDocs.map((item, idx) => (
                             <div key={idx} className="bg-orange-900/20 border border-orange-900/50 p-2 rounded text-xs">
                                 <span className="text-white font-bold block">{item.member}</span>
                                 <span className="text-orange-300">{item.doc}</span> - <span className="text-gray-400">{item.date ? new Date(item.date).toLocaleDateString() : ''}</span>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. REST DAY ANALYSIS (5+2) */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg flex-1">
                <h3 className="text-blue-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                    <Clock size={14}/> Monitoraggio Riposi ({monthNames[month]})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-gray-500 border-b border-glr-700">
                            <tr>
                                <th className="pb-1">Tecnico</th>
                                <th className="pb-1 text-center">GG Lav.</th>
                                <th className="pb-1 text-center">No Riposo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700/50">
                            {crew.filter(c => c.type === CrewType.INTERNAL).map(c => {
                                const analysis = calculateMissedRestDaysHelper(jobs, c.id, year, month, c.tasks || [], c.absences);
                                return (
                                    <tr key={c.id}>
                                        <td className="py-2 text-white font-medium">{c.name}</td>
                                        <td className="py-2 text-center text-gray-400">{analysis.totalWorked}</td>
                                        <td className={`py-2 text-center font-bold ${analysis.missedRest > 0 ? 'text-red-400' : 'text-green-500'}`}>
                                            {analysis.missedRest > 0 ? `+${analysis.missedRest}` : 'OK'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};