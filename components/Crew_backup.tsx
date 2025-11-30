
import React, { useState, useMemo } from 'react';
import { CrewMember, CrewRole, CrewType, CrewExpense, CrewAbsence, ApprovalStatus, Job, CrewDocument, CrewTask } from '../types';
import { User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Plus, ChevronRight, LayoutGrid, FileDown, Upload, Trash2, Download, Lock, Key, Printer, X, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';

interface CrewProps {
  crew: CrewMember[];
  onUpdateCrew?: (member: CrewMember) => void;
  jobs?: Job[]; 
  settings?: any;
}

export const Crew: React.FC<CrewProps> = ({ crew, onUpdateCrew, jobs = [], settings }) => {
  const [filter, setFilter] = useState<'ALL' | 'INTERNAL' | 'FREELANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'PLANNING' | 'REPORT'>('PLANNING'); // Default to Planning
  
  // Planning State
  const [currentDate, setCurrentDate] = useState(new Date()); // Anchor date for the week
  
  // Modals & Editing
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'INFO' | 'DOCS' | 'ABSENCES' | 'EXPENSES'>('INFO');
  
  // Task Creation State
  const [targetTaskCrewId, setTargetTaskCrewId] = useState('');
  const [targetTaskDate, setTargetTaskDate] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskJobId, setNewTaskJobId] = useState('');

  // --- PLANNING LOGIC ---
  const getStartOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDates = Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
  });

  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };

  const getDailyStatus = (member: CrewMember, date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      // 1. Absence (Leave, Sick) - Highest Priority
      const absence = member.absences.find(a => dateStr >= a.startDate && dateStr <= a.endDate && a.status === ApprovalStatus.APPROVED_MANAGER);
      if (absence) {
          if (absence.type === 'Malattia') return { type: 'SICK', label: 'Malattia', color: 'bg-red-200 text-red-800 border-red-300' };
          if (absence.type === 'Ferie') return { type: 'LEAVE', label: 'Ferie', color: 'bg-yellow-200 text-yellow-800 border-yellow-300' };
          return { type: 'PERMIT', label: 'Permesso', color: 'bg-orange-200 text-orange-800 border-orange-300' };
      }

      // 2. Job Assignment
      // Check if assigned to any job active on this date
      const job = jobs.find(j => 
          j.status !== 'Annullato' && 
          j.assignedCrew.includes(member.id) && 
          dateStr >= j.startDate && dateStr <= j.endDate
      );
      if (job) {
          return { type: 'JOB', label: job.title, color: 'bg-green-600/20 text-green-300 border-green-600', data: job };
      }

      // 3. Manual Task
      const task = member.tasks?.find(t => t.date === dateStr);
      if (task) {
          return { type: 'TASK', label: task.description, color: 'bg-purple-600/20 text-purple-300 border-purple-500', data: task };
      }

      // 4. Default State
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6; // Sun or Sat

      if (isWeekend) return { type: 'REST', label: 'Riposo', color: 'bg-gray-800 text-gray-500 border-transparent border-dashed border' };
      return { type: 'WAREHOUSE', label: 'Magazzino', color: 'bg-blue-900/10 text-blue-400 border-blue-900/30' };
  };

  const handleCellClick = (member: CrewMember, date: Date) => {
      setTargetTaskCrewId(member.id);
      setTargetTaskDate(date.toISOString().split('T')[0]);
      setNewTaskDesc('');
      setNewTaskJobId('');
      setIsTaskModalOpen(true);
  };

  const handleSaveTask = () => {
      if (!targetTaskCrewId || !onUpdateCrew) return;
      
      const member = crew.find(c => c.id === targetTaskCrewId);
      if (!member) return;

      // Create new task or overwrite existing for that day
      // Note: If user wants to "Assign Job" or "Absence", that would be separate logic.
      // For this modal, we focus on Manual Tasks.
      
      const newTask: CrewTask = {
          id: Date.now().toString(),
          date: targetTaskDate,
          description: newTaskDesc,
          assignedBy: 'Admin', // In real app, current user
          jobId: newTaskJobId || undefined
      };

      const existingTasks = member.tasks || [];
      // Remove any existing task on that day to replace
      const filteredTasks = existingTasks.filter(t => t.date !== targetTaskDate);
      
      const updatedMember = {
          ...member,
          tasks: [...filteredTasks, newTask]
      };

      onUpdateCrew(updatedMember);
      setIsTaskModalOpen(false);
  };

  const handleDeleteTask = () => {
       if (!targetTaskCrewId || !onUpdateCrew) return;
       const member = crew.find(c => c.id === targetTaskCrewId);
       if (!member) return;
       
       const updatedMember = {
           ...member,
           tasks: (member.tasks || []).filter(t => t.date !== targetTaskDate)
       };
       onUpdateCrew(updatedMember);
       setIsTaskModalOpen(false);
  };

  // --- MEMBER DETAIL LOGIC ---
  const handleUpdateDoc = (doc: CrewDocument) => {
      if (!selectedMember || !onUpdateCrew) return;
      const docs = selectedMember.documents || [];
      const updatedDocs = docs.some(d => d.id === doc.id) ? docs.map(d => d.id === doc.id ? doc : d) : [...docs, doc];
      onUpdateCrew({ ...selectedMember, documents: updatedDocs });
      // Update local state to reflect immediately
      setSelectedMember({ ...selectedMember, documents: updatedDocs });
  };
  
  const handleAddAbsence = (abs: CrewAbsence) => {
       if (!selectedMember || !onUpdateCrew) return;
       const updatedAbs = [...selectedMember.absences, abs];
       onUpdateCrew({ ...selectedMember, absences: updatedAbs });
       setSelectedMember({ ...selectedMember, absences: updatedAbs });
  };

  const filteredCrew = crew.filter(c => {
    if (filter === 'INTERNAL') return c.type === CrewType.INTERNAL;
    if (filter === 'FREELANCE') return c.type === CrewType.FREELANCE;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><User /> Crew & Tecnici</h2>
            <div className="flex gap-4 items-center">
                 <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setViewMode('PLANNING')} className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'PLANNING' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><LayoutGrid size={16}/> Planning</button>
                    <button onClick={() => setViewMode('CARDS')} className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><User size={16}/> Schede</button>
                </div>
                 {/* Only show add button if needed */}
            </div>
        </div>

        {/* --- PLANNING VIEW --- */}
        {viewMode === 'PLANNING' && (
            <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-200px)]">
                 {/* Calendar Nav */}
                 <div className="p-4 bg-glr-900 border-b border-glr-700 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                         <button onClick={prevWeek} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ArrowLeft size={20}/></button>
                         <h3 className="text-lg font-bold text-white capitalize">
                             {startOfWeek.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} 
                             <span className="text-sm font-normal text-gray-400 ml-2">(Settimana {startOfWeek.getDate()} - {new Date(startOfWeek.getTime()+6*86400000).getDate()})</span>
                         </h3>
                         <button onClick={nextWeek} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ArrowRight size={20}/></button>
                         <button onClick={() => setCurrentDate(new Date())} className="text-xs bg-glr-700 text-white px-3 py-1 rounded">Oggi</button>
                     </div>
                     <div className="flex gap-2">
                         <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Magazzino</span>
                         <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-green-500"></span> Lavoro</span>
                         <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Task</span>
                         <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Riposo</span>
                     </div>
                 </div>

                 {/* Calendar Grid */}
                 <div className="flex-1 overflow-auto">
                     <table className="w-full text-left border-collapse">
                         <thead className="sticky top-0 z-10 bg-glr-900 shadow-sm">
                             <tr>
                                 <th className="p-3 w-48 border-b border-r border-glr-700 bg-glr-900 text-gray-400 text-xs uppercase font-bold sticky left-0 z-20">Tecnico</th>
                                 {weekDates.map(d => (
                                     <th key={d.toISOString()} className={`p-3 min-w-[140px] border-b border-glr-700 text-center ${d.toDateString() === new Date().toDateString() ? 'bg-glr-800' : ''}`}>
                                         <div className="text-xs text-gray-500 uppercase">{d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                                         <div className={`text-lg font-bold ${d.toDateString() === new Date().toDateString() ? 'text-glr-accent' : 'text-white'}`}>{d.getDate()}</div>
                                     </th>
                                 ))}
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-glr-700">
                             {filteredCrew.map(member => (
                                 <tr key={member.id} className="hover:bg-glr-700/20 group">
                                     <td className="p-3 border-r border-glr-700 bg-glr-800 sticky left-0 z-10 group-hover:bg-glr-700 transition-colors cursor-pointer" onClick={() => { setSelectedMember(member); setIsMemberModalOpen(true); }}>
                                         <div className="font-bold text-white text-sm">{member.name}</div>
                                         <div className="text-[10px] text-gray-500">{member.roles[0]}</div>
                                     </td>
                                     {weekDates.map(d => {
                                         const status = getDailyStatus(member, d);
                                         return (
                                             <td key={d.toISOString()} 
                                                 onClick={() => handleCellClick(member, d)}
                                                 className={`p-2 border-r border-glr-700/50 cursor-pointer hover:brightness-110 transition-all relative ${status.type === 'REST' ? 'bg-glr-900/50' : ''}`}
                                             >
                                                 <div className={`w-full h-full min-h-[50px] rounded p-2 text-xs border ${status.color} flex flex-col justify-center`}>
                                                     <span className="font-bold truncate">{status.label}</span>
                                                     {/* Show details on hover or small icon */}
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

        {/* --- CARDS VIEW --- */}
        {viewMode === 'CARDS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredCrew.map(member => (
                     <div key={member.id} className="bg-glr-800 border border-glr-700 rounded-xl overflow-hidden hover:shadow-xl transition-all group">
                         <div className="p-5">
                             <div className="flex items-start justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 border border-glr-600 flex items-center justify-center text-xl font-bold text-glr-accent">
                                         {member.name.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-white text-lg">{member.name}</h3>
                                         <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${member.type === CrewType.INTERNAL ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 'bg-orange-900/30 text-orange-300 border-orange-800'}`}>{member.type}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => { setSelectedMember(member); setIsMemberModalOpen(true); }} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-glr-700"><ChevronRight/></button>
                             </div>
                             <div className="flex flex-wrap gap-2 mb-4">
                                 {member.roles.map(r => <span key={r} className="text-xs bg-glr-900 text-gray-400 px-2 py-1 rounded">{r}</span>)}
                             </div>
                             <div className="space-y-2 text-sm text-gray-400">
                                 <div className="flex items-center gap-2"><Phone size={14}/> {member.phone}</div>
                                 {member.type === CrewType.FREELANCE && <div className="flex items-center gap-2"><DollarSign size={14}/> € {member.dailyRate} / gg</div>}
                             </div>
                         </div>
                         
                         {/* Expiry Warning Strip */}
                         {(member.documents || []).some(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30*86400000)) && (
                             <div className="bg-orange-900/20 py-2 px-5 flex items-center gap-2 text-xs text-orange-400 font-bold border-t border-orange-900/30">
                                 <AlertCircle size={12}/> Documenti in scadenza
                             </div>
                         )}
                     </div>
                 ))}
             </div>
        )}

        {/* --- TASK MODAL --- */}
        {isTaskModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-sm shadow-2xl animate-fade-in p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Gestione Giornaliera</h3>
                    <p className="text-xs text-gray-400 mb-4">{new Date(targetTaskDate).toLocaleDateString()} - {crew.find(c => c.id === targetTaskCrewId)?.name}</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Descrizione Task Manuale</label>
                            <input type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Ritiro materiale, Manutenzione..."/>
                        </div>
                        {/* Option to link to job if needed, skipped for brevity but supported in data model */}
                        
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleDeleteTask} className="flex-1 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 font-bold py-2 rounded text-sm">Rimuovi / Pulisci</button>
                            <button onClick={handleSaveTask} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-sm">Salva Task</button>
                        </div>
                         <button onClick={() => setIsTaskModalOpen(false)} className="w-full text-gray-500 text-xs mt-2 hover:text-white">Annulla</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MEMBER DETAIL MODAL --- */}
        {isMemberModalOpen && selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 no-print overflow-y-auto">
                 <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-4xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                     {/* Modal Header */}
                     <div className="p-6 border-b border-glr-700 flex justify-between items-start shrink-0">
                         <div className="flex gap-4">
                             <div className="w-16 h-16 rounded-full bg-glr-700 flex items-center justify-center text-3xl font-bold text-white border border-glr-500">
                                 {selectedMember.name.charAt(0)}
                             </div>
                             <div>
                                 <h2 className="text-2xl font-bold text-white">{selectedMember.name}</h2>
                                 <p className="text-gray-400 text-sm flex items-center gap-2">
                                     {selectedMember.type} • {selectedMember.roles.join(', ')}
                                 </p>
                             </div>
                         </div>
                         <button onClick={() => setIsMemberModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                     </div>

                     {/* Tabs */}
                     <div className="flex border-b border-glr-700 px-6 bg-glr-900/50 shrink-0">
                         {['INFO', 'DOCS', 'ABSENCES', 'EXPENSES'].map(tab => (
                             <button 
                                key={tab} 
                                onClick={() => setActiveDetailTab(tab as any)}
                                className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === tab ? 'border-glr-accent text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                             >
                                 {tab === 'INFO' ? 'Anagrafica' : tab === 'DOCS' ? 'Documenti' : tab === 'ABSENCES' ? 'Ferie & Assenze' : 'Rimborsi'}
                             </button>
                         ))}
                     </div>

                     {/* Content */}
                     <div className="p-6 overflow-y-auto flex-1">
                         
                         {/* 1. INFO TAB */}
                         {activeDetailTab === 'INFO' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-4">
                                     <h3 className="text-glr-accent font-bold uppercase text-sm border-b border-glr-700 pb-2">Contatti</h3>
                                     <div><label className="text-xs text-gray-400">Email</label><p className="text-white font-medium">{selectedMember.email || '-'}</p></div>
                                     <div><label className="text-xs text-gray-400">Telefono</label><p className="text-white font-medium">{selectedMember.phone}</p></div>
                                     
                                     <h3 className="text-glr-accent font-bold uppercase text-sm border-b border-glr-700 pb-2 mt-6">Note Interne</h3>
                                     <textarea className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm h-24" placeholder="Note su skill, preferenze..." defaultValue={selectedMember.notes}></textarea>
                                 </div>
                                 <div className="space-y-4">
                                     <h3 className="text-glr-accent font-bold uppercase text-sm border-b border-glr-700 pb-2">Dati Economici</h3>
                                     <div className="bg-glr-900 p-4 rounded-lg border border-glr-700 space-y-3">
                                         {selectedMember.type === CrewType.INTERNAL ? (
                                             <>
                                                 <div><label className="text-xs text-gray-400">Costo Mensile Netto</label><p className="text-white font-bold text-lg">€ {selectedMember.monthlyNetCost || 0}</p></div>
                                                 <div><label className="text-xs text-gray-400">Costo Contributi/Tasse</label><p className="text-white font-bold text-lg">€ {selectedMember.monthlyTaxCost || 0}</p></div>
                                             </>
                                         ) : (
                                             <div><label className="text-xs text-gray-400">Tariffa Giornaliera</label><p className="text-white font-bold text-lg">€ {selectedMember.dailyRate}</p></div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         )}

                         {/* 2. DOCS TAB */}
                         {activeDetailTab === 'DOCS' && (
                             <div className="space-y-6">
                                 <div className="flex justify-between items-center">
                                     <h3 className="text-white font-bold">Documenti & Certificazioni</h3>
                                     <button className="bg-glr-700 text-white px-3 py-1.5 rounded text-sm hover:bg-white hover:text-glr-900 font-bold transition-colors">Carica Documento</button>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {(selectedMember.documents || []).length === 0 && <p className="text-gray-500 italic col-span-2 text-center py-4">Nessun documento caricato.</p>}
                                     {(selectedMember.documents || []).map(doc => {
                                         const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                         const isExpiring = doc.expiryDate && !isExpired && new Date(doc.expiryDate) < new Date(Date.now() + 30*86400000);
                                         
                                         return (
                                             <div key={doc.id} className={`p-4 rounded-lg border flex justify-between items-center ${isExpired ? 'bg-red-900/20 border-red-800' : isExpiring ? 'bg-orange-900/20 border-orange-800' : 'bg-glr-900 border-glr-700'}`}>
                                                 <div>
                                                     <p className="font-bold text-white flex items-center gap-2">
                                                         {doc.name} 
                                                         <span className="text-[10px] font-normal text-gray-400 border border-gray-600 px-1 rounded">{doc.type}</span>
                                                     </p>
                                                     {doc.expiryDate && (
                                                         <p className={`text-xs mt-1 ${isExpired ? 'text-red-400 font-bold' : isExpiring ? 'text-orange-400 font-bold' : 'text-green-400'}`}>
                                                             Scadenza: {new Date(doc.expiryDate).toLocaleDateString()}
                                                         </p>
                                                     )}
                                                 </div>
                                                 <div className="flex gap-2">
                                                     <button className="p-2 hover:bg-glr-800 rounded text-blue-400"><Download size={16}/></button>
                                                     <button className="p-2 hover:bg-glr-800 rounded text-red-400"><Trash2 size={16}/></button>
                                                 </div>
                                             </div>
                                         )
                                     })}
                                 </div>
                             </div>
                         )}

                         {/* 3. ABSENCES TAB */}
                         {activeDetailTab === 'ABSENCES' && (
                             <div className="space-y-6">
                                 <div className="flex justify-between items-center">
                                     <h3 className="text-white font-bold">Storico Assenze</h3>
                                     <button className="bg-glr-accent text-glr-900 px-3 py-1.5 rounded text-sm font-bold hover:bg-amber-400 transition-colors">Nuova Richiesta</button>
                                 </div>
                                 <table className="w-full text-left text-sm">
                                     <thead className="bg-glr-900 text-gray-500 uppercase text-xs">
                                         <tr>
                                             <th className="p-3">Tipo</th>
                                             <th className="p-3">Periodo</th>
                                             <th className="p-3">Stato</th>
                                             <th className="p-3">Note</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-glr-700">
                                         {selectedMember.absences.map(abs => (
                                             <tr key={abs.id}>
                                                 <td className="p-3 font-bold text-white">{abs.type}</td>
                                                 <td className="p-3 text-gray-300">{new Date(abs.startDate).toLocaleDateString()} - {new Date(abs.endDate).toLocaleDateString()}</td>
                                                 <td className="p-3">
                                                     <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold 
                                                        ${abs.status === ApprovalStatus.APPROVED_MANAGER ? 'bg-green-900 text-green-400' : 
                                                          abs.status === ApprovalStatus.REJECTED ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'}`}>
                                                         {abs.status}
                                                     </span>
                                                 </td>
                                                 <td className="p-3 text-gray-400 text-xs italic">{abs.notes || '-'}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         )}
                         
                         {/* 4. EXPENSES TAB (Read Only here, management in Dashboard) */}
                         {activeDetailTab === 'EXPENSES' && (
                             <div className="space-y-4">
                                 <h3 className="text-white font-bold mb-4">Ultimi Rimborsi</h3>
                                 {(selectedMember.expenses || []).length === 0 ? <p className="text-gray-500 italic">Nessuna spesa registrata.</p> : (
                                     <div className="space-y-2">
                                         {(selectedMember.expenses || []).map(exp => (
                                             <div key={exp.id} className="bg-glr-900 p-3 rounded border border-glr-700 flex justify-between items-center">
                                                 <div>
                                                     <p className="text-sm font-bold text-white">{exp.description}</p>
                                                     <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()} • {exp.jobTitle || 'Generico'}</p>
                                                 </div>
                                                 <div className="text-right">
                                                     <p className="font-mono text-white">€ {exp.amount}</p>
                                                     <span className={`text-[10px] ${exp.status === ApprovalStatus.PENDING ? 'text-yellow-400' : 'text-green-400'}`}>{exp.status}</span>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         )}

                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};
