import React, { useState, useMemo } from 'react';
import { CrewMember, CrewExpense, ApprovalStatus, Job, CrewType } from '../types';
import { FileText, CheckCircle, XCircle, Clock, Calendar, User, Plane, Eye, Download, X, AlertTriangle, Paperclip, Euro, Filter } from 'lucide-react';

interface ExpensesDashboardProps {
    crew: CrewMember[];
    jobs: Job[];
    onUpdateCrew?: (member: CrewMember) => void;
}

export const ExpensesDashboard: React.FC<ExpensesDashboardProps> = ({ crew, jobs, onUpdateCrew }) => {
    const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'ALL'>('ALL');
    const [selectedExpense, setSelectedExpense] = useState<(CrewExpense & { crewId: string; crewName: string; type?: string }) | null>(null);
    const [rejectionNote, setRejectionNote] = useState('');

    // Flatten all expenses from all crew members AND generate automatic Per Diems
    const allExpenses = useMemo(() => {
        const flat: Array<Partial<CrewExpense> & { crewName: string; crewId: string; type: 'EXPENSE' | 'PER_DIEM' }> = [];
        
        // 1. Manual Expenses
        crew.forEach(c => {
            if (c.expenses) {
                c.expenses.forEach(e => {
                    flat.push({ 
                        ...e, 
                        crewName: c.name, 
                        crewId: c.id,
                        type: 'EXPENSE'
                    });
                });
            }
        });

        // 2. Automatic Per Diems (Indennità Trasferta) - Read Only Logic for Reports
        // Rule: Only for Internal Crew, €50/day, for 'isAwayJob' jobs
        const internalCrew = crew.filter(c => c.type === CrewType.INTERNAL);
        internalCrew.forEach(c => {
             const assignedJobs = jobs.filter(j => 
                j.assignedCrew.includes(c.id) && 
                j.isAwayJob && 
                j.status !== 'Annullato'
             );

             assignedJobs.forEach(j => {
                 const start = new Date(j.startDate);
                 const end = new Date(j.endDate);
                 const diffTime = Math.abs(end.getTime() - start.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                 const amount = diffDays * 50;

                 flat.push({
                     id: `diaria-${j.id}-${c.id}`,
                     date: j.endDate, // Payment due at end of job
                     amount: amount,
                     description: `Diaria Trasferta (${diffDays}gg): ${j.title}`,
                     category: 'Altro',
                     status: ApprovalStatus.APPROVED_MANAGER,
                     crewName: c.name,
                     crewId: c.id,
                     type: 'PER_DIEM',
                     jobTitle: j.title
                 });
             });
        });

        return flat.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
    }, [crew, jobs]);

    // Filter Logic
    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(e => {
            if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
            return true;
        });
    }, [allExpenses, filterStatus]);

    // Calculate Stats
    const stats = useMemo(() => {
        return {
            totalPending: allExpenses.filter(e => e.status === ApprovalStatus.PENDING).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            countPending: allExpenses.filter(e => e.status === ApprovalStatus.PENDING).length,
            totalApproved: allExpenses.filter(e => e.status === ApprovalStatus.APPROVED_MANAGER).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            totalPaid: allExpenses.filter(e => e.status === ApprovalStatus.COMPLETED).reduce((acc, curr) => acc + (curr.amount || 0), 0)
        };
    }, [allExpenses]);

    const getStatusColor = (status: ApprovalStatus) => {
        if (status === ApprovalStatus.PENDING) return 'text-yellow-400 border-yellow-800 bg-yellow-900/20';
        if (status === ApprovalStatus.APPROVED_MANAGER) return 'text-blue-400 border-blue-800 bg-blue-900/20';
        if (status === ApprovalStatus.COMPLETED) return 'text-green-400 border-green-800 bg-green-900/20';
        return 'text-red-400 border-red-800 bg-red-900/20';
    };

    const handleStatusUpdate = (newStatus: ApprovalStatus) => {
        if (!selectedExpense || !onUpdateCrew || selectedExpense.type === 'PER_DIEM') return;

        const member = crew.find(c => c.id === selectedExpense.crewId);
        if (!member) return;

        const updatedExpenses = member.expenses.map(e => {
            if (e.id === selectedExpense.id) {
                return {
                    ...e,
                    status: newStatus,
                    workflowLog: [
                        ...e.workflowLog,
                        {
                            id: Date.now().toString(),
                            date: new Date().toISOString(),
                            user: 'Admin',
                            action: `Stato cambiato in: ${newStatus}`,
                            note: rejectionNote || undefined
                        }
                    ]
                };
            }
            return e;
        });

        onUpdateCrew({ ...member, expenses: updatedExpenses });
        setSelectedExpense(null);
        setRejectionNote('');
    };

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
             <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText /> Approvazione Rimborsi
                </h2>
                <div className="bg-blue-900/30 border border-blue-800 rounded px-3 py-2 text-xs text-blue-300 flex items-center gap-2">
                    <Plane size={16}/>
                    <span>Include indennità trasferta automatiche (€50/gg)</span>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Clock size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">In Attesa ({stats.countPending})</p>
                    <p className="text-4xl font-bold text-yellow-400 mt-2">€ {stats.totalPending.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Richieste da processare</p>
                </div>

                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><CheckCircle size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">Approvati (Da Pagare)</p>
                    <p className="text-4xl font-bold text-blue-400 mt-2">€ {stats.totalApproved.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Validati o Diarie</p>
                </div>

                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><FileText size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">Liquidati Totale</p>
                    <p className="text-4xl font-bold text-green-400 mt-2">€ {stats.totalPaid.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Storico pagamenti</p>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl flex flex-col flex-1 overflow-hidden shadow-xl">
                {/* FILTERS TOOLBAR */}
                <div className="p-4 border-b border-glr-700 flex flex-wrap gap-2 items-center bg-glr-900/50">
                    <span className="text-gray-400 text-sm mr-2 flex items-center gap-1"><Filter size={16}/> Filtra:</span>
                    <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === 'ALL' ? 'bg-glr-700 text-white' : 'bg-glr-900 text-gray-400 border border-glr-700 hover:border-glr-500'}`}>Tutti</button>
                    <button onClick={() => setFilterStatus(ApprovalStatus.PENDING)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === ApprovalStatus.PENDING ? 'bg-yellow-600 text-white' : 'bg-glr-900 text-yellow-500 border border-yellow-900/50 hover:border-yellow-700'}`}>In Attesa</button>
                    <button onClick={() => setFilterStatus(ApprovalStatus.APPROVED_MANAGER)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === ApprovalStatus.APPROVED_MANAGER ? 'bg-blue-600 text-white' : 'bg-glr-900 text-blue-500 border border-blue-900/50 hover:border-blue-700'}`}>Approvati</button>
                    <button onClick={() => setFilterStatus(ApprovalStatus.COMPLETED)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === ApprovalStatus.COMPLETED ? 'bg-green-600 text-white' : 'bg-glr-900 text-green-500 border border-green-900/50 hover:border-green-700'}`}>Pagati</button>
                    <button onClick={() => setFilterStatus(ApprovalStatus.REJECTED)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === ApprovalStatus.REJECTED ? 'bg-red-600 text-white' : 'bg-glr-900 text-red-500 border border-red-900/50 hover:border-red-700'}`}>Rifiutati</button>
                </div>

                {/* TABLE */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-glr-900 text-gray-400 text-xs uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Tecnico</th>
                                <th className="p-4">Descrizione / Lavoro</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4 text-right">Importo</th>
                                <th className="p-4 text-center">Stato</th>
                                <th className="p-4 text-center">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700/50">
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-gray-500 italic">Nessuna richiesta trovata con i filtri correnti.</td>
                                </tr>
                            )}
                            {filteredExpenses.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-glr-700/30 transition-colors group">
                                    <td className="p-4 text-gray-300 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14}/> {exp.date ? new Date(exp.date).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-white">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-500"/> {exp.crewName}
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs">
                                        <div className="font-medium text-white truncate" title={exp.description}>{exp.description}</div>
                                        {exp.jobTitle && <div className="text-xs text-glr-accent mt-0.5 truncate" title={exp.jobTitle}>{exp.jobTitle}</div>}
                                    </td>
                                    <td className="p-4">
                                        {exp.type === 'PER_DIEM' ? (
                                            <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800 text-xs flex items-center gap-1 w-fit">
                                                <Plane size={10}/> Diaria Auto
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 bg-glr-900 px-2 py-1 rounded text-xs border border-glr-700">{exp.category}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-white">€ {(exp.amount || 0).toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] border uppercase font-bold ${getStatusColor(exp.status || ApprovalStatus.PENDING)}`}>
                                            {exp.status === ApprovalStatus.APPROVED_MANAGER ? 'APPROVATO' : exp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {exp.type === 'EXPENSE' ? (
                                            <button onClick={() => setSelectedExpense(exp)} className="p-1.5 bg-glr-900 hover:bg-glr-700 rounded text-gray-300 hover:text-white transition-colors border border-glr-700 hover:border-glr-500">
                                                <Eye size={16}/>
                                            </button>
                                        ) : (
                                            <span className="text-gray-600 text-xs italic">Auto</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {selectedExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-glr-700 flex justify-between items-center bg-glr-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText size={18}/> Dettaglio Richiesta</h3>
                            <button onClick={() => { setSelectedExpense(null); setRejectionNote(''); }} className="text-gray-400 hover:text-white"><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Header Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Richiedente</p>
                                    <p className="text-xl font-bold text-white">{selectedExpense.crewName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Importo</p>
                                    <p className="text-2xl font-bold text-white font-mono">€ {selectedExpense.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-glr-900 p-4 rounded-lg border border-glr-700">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Data Spesa</p>
                                    <p className="text-sm text-white font-bold">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Categoria</p>
                                    <p className="text-sm text-white font-bold">{selectedExpense.category}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Descrizione</p>
                                    <p className="text-sm text-white">{selectedExpense.description}</p>
                                </div>
                                <div className="col-span-2 border-t border-glr-800 pt-2 mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Commessa Collegata</p>
                                    <p className="text-sm text-glr-accent font-bold">{selectedExpense.jobTitle || 'Nessuna commessa specificata'}</p>
                                </div>
                            </div>

                            {/* Attachment */}
                            <div className="border border-dashed border-glr-600 rounded-lg p-4 flex items-center justify-between hover:bg-glr-900/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Paperclip className="text-gray-400"/>
                                    <div>
                                        <p className="text-sm font-bold text-white">Giustificativo di Spesa</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedExpense.attachmentUrl ? 'Allegato presente' : 'Nessun allegato caricato'}
                                        </p>
                                    </div>
                                </div>
                                {selectedExpense.attachmentUrl && (
                                    <a href={selectedExpense.attachmentUrl} target="_blank" rel="noreferrer" className="bg-glr-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-white hover:text-glr-900 flex items-center gap-2">
                                        <Download size={14}/> Scarica
                                    </a>
                                )}
                            </div>

                            {/* History/Log */}
                            {selectedExpense.workflowLog.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Cronologia Stato</p>
                                    <div className="space-y-2 pl-2 border-l-2 border-glr-700">
                                        {selectedExpense.workflowLog.map(log => (
                                            <div key={log.id} className="text-xs">
                                                <span className="text-gray-400">{new Date(log.date).toLocaleDateString()}</span> - <span className="text-white font-bold">{log.user}</span>: {log.action}
                                                {log.note && <div className="text-red-400 italic mt-0.5">"{log.note}"</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions Area */}
                            {selectedExpense.status === ApprovalStatus.PENDING && (
                                <div className="bg-glr-900 p-4 rounded-lg border border-glr-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Azioni Amministratore</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusUpdate(ApprovalStatus.APPROVED_MANAGER)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2">
                                            <CheckCircle size={18}/> Approva
                                        </button>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Motivo rifiuto..." 
                                                value={rejectionNote}
                                                onChange={e => setRejectionNote(e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-1 text-xs text-white"
                                            />
                                            <button onClick={() => handleStatusUpdate(ApprovalStatus.REJECTED)} disabled={!rejectionNote} className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 font-bold py-1.5 rounded flex items-center justify-center gap-2 disabled:opacity-50">
                                                <XCircle size={16}/> Rifiuta
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedExpense.status === ApprovalStatus.APPROVED_MANAGER && (
                                <button onClick={() => handleStatusUpdate(ApprovalStatus.COMPLETED)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg">
                                    <Euro size={20}/> Segna come Liquidato / Pagato
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};