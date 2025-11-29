
import React, { useState } from 'react';
import { CrewMember, CrewRole, CrewType, CrewExpense, CrewAbsence, ApprovalStatus, Job, CrewDocument, CrewTask } from '../types';
import { User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Plus, ChevronRight, LayoutGrid, FileDown, Upload, Trash2, Download, Lock, Key, Printer, X, Briefcase } from 'lucide-react';

interface CrewProps {
  crew: CrewMember[];
  onUpdateCrew?: (member: CrewMember) => void;
  jobs?: Job[]; 
  settings?: any;
}

export const Crew: React.FC<CrewProps> = ({ crew, onUpdateCrew, jobs = [], settings }) => {
  const [filter, setFilter] = useState<'ALL' | 'INTERNAL' | 'FREELANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'PLANNING' | 'REPORT'>('CARDS');
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'ABSENCES' | 'EXPENSES' | 'DOCS' | 'HR'>('INFO');
  const [isEditing, setIsEditing] = useState(false);
  const [editMember, setEditMember] = useState<CrewMember | null>(null);

  // Manual Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [targetCrewId, setTargetCrewId] = useState('');

  const getNext7Days = () => {
      const dates = [];
      for(let i=0; i<7; i++) {
          const d = new Date(); d.setDate(d.getDate() + i); dates.push(d);
      }
      return dates;
  };
  const weekDates = getNext7Days();
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
      const newTask: CrewTask = { id: Date.now().toString(), date: newTaskDate, description: newTaskDesc, assignedBy: 'Admin' };
      const updatedMember = { ...member, tasks: [...(member.tasks || []), newTask] };
      onUpdateCrew(updatedMember);
      setIsTaskModalOpen(false);
  };

  return (
      <div className="space-y-6 animate-fade-in relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <h2 className="text-2xl font-bold text-white">Gestione Crew & Tecnici</h2>
            <div className="flex gap-4">
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setViewMode('CARDS')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><User size={16}/> Schede</button>
                    <button onClick={() => setViewMode('PLANNING')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'PLANNING' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><LayoutGrid size={16}/> Planning</button>
                    <button onClick={() => setViewMode('REPORT')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'REPORT' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><FileText size={16}/> Report PDF</button>
                </div>
            </div>
        </div>

        {viewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrew.map(member => (
                <div key={member.id} className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 flex items-center justify-center text-xl font-bold text-glr-accent border border-glr-600">{member.name.charAt(0)}</div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight cursor-pointer hover:text-glr-accent" onClick={() => { setEditMember(member); setIsEditing(true); }}>{member.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${member.type === CrewType.INTERNAL ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-900 text-orange-300'}`}>{member.type}</span>
                        </div>
                        </div>
                    </div>
                     <div className="flex flex-wrap gap-1 mb-4">{member.roles.map(role => (<span key={role} className="text-xs bg-glr-700 text-gray-300 px-2 py-1 rounded">{role}</span>))}</div>
                    </div>
                    <div className="bg-glr-900 p-3 border-t border-glr-700 flex justify-between text-xs">
                        <button onClick={() => { setSelectedMember(member); setActiveTab('ABSENCES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><Calendar size={12}/> Ferie</button>
                        <button onClick={() => { setSelectedMember(member); setActiveTab('EXPENSES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><FileText size={12}/> Note Spese</button>
                        <button onClick={() => { setSelectedMember(member); setActiveTab('INFO'); }} className="text-glr-accent hover:text-amber-400 hover:underline flex items-center gap-1">Dettagli <ChevronRight size={12}/></button>
                    </div>
                </div>
                ))}
            </div>
        ) : viewMode === 'PLANNING' ? (
             <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-glr-900 text-gray-300 text-xs uppercase border-b border-glr-700">
                                <th className="p-4 w-48 sticky left-0 bg-glr-900 z-10">Tecnico</th>
                                {weekDates.map(d => (<th key={d.toString()} className="p-4 text-center min-w-[120px]">{d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</th>))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700">
                            {filteredCrew.map(c => (
                                <tr key={c.id} className="hover:bg-glr-700/30">
                                    <td className="p-4 font-bold text-white sticky left-0 bg-glr-800 z-10 border-r border-glr-700">{c.name}</td>
                                    {weekDates.map(d => {
                                         const dateStr = d.toISOString().split('T')[0];
                                         const activeJob = jobs.find(j => j.status !== 'Annullato' && j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate);
                                         const manualTask = c.tasks?.find(t => t.date === dateStr);

                                         return (
                                            <td key={d.toString()} className="p-2 border-r border-glr-700/50 cursor-pointer hover:bg-glr-700/50 transition-colors" onClick={() => handleCellClick(c.id, d)}>
                                                {activeJob ? (
                                                    <div className="bg-blue-600/20 text-blue-200 border border-blue-500/50 text-[10px] p-2 rounded text-center truncate" title={activeJob.title}>{activeJob.title}</div>
                                                ) : manualTask ? (
                                                    <div className="bg-purple-600/20 text-purple-200 border border-purple-500/50 text-[10px] p-2 rounded text-center truncate font-bold" title={manualTask.description}>{manualTask.description}</div>
                                                ) : (<div className="bg-gray-700/20 text-gray-500 text-[10px] p-2 rounded text-center border border-dashed border-gray-700 opacity-0 hover:opacity-100 transition-opacity">+</div>)}
                                            </td>
                                         )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
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
                     const workingToday = filteredCrew.filter(c => jobs.some(j => j.status !== 'Annullato' && j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate));
                     const tasksToday = filteredCrew.filter(c => c.tasks?.some(t => t.date === dateStr) && !workingToday.includes(c));
                     const availableToday = filteredCrew.filter(c => !workingToday.includes(c) && !tasksToday.includes(c));
                     
                     return (
                         <div key={day.toISOString()} className="mb-6 break-inside-avoid border border-gray-300 rounded overflow-hidden">
                             <h3 className="bg-gray-800 text-white font-bold uppercase px-3 py-1.5 text-sm flex justify-between"><span>{day.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span><span className="opacity-70 text-xs font-normal">Tot: {filteredCrew.length}</span></h3>
                             <div className="grid grid-cols-2 text-sm divide-x divide-gray-300">
                                 <div className="p-3 bg-blue-50/50">
                                     <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-blue-800 uppercase text-xs">In Servizio / Extra</h4>
                                     <ul className="space-y-1">
                                         {workingToday.map(c => { const job = jobs.find(j => j.assignedCrew.includes(c.id) && dateStr >= j.startDate && dateStr <= j.endDate); return (<li key={c.id} className="flex justify-between items-center text-blue-900"><span className="font-bold">{c.name}</span><span className="text-xs italic text-gray-600 truncate max-w-[120px]">{job?.title}</span></li>) })}
                                         {tasksToday.map(c => { const task = c.tasks?.find(t => t.date === dateStr); return (<li key={c.id} className="flex justify-between items-center text-purple-900"><span className="font-bold">{c.name}</span><span className="text-xs italic text-purple-600 truncate max-w-[120px]">{task?.description}</span></li>) })}
                                     </ul>
                                 </div>
                                 <div className="p-3 bg-white">
                                     <h4 className="font-bold border-b border-gray-300 mb-2 pb-1 text-gray-600 uppercase text-xs">Disponibili</h4>
                                     {availableToday.length > 0 ? (<div className="flex flex-wrap gap-2">{availableToday.map(c => (<span key={c.id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs border border-gray-200">{c.name}</span>))}</div>) : (<p className="text-xs text-gray-500 italic">Tutti impegnati</p>)}
                                 </div>
                             </div>
                         </div>
                     )
                 })}
            </div>
        )}

        {/* NEW TASK MODAL */}
        {isTaskModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 p-6 w-full max-w-sm shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Aggiungi Task Manuale</h3>
                        <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Data</label>
                            <input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Descrizione Attività</label>
                            <input type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Ritiro materiale, Permesso..." />
                        </div>
                        <button onClick={handleAddTask} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded mt-2">Salva Task</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Member Edit Modal placeholder if needed, logic exists in previous file versions */}
      </div>
  );
};
