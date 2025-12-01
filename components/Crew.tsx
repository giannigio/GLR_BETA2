import React, { useState, useMemo } from 'react';
import { CrewMember, CrewRole, CrewType, CrewExpense, CrewAbsence, ApprovalStatus, Job, CrewDocument, CrewTask, FinancialDocument, JobStatus, SystemRole } from '../types';
import { User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Plus, ChevronRight, LayoutGrid, FileDown, Upload, Trash2, Download, Lock, Key, Printer, X, Briefcase, ChevronLeft, Shield, AlertTriangle, FileCheck, Euro, Paperclip, Send, BriefcaseIcon } from 'lucide-react';

interface CrewProps {
  crew: CrewMember[];
  onAddCrew?: (member: Partial<CrewMember>) => void;
  onUpdateCrew?: (member: CrewMember) => void;
  jobs?: Job[]; 
  settings?: any;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

export const Crew: React.FC<CrewProps> = ({ crew, onAddCrew, onUpdateCrew, jobs = [], settings, currentUser }) => {
  const [filter, setFilter] = useState<'ALL' | 'INTERNAL' | 'FREELANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'PLANNING' | 'REPORT'>('CARDS');
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'DOCS' | 'PAYROLL' | 'ABSENCES' | 'EXPENSES'>('INFO');
  
  // Manual Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [targetCrewId, setTargetCrewId] = useState('');

  // New Member State
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState<Partial<CrewMember>>({
      name: '',
      type: CrewType.INTERNAL,
      phone: '',
      email: '',
      roles: [],
      dailyRate: 0,
      accessRole: 'TECH',
      password: ''
  });

  // Payroll State
  const [selectedPayrollYear, setSelectedPayrollYear] = useState(new Date().getFullYear());

  // Expense Request State
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [newExpJobId, setNewExpJobId] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Viaggio');
  const [newExpDesc, setNewExpDesc] = useState('');

  // --- PLANNING DATES LOGIC ---
  const getMonday = (d: Date) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  const weekDates = useMemo(() => {
      const dates = [];
      const start = new Date(currentWeekStart);
      for(let i=0; i<7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i); 
          dates.push(d);
      }
      return dates;
  }, [currentWeekStart]);

  const prevWeek = () => {
      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentWeekStart(newDate);
  };

  const resetWeek = () => setCurrentWeekStart(getMonday(new Date()));

  const handlePrint = () => window.print();

  const filteredCrew = crew.filter(c => {
    if (filter === 'INTERNAL') return c.type === CrewType.INTERNAL;
    if (filter === 'FREELANCE') return c.type === CrewType.FREELANCE;
    return true;
  });

  const handleCellClick = (crewId: string, date: Date) => {
      setTargetCrewId(crewId);
      setNewTaskDate(date.toISOString().split('T')[0]);
      setNewTaskDesc('');
      setIsTaskModalOpen(true);
  };

  const handleAddTask = () => {
      if (!targetCrewId || !newTaskDesc || !onUpdateCrew) return;
      const member = crew.find(c => c.id === targetCrewId);
      if (!member) return;
      
      const existingTasks = member.tasks?.filter(t => t.date !== newTaskDate) || [];
      const newTask: CrewTask = { id: Date.now().toString(), date: newTaskDate, description: newTaskDesc, assignedBy: 'Admin' };
      const updatedMember = { ...member, tasks: [...existingTasks, newTask] };
      onUpdateCrew(updatedMember);
      setIsTaskModalOpen(false);
  };

  const handleSaveNewMember = () => {
    if (!onAddCrew || !newMemberData.name || !newMemberData.email) {
        alert("Nome e Email sono obbligatori.");
        return;
    }
    onAddCrew({ ...newMemberData, id: `temp-${Date.now()}` });
    setIsNewMemberModalOpen(false);
    setNewMemberData({ name: '', type: CrewType.INTERNAL, phone: '', email: '', roles: [], dailyRate: 0, accessRole: 'TECH', password: '' });
  };

  // --- MEMBER DETAILS HANDLERS ---

  const handleUpdateMember = (updates: Partial<CrewMember>) => {
      if (!selectedMember || !onUpdateCrew) return;
      const updated = { ...selectedMember, ...updates };
      setSelectedMember(updated);
      onUpdateCrew(updated);
  };

  const handleAddDocument = (type: string, name: string, expiry?: string) => {
      if (!selectedMember || !onUpdateCrew) return;
      const newDoc: CrewDocument = {
          id: Date.now().toString(),
          name,
          type: type as any,
          expiryDate: expiry,
          uploadDate: new Date().toISOString(),
          fileUrl: '#'
      };
      const updatedDocs = [...(selectedMember.documents || []), newDoc];
      handleUpdateMember({ documents: updatedDocs });
  };

  const handleAddPayroll = (month: string, year: number) => {
       if (!selectedMember || !onUpdateCrew) return;
       const newDoc: FinancialDocument = {
           id: Date.now().toString(),
           name: `Busta Paga ${month} ${year}`,
           type: 'Busta Paga',
           month,
           year,
           uploadDate: new Date().toISOString(),
           fileUrl: '#'
       };
       const updatedFinDocs = [...(selectedMember.financialDocuments || []), newDoc];
       handleUpdateMember({ financialDocuments: updatedFinDocs });
  };

  const handleUpdateExpenseStatus = (expId: string, status: ApprovalStatus) => {
      if (!selectedMember || !onUpdateCrew) return;
      const updatedExpenses = selectedMember.expenses.map(e => 
          e.id === expId ? { ...e, status } : e
      );
      handleUpdateMember({ expenses: updatedExpenses });
  };

  // --- EXPENSE REQUEST HANDLER ---
  const handleSubmitExpense = () => {
      if (!selectedMember || !onUpdateCrew || !newExpJobId || !newExpAmount) return;
      
      const job = jobs.find(j => j.id === newExpJobId);
      
      const newExpense: CrewExpense = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: parseFloat(newExpAmount),
          category: newExpCategory as any,
          description: newExpDesc,
          jobId: job?.id,
          jobTitle: job?.title,
          status: ApprovalStatus.PENDING,
          workflowLog: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: selectedMember.name,
              action: 'Richiesta inviata al sistema' // Notification trigger
          }],
          attachmentUrl: '#' // Simulated
      };

      const updatedExpenses = [...(selectedMember.expenses || []), newExpense];
      handleUpdateMember({ expenses: updatedExpenses });
      
      // Reset & Close
      setIsExpenseFormOpen(false);
      setNewExpJobId('');
      setNewExpAmount('');
      setNewExpDesc('');
  };

  const getDocStatus = (type: string) => {
      if (!selectedMember?.documents) return 'MISSING';
      const doc = selectedMember.documents.find(d => d.type === type);
      if (!doc) return 'MISSING';
      if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) return 'EXPIRED';
      return 'VALID';
  };

  // Filter completed jobs for the selected crew member
  const eligibleJobsForExpense = useMemo(() => {
      if (!selectedMember) return [];
      return jobs.filter(j => 
          j.status === JobStatus.COMPLETED && 
          j.assignedCrew.includes(selectedMember.id)
      );
  }, [jobs, selectedMember]);

  return (
      <div className="space-y-6 animate-fade-in relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <h2 className="text-2xl font-bold text-white">Gestione Crew & Tecnici</h2>
            <div className="flex gap-4 items-center">
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setViewMode('CARDS')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><User size={16}/> Schede</button>
                    <button onClick={() => setViewMode('PLANNING')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'PLANNING' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><LayoutGrid size={16}/> Planning</button>
                    <button onClick={() => setViewMode('REPORT')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'REPORT' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><FileText size={16}/> Report PDF</button>
                </div>
                {currentUser?.role !== 'TECH' && (
                    <button onClick={() => setIsNewMemberModalOpen(true)} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2"><Plus size={18}/> Nuovo Tecnico</button>
                )}
            </div>
        </div>

        {viewMode === 'CARDS' && (
            <div className="space-y-4">
                 <div className="flex gap-2 mb-4">
                    <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded text-xs font-bold ${filter === 'ALL' ? 'bg-glr-accent text-glr-900' : 'bg-glr-800 text-gray-400 border border-glr-700'}`}>Tutti</button>
                    <button onClick={() => setFilter('INTERNAL')} className={`px-3 py-1.5 rounded text-xs font-bold ${filter === 'INTERNAL' ? 'bg-glr-accent text-glr-900' : 'bg-glr-800 text-gray-400 border border-glr-700'}`}>Interni</button>
                    <button onClick={() => setFilter('FREELANCE')} className={`px-3 py-1.5 rounded text-xs font-bold ${filter === 'FREELANCE' ? 'bg-glr-accent text-glr-900' : 'bg-glr-800 text-gray-400 border border-glr-700'}`}>Freelance</button>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCrew.map(member => (
                    <div key={member.id} className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden hover:shadow-lg transition-shadow group relative">
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 flex items-center justify-center text-xl font-bold text-glr-accent border border-glr-600 shadow-inner">{member.name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight cursor-pointer hover:text-glr-accent" onClick={() => { setSelectedMember(member); setActiveTab('INFO'); }}>{member.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${member.type === CrewType.INTERNAL ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' : 'bg-orange-900/30 border-orange-500 text-orange-300'}`}>{member.type}</span>
                                        {member.accessRole && <span className="text-[10px] bg-glr-700 text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={8}/> {member.accessRole}</span>}
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">{member.roles.map(role => (<span key={role} className="text-xs bg-glr-900 text-gray-400 border border-glr-700 px-2 py-1 rounded">{role}</span>))}</div>
                        </div>
                        
                        {/* Status Bar */}
                        <div className="px-5 pb-4 flex gap-2">
                             {/* Doc Status Indicators */}
                             <div className={`h-2 w-full rounded-full ${getDocStatus('Unilav') === 'VALID' ? 'bg-green-500/30' : 'bg-red-500/30'}`} title="Unilav"></div>
                             <div className={`h-2 w-full rounded-full ${getDocStatus('Visita Medica') === 'VALID' ? 'bg-green-500/30' : 'bg-red-500/30'}`} title="Visita Medica"></div>
                             <div className={`h-2 w-full rounded-full ${getDocStatus('Certificazione') === 'VALID' ? 'bg-green-500/30' : 'bg-red-500/30'}`} title="Corsi Sicurezza"></div>
                        </div>

                        <div className="bg-glr-900 p-3 border-t border-glr-700 flex justify-between text-xs">
                            <button onClick={() => { setSelectedMember(member); setActiveTab('ABSENCES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><Calendar size={12}/> Ferie</button>
                            <button onClick={() => { setSelectedMember(member); setActiveTab('EXPENSES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><Euro size={12}/> Note Spese</button>
                            <button onClick={() => { setSelectedMember(member); setActiveTab('INFO'); }} className="text-glr-accent hover:text-amber-400 hover:underline flex items-center gap-1 font-bold">Gestisci <ChevronRight size={12}/></button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        )}

        {viewMode === 'PLANNING' && (
             <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-200px)]">
                {/* Planning Header Controls */}
                <div className="p-4 border-b border-glr-700 flex justify-between items-center bg-glr-900/50">
                    <div className="flex items-center gap-4">
                        <button onClick={prevWeek} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronLeft/></button>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-white">Settimana {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}</span>
                        </div>
                        <button onClick={nextWeek} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronRight/></button>
                        <button onClick={resetWeek} className="ml-4 text-xs bg-glr-800 border border-glr-600 px-2 py-1 rounded text-gray-400 hover:text-white">Oggi</button>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-3 h-3 bg-blue-900/40 border border-blue-500 rounded"></span> Lavoro</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-3 h-3 bg-purple-900/40 border border-purple-500 rounded"></span> Manuale</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-3 h-3 bg-gray-900 border border-glr-600 rounded"></span> Riposo</div>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                     <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-glr-900 text-gray-300 text-xs uppercase border-b border-glr-700 shadow-md">
                                <th className="p-4 w-48 sticky left-0 bg-glr-900 z-30 border-r border-glr-700">Tecnico</th>
                                {weekDates.map((d, idx) => (
                                    <th key={d.toString()} className={`p-4 text-center min-w-[120px] border-r border-glr-700/50 ${idx >= 5 ? 'bg-glr-900/80 text-gray-500' : ''}`}>
                                        <div className="font-bold">{d.toLocaleDateString('it-IT', { weekday: 'long' })}</div>
                                        <div className="text-[10px] opacity-70">{d.getDate()} {d.toLocaleDateString('it-IT', { month: 'short' })}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700">
                            {filteredCrew.map(c => (
                                <tr key={c.id} className="hover:bg-glr-700/30">
                                    <td className="p-4 font-bold text-white sticky left-0 bg-glr-800 z-10 border-r border-glr-700 border-b border-glr-700">{c.name}</td>
                                    {weekDates.map((d, idx) => {
                                         const dateStr = d.toISOString().split('T')[0];
                                         
                                         // Check Phase Assignment
                                         let activePhase: { name: string, jobTitle: string } | null = null;
                                         jobs.forEach(j => {
                                             if (j.status === 'Annullato') return;
                                             // Find matching phase
                                             const phase = j.phases.find(p => 
                                                 (p.assignedCrew || []).includes(c.id) && 
                                                 dateStr >= p.start.split('T')[0] && 
                                                 dateStr <= p.end.split('T')[0]
                                             );
                                             
                                             if (phase) {
                                                 activePhase = { name: phase.name, jobTitle: j.title };
                                             } else if (j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate && j.phases.length === 0) {
                                                  // Fallback for old/simple jobs without phases
                                                  activePhase = { name: 'Intero Evento', jobTitle: j.title };
                                             }
                                         });

                                         const manualTask = c.tasks?.find(t => t.date === dateStr);
                                         
                                         // Default states logic
                                         const isWeekend = idx >= 5; // Sat/Sun
                                         let cellContent;
                                         let cellClass = "";
                                         let cellTitle = "";

                                         if (activePhase) {
                                             cellClass = "bg-blue-600/20 text-blue-200 border-blue-500/50";
                                             cellContent = activePhase.name;
                                             cellTitle = `${activePhase.jobTitle} - ${activePhase.name}`;
                                         } else if (manualTask) {
                                             cellClass = "bg-purple-600/20 text-purple-200 border-purple-500/50 font-bold";
                                             cellContent = manualTask.description;
                                         } else {
                                             if (isWeekend) {
                                                 cellClass = "bg-glr-950/50 text-gray-600 border-transparent opacity-50"; // Darker for Rest
                                                 cellContent = "Riposo";
                                             } else {
                                                 cellClass = "bg-glr-900/50 text-gray-500 border-transparent hover:border-gray-600";
                                                 cellContent = "Magazzino";
                                             }
                                         }

                                         return (
                                            <td key={d.toString()} className="p-1 border-r border-b border-glr-700/50 cursor-pointer h-16 align-top" onClick={() => handleCellClick(c.id, d)} title={cellTitle}>
                                                <div className={`w-full h-full p-2 rounded text-[11px] border transition-all flex items-center justify-center text-center ${cellClass}`}>
                                                    <span className="line-clamp-2">{cellContent}</span>
                                                </div>
                                            </td>
                                         )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {viewMode === 'REPORT' && (
            <div className="bg-white text-black p-8 rounded shadow-lg min-h-[600px] font-sans print-only">
                 <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="GLR" /> : <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-bold text-2xl rounded">GLR</div>}
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-tight">{settings?.companyName || 'GLR Productions'}</h1>
                            <p className="text-sm text-gray-600">Report Operativo Settimanale</p>
                             <p className="text-sm font-bold">Dal {weekDates[0].toLocaleDateString()} al {weekDates[6].toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={handlePrint} className="no-print bg-black text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-800"><Printer size={16}/> Stampa</button>
                 </div>
                 {weekDates.map(day => {
                     const dateStr = day.toISOString().split('T')[0];
                     const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                     
                     // Logic matching planning view for grouping
                     const assignedCrew = filteredCrew.filter(c => jobs.some(j => j.status !== 'Annullato' && j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate));
                     const manualCrew = filteredCrew.filter(c => c.tasks?.some(t => t.date === dateStr) && !assignedCrew.includes(c));
                     
                     const warehouseCrew = filteredCrew.filter(c => 
                        !assignedCrew.includes(c) && 
                        !manualCrew.includes(c) && 
                        !isWeekend && 
                        c.type === CrewType.INTERNAL
                     );

                     return (
                         <div key={day.toISOString()} className="mb-6 break-inside-avoid border border-gray-300 rounded overflow-hidden">
                             <h3 className="bg-gray-800 text-white font-bold uppercase px-3 py-1.5 text-sm flex justify-between"><span>{day.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></h3>
                             <div className="grid grid-cols-3 text-sm divide-x divide-gray-300">
                                 <div className="p-3 bg-blue-50/50">
                                     <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-blue-800 uppercase text-xs">Produzione</h4>
                                     <ul className="space-y-1">
                                         {assignedCrew.map(c => { 
                                             let phaseName = '';
                                             const job = jobs.find(j => {
                                                 if (j.status === 'Annullato') return false;
                                                 const phase = j.phases.find(p => (p.assignedCrew || []).includes(c.id) && dateStr >= p.start.split('T')[0] && dateStr <= p.end.split('T')[0]);
                                                 if (phase) {
                                                     phaseName = phase.name;
                                                     return true;
                                                 }
                                                 return j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate;
                                             });
                                             
                                             return (<li key={c.id} className="flex justify-between items-center text-blue-900"><span className="font-bold">{c.name}</span><span className="text-xs italic text-gray-600 truncate max-w-[100px]">{phaseName || job?.title}</span></li>) 
                                         })}
                                         {assignedCrew.length === 0 && <li className="text-xs text-gray-400 italic">-</li>}
                                     </ul>
                                 </div>
                                 <div className="p-3 bg-purple-50/50">
                                     <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-purple-800 uppercase text-xs">Extra / Permessi</h4>
                                     <ul className="space-y-1">
                                         {manualCrew.map(c => { const task = c.tasks?.find(t => t.date === dateStr); return (<li key={c.id} className="flex justify-between items-center text-purple-900"><span className="font-bold">{c.name}</span><span className="text-xs italic text-purple-600 truncate max-w-[100px]">{task?.description}</span></li>) })}
                                         {manualCrew.length === 0 && <li className="text-xs text-gray-400 italic">-</li>}
                                     </ul>
                                 </div>
                                 <div className="p-3 bg-white">
                                     <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-gray-600 uppercase text-xs">Magazzino (Disp.)</h4>
                                     {isWeekend ? (
                                         <p className="text-xs text-green-600 italic">Riposo Settimanale</p>
                                     ) : warehouseCrew.length > 0 ? (
                                         <div className="flex flex-wrap gap-2">{warehouseCrew.map(c => (<span key={c.id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs border border-gray-200">{c.name}</span>))}</div>
                                     ) : (
                                         <p className="text-xs text-gray-500 italic">Nessuno in sede</p>
                                     )}
                                 </div>
                             </div>
                         </div>
                     )
                 })}
            </div>
        )}

        {/* --- MEMBER DETAIL MODAL --- */}
        {selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-4xl h-[85vh] shadow-2xl animate-fade-in flex flex-col">
                    
                    {/* MODAL HEADER */}
                    <div className="p-4 border-b border-glr-700 flex justify-between items-start shrink-0 bg-glr-900/50 rounded-t-xl">
                        <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-full bg-glr-700 flex items-center justify-center text-2xl font-bold text-glr-accent border border-glr-600 shadow-inner">
                                 {selectedMember.name.charAt(0)}
                             </div>
                             <div>
                                 <h2 className="text-xl font-bold text-white">{selectedMember.name}</h2>
                                 <div className="flex gap-2 text-xs">
                                     <span className="text-gray-400">{selectedMember.type}</span>
                                     <span className="text-gray-500">•</span>
                                     <span className="text-glr-accent">{selectedMember.roles.join(', ')}</span>
                                 </div>
                             </div>
                        </div>
                        <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-white p-1 hover:bg-glr-700 rounded"><X size={24}/></button>
                    </div>

                    {/* MODAL TABS */}
                    <div className="flex border-b border-glr-700 bg-glr-900/30 shrink-0 px-4 overflow-x-auto">
                        <button onClick={() => setActiveTab('INFO')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'INFO' ? 'border-glr-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><User size={16}/> Profilo</button>
                        <button onClick={() => setActiveTab('DOCS')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'DOCS' ? 'border-glr-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><FileCheck size={16}/> Documenti</button>
                        {selectedMember.type === CrewType.INTERNAL && (
                            <button onClick={() => setActiveTab('PAYROLL')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'PAYROLL' ? 'border-glr-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><DollarSign size={16}/> Buste Paga</button>
                        )}
                        <button onClick={() => setActiveTab('ABSENCES')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ABSENCES' ? 'border-glr-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Calendar size={16}/> Ferie & Permessi</button>
                        <button onClick={() => setActiveTab('EXPENSES')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'EXPENSES' ? 'border-glr-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Euro size={16}/> Rimborsi Spese</button>
                    </div>

                    {/* MODAL CONTENT */}
                    <div className="flex-1 overflow-y-auto p-6 bg-glr-800">
                        
                        {/* 1. INFO TAB */}
                        {activeTab === 'INFO' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-glr-accent text-xs font-bold uppercase mb-3">Contatti</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                                <input type="text" value={selectedMember.email || ''} onChange={e => handleUpdateMember({email: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Telefono</label>
                                                <input type="text" value={selectedMember.phone || ''} onChange={e => handleUpdateMember({phone: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-glr-accent text-xs font-bold uppercase mb-3">Contratto & Costi</h4>
                                        <div className="space-y-3">
                                             <div>
                                                <label className="block text-xs text-gray-500 mb-1">Tipo Contratto</label>
                                                <select value={selectedMember.type} onChange={e => handleUpdateMember({type: e.target.value as any})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm">
                                                    <option value={CrewType.INTERNAL}>Interno (Dipendente)</option>
                                                    <option value={CrewType.FREELANCE}>Esterno (P.IVA/Ritenuta)</option>
                                                </select>
                                            </div>
                                            {selectedMember.type === CrewType.FREELANCE && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Tariffa Giornaliera (€)</label>
                                                    <input type="number" value={selectedMember.dailyRate || 0} onChange={e => handleUpdateMember({dailyRate: parseFloat(e.target.value) || 0})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedMember.type === CrewType.INTERNAL && (
                                    <div className="bg-glr-900/30 border border-glr-700 p-4 rounded-lg">
                                        <h4 className="text-white text-sm font-bold flex items-center gap-2 mb-3"><Lock size={16}/> Accesso Applicativo</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Ruolo Accesso</label>
                                                <select value={selectedMember.accessRole || 'TECH'} onChange={e => handleUpdateMember({accessRole: e.target.value as any})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm">
                                                    <option value="ADMIN">Admin (Completo)</option>
                                                    <option value="MANAGER">Manager (Limitato)</option>
                                                    <option value="TECH">Tecnico (Solo Personale)</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Password</label>
                                                <input type="password" value={selectedMember.password || ''} onChange={e => handleUpdateMember({password: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Resetta password..." />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">Nota: I tecnici esterni non hanno accesso all'applicativo.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. DOCUMENTS TAB */}
                        {activeTab === 'DOCS' && (
                            <div className="space-y-6">
                                {/* Important Docs Grid */}
                                <h4 className="text-glr-accent text-xs font-bold uppercase mb-2">Certificazioni Obbligatorie</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {['Unilav', 'Visita Medica', 'Certificazione'].map(docType => {
                                        const doc = selectedMember.documents?.find(d => d.type === docType);
                                        const status = getDocStatus(docType);
                                        return (
                                            <div key={docType} className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center gap-2 ${status === 'VALID' ? 'bg-green-900/10 border-green-800' : status === 'EXPIRED' ? 'bg-red-900/10 border-red-800' : 'bg-glr-900 border-glr-700'}`}>
                                                {status === 'VALID' ? <CheckCircle className="text-green-500"/> : <AlertTriangle className="text-red-500"/>}
                                                <h5 className="text-sm font-bold text-white">{docType === 'Certificazione' ? 'Corsi Sicurezza' : docType}</h5>
                                                {doc ? (
                                                    <div className="text-xs">
                                                        <p className="text-gray-400">Scadenza: <span className={status === 'EXPIRED' ? 'text-red-400 font-bold' : 'text-white'}>{new Date(doc.expiryDate!).toLocaleDateString()}</span></p>
                                                        <a href={doc.fileUrl} target="_blank" className="text-blue-400 hover:underline mt-1 block">Scarica PDF</a>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleAddDocument(docType, `${docType} - ${selectedMember.name}`, new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0])} className="text-xs bg-glr-700 hover:bg-white hover:text-glr-900 px-3 py-1 rounded transition-colors mt-1">Carica Documento</button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Other Docs List */}
                                <div className="border-t border-glr-700 pt-4">
                                     <div className="flex justify-between items-center mb-3">
                                         <h4 className="text-glr-accent text-xs font-bold uppercase">Altri Documenti</h4>
                                         <button className="flex items-center gap-1 text-xs bg-glr-900 hover:bg-glr-700 border border-glr-700 px-3 py-1.5 rounded text-gray-300 hover:text-white transition-colors">
                                             <Upload size={12}/> Carica Altro
                                         </button>
                                     </div>
                                     <div className="space-y-2">
                                         {selectedMember.documents?.filter(d => !['Unilav', 'Visita Medica', 'Certificazione'].includes(d.type)).length === 0 && <p className="text-gray-500 text-sm italic">Nessun altro documento archiviato.</p>}
                                         {selectedMember.documents?.filter(d => !['Unilav', 'Visita Medica', 'Certificazione'].includes(d.type)).map(doc => (
                                             <div key={doc.id} className="flex justify-between items-center bg-glr-900 p-3 rounded border border-glr-700">
                                                 <div className="flex items-center gap-3">
                                                     <FileText size={18} className="text-gray-400"/>
                                                     <div>
                                                         <p className="text-sm font-bold text-white">{doc.name}</p>
                                                         <p className="text-[10px] text-gray-500">Caricato il {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                                     </div>
                                                 </div>
                                                 <button className="text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* 3. PAYROLL TAB */}
                        {activeTab === 'PAYROLL' && selectedMember.type === CrewType.INTERNAL && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedPayrollYear(p => p - 1)} className="p-1 hover:bg-glr-700 rounded"><ChevronLeft size={20}/></button>
                                        <h3 className="text-xl font-bold text-white">Anno {selectedPayrollYear}</h3>
                                        <button onClick={() => setSelectedPayrollYear(p => p + 1)} className="p-1 hover:bg-glr-700 rounded"><ChevronRight size={20}/></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'].map(month => {
                                        const doc = selectedMember.financialDocuments?.find(d => d.type === 'Busta Paga' && d.month === month && d.year === selectedPayrollYear);
                                        return (
                                            <div key={month} className={`border rounded-lg p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] relative group ${doc ? 'bg-blue-900/20 border-blue-800' : 'bg-glr-900 border-glr-700'}`}>
                                                <span className="text-sm font-bold text-gray-300">{month}</span>
                                                {doc ? (
                                                    <>
                                                        <FileText size={24} className="text-blue-400"/>
                                                        <span className="text-[10px] text-green-400">Caricato</span>
                                                        <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold underline">Scarica</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleAddPayroll(month, selectedPayrollYear)} className="mt-2 text-xs bg-glr-800 hover:bg-glr-700 px-3 py-1 rounded text-gray-400 hover:text-white flex items-center gap-1">
                                                        <Upload size={12}/> Carica
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. ABSENCES TAB */}
                        {activeTab === 'ABSENCES' && (
                            <div className="space-y-6">
                                <div className="bg-glr-900 p-4 rounded-lg border border-glr-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Richieste in Attesa</p>
                                        <p className="text-2xl font-bold text-white">{(selectedMember.absences || []).filter(a => a.status === ApprovalStatus.PENDING).length}</p>
                                    </div>
                                    <button onClick={() => handleCellClick(selectedMember.id, new Date())} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded hover:bg-amber-400 flex items-center gap-2"><Plus size={18}/> Inserisci Ferie/Permesso</button>
                                </div>

                                <div className="space-y-2">
                                    {(selectedMember.absences || []).length === 0 && selectedMember.tasks?.length === 0 && <p className="text-gray-500 italic">Nessuna assenza registrata.</p>}
                                    
                                    {/* Combined View of Manual Tasks (from Planning) and Formal Absences */}
                                    {[...(selectedMember.tasks || []), ...(selectedMember.absences || [])]
                                        .sort((a,b) => new Date((a as any).date || (a as any).startDate).getTime() - new Date((b as any).date || (b as any).startDate).getTime())
                                        .map((item: any) => {
                                            const isTask = !!item.description;
                                            return (
                                                <div key={item.id} className="bg-glr-900 border border-glr-700 p-3 rounded flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{isTask ? item.description : item.type}</p>
                                                        <p className="text-xs text-gray-500">{isTask ? new Date(item.date).toLocaleDateString() : `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`}</p>
                                                    </div>
                                                    <div className="text-right">
                                                         {isTask ? (
                                                             <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-800">Manuale</span>
                                                         ) : (
                                                             <span className={`text-[10px] px-2 py-1 rounded border uppercase ${item.status === 'In Attesa' ? 'text-yellow-400 border-yellow-800' : 'text-green-400 border-green-800'}`}>{item.status}</span>
                                                         )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        )}

                        {/* 5. EXPENSES TAB */}
                        {activeTab === 'EXPENSES' && (
                            <div className="space-y-6 relative">
                                <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-white font-bold flex items-center gap-2"><Euro size={18}/> Storico Rimborsi</h4>
                                     <div className="flex items-center gap-2">
                                         {/* Only Techs or Admins can add expenses */}
                                         {(currentUser?.role === 'ADMIN' || currentUser?.role === 'TECH' || currentUser?.role === 'MANAGER') && (
                                             <button onClick={() => setIsExpenseFormOpen(true)} className="bg-glr-accent text-glr-900 px-3 py-1.5 rounded font-bold text-xs hover:bg-amber-400 flex items-center gap-2">
                                                 <Plus size={14}/> Nuova Richiesta
                                             </button>
                                         )}
                                     </div>
                                </div>

                                {isExpenseFormOpen && (
                                    <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-600 mb-6 animate-fade-in">
                                        <div className="flex justify-between items-center mb-3 border-b border-glr-700 pb-2">
                                            <h5 className="font-bold text-white text-sm">Inserisci Richiesta Rimborso</h5>
                                            <button onClick={() => setIsExpenseFormOpen(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
                                        </div>
                                        
                                        {/* Eligibility Warning */}
                                        {eligibleJobsForExpense.length === 0 && (
                                            <div className="bg-red-900/20 border border-red-800 p-2 rounded text-xs text-red-300 mb-3 flex items-center gap-2">
                                                <AlertTriangle size={14}/> Non ci sono lavori "Completati" assegnati a questo tecnico. Impossibile richiedere rimborso.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div className="col-span-2">
                                                <label className="block text-xs text-gray-400 mb-1">Lavoro di Riferimento (Solo Completati)</label>
                                                <select disabled={eligibleJobsForExpense.length === 0} value={newExpJobId} onChange={e => setNewExpJobId(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm">
                                                    <option value="">-- Seleziona Lavoro --</option>
                                                    {eligibleJobsForExpense.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                                                <select disabled={eligibleJobsForExpense.length === 0} value={newExpCategory} onChange={e => setNewExpCategory(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm">
                                                    <option>Viaggio</option>
                                                    <option>Pasto</option>
                                                    <option>Alloggio</option>
                                                    <option>Materiale</option>
                                                    <option>Altro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Importo (€)</label>
                                                <input disabled={eligibleJobsForExpense.length === 0} type="number" value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="0.00"/>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs text-gray-400 mb-1">Descrizione / Giustificativo</label>
                                                <input disabled={eligibleJobsForExpense.length === 0} type="text" value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Benzina, Ricevuta Ristorante..."/>
                                            </div>
                                        </div>
                                        <button onClick={handleSubmitExpense} disabled={!newExpJobId || !newExpAmount || eligibleJobsForExpense.length === 0} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm disabled:opacity-50 transition-colors">
                                            Invia Richiesta
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {(selectedMember.expenses || []).length === 0 && <p className="text-gray-500 italic">Nessuna nota spese.</p>}
                                    {[...(selectedMember.expenses || [])].reverse().map(exp => (
                                        <div key={exp.id} className="bg-glr-900 border border-glr-700 p-4 rounded-lg relative group">
                                             <div className="flex justify-between items-start mb-2">
                                                 <div>
                                                     <p className="font-bold text-white">{exp.description}</p>
                                                     <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()} • {exp.category} • {exp.jobTitle || 'Nessun Lavoro'}</p>
                                                 </div>
                                                 <p className="text-xl font-bold text-white font-mono">€ {exp.amount.toFixed(2)}</p>
                                             </div>
                                             
                                             <div className="flex items-center justify-between border-t border-glr-800 pt-3 mt-2">
                                                 <div className="flex items-center gap-2">
                                                      {exp.attachmentUrl ? (
                                                          <a href={exp.attachmentUrl} className="text-xs flex items-center gap-1 text-blue-400 hover:text-white bg-blue-900/20 px-2 py-1 rounded border border-blue-800"><Paperclip size={12}/> Giustificativo</a>
                                                      ) : (
                                                          <span className="text-xs text-gray-500 flex items-center gap-1"><Paperclip size={12}/> No allegato</span>
                                                      )}
                                                 </div>
                                                 
                                                 <div className="flex items-center gap-2">
                                                     {/* Workflow Status Badge */}
                                                     <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border 
                                                        ${exp.status === ApprovalStatus.PENDING ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' : 
                                                          exp.status === ApprovalStatus.APPROVED_MANAGER ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 
                                                          exp.status === ApprovalStatus.COMPLETED ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-red-900/20 text-red-400 border-red-800'}`}>
                                                         {exp.status === ApprovalStatus.APPROVED_MANAGER ? 'Accettata' : exp.status === ApprovalStatus.COMPLETED ? 'Rimborsata' : exp.status}
                                                     </span>

                                                     {/* Admin Controls */}
                                                     {currentUser?.role === 'ADMIN' && (
                                                         <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                             {exp.status === ApprovalStatus.PENDING && <button onClick={() => handleUpdateExpenseStatus(exp.id, ApprovalStatus.APPROVED_MANAGER)} className="p-1 bg-blue-600 rounded text-white hover:bg-blue-500" title="Accetta"><CheckCircle size={14}/></button>}
                                                             {exp.status === ApprovalStatus.APPROVED_MANAGER && <button onClick={() => handleUpdateExpenseStatus(exp.id, ApprovalStatus.COMPLETED)} className="p-1 bg-green-600 rounded text-white hover:bg-green-500" title="Segna come Pagato"><DollarSign size={14}/></button>}
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        )}

        {isNewMemberModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-lg shadow-2xl animate-fade-in p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Nuovo Tecnico</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Nome Cognome</label>
                                <input type="text" value={newMemberData.name} onChange={e => setNewMemberData({...newMemberData, name: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white" autoFocus/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                                <select value={newMemberData.type} onChange={e => setNewMemberData({...newMemberData, type: e.target.value as CrewType})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                    <option value={CrewType.INTERNAL}>Interno</option>
                                    <option value={CrewType.FREELANCE}>Esterno / Freelance</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs text-gray-400 mb-1">Email</label>
                                <input type="email" value={newMemberData.email} onChange={e => setNewMemberData({...newMemberData, email: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                             <div>
                                <label className="block text-xs text-gray-400 mb-1">Telefono</label>
                                <input type="text" value={newMemberData.phone} onChange={e => setNewMemberData({...newMemberData, phone: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                        </div>
                        
                        {newMemberData.type === CrewType.INTERNAL ? (
                            <div className="p-4 bg-glr-900/50 rounded border border-glr-700 space-y-4">
                                <h4 className="text-sm font-bold text-glr-accent">Credenziali di Accesso</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Ruolo Sistema</label>
                                        <select value={newMemberData.accessRole} onChange={e => setNewMemberData({...newMemberData, accessRole: e.target.value as SystemRole})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white">
                                            <option value="TECH">Tecnico</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Password</label>
                                        <input type="password" value={newMemberData.password} onChange={e => setNewMemberData({...newMemberData, password: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white" placeholder="••••••••"/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div>
                                <label className="block text-xs text-gray-400 mb-1">Tariffa Giornaliera (€)</label>
                                <input type="number" value={newMemberData.dailyRate} onChange={e => setNewMemberData({...newMemberData, dailyRate: parseFloat(e.target.value)})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                        )}
                        
                        <div className="flex gap-2 pt-4 justify-end">
                            <button onClick={() => setIsNewMemberModalOpen(false)} className="px-4 py-2 text-gray-300">Annulla</button>
                            <button onClick={handleSaveNewMember} className="bg-glr-accent text-glr-900 font-bold px-6 py-2 rounded">Crea Tecnico</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* NEW TASK MODAL */}
        {isTaskModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Modifica Attività</h3>
                        <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-2 bg-glr-900 rounded border border-glr-700 text-xs text-gray-400 mb-2">
                            Stai assegnando un'attività manuale a <b>{crew.find(c => c.id === targetCrewId)?.name}</b> per il <b>{new Date(newTaskDate).toLocaleDateString()}</b>.
                            Questo sovrascriverà lo stato di default (Magazzino/Riposo).
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Descrizione Attività</label>
                            <input type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm focus:border-glr-accent outline-none" placeholder="Es. Ferie, Permesso, Ritiro Materiale..." autoFocus />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setIsTaskModalOpen(false)} className="flex-1 bg-glr-700 hover:bg-glr-600 text-white py-2 rounded">Annulla</button>
                            <button onClick={handleAddTask} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
  );
};