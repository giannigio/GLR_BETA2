
import React, { useMemo } from 'react';
import { CrewMember, CrewExpense, ApprovalStatus, Job, CrewType } from '../types';
import { FileText, CheckCircle, XCircle, Clock, Calendar, User, Plane } from 'lucide-react';

interface ExpensesDashboardProps {
    crew: CrewMember[];
    jobs: Job[];
}

export const ExpensesDashboard: React.FC<ExpensesDashboardProps> = ({ crew, jobs }) => {
    
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

        // 2. Automatic Per Diems (Indennità Trasferta)
        // Rule: Only for Internal Crew, €50/day, for 'isAwayJob' jobs
        const internalCrew = crew.filter(c => c.type === CrewType.INTERNAL);
        internalCrew.forEach(c => {
             // Find jobs where this crew member is assigned
             const assignedJobs = jobs.filter(j => 
                j.assignedCrew.includes(c.id) && 
                j.isAwayJob && 
                j.status !== 'Annullato'
             );

             assignedJobs.forEach(j => {
                 const start = new Date(j.startDate);
                 const end = new Date(j.endDate);
                 // Calculate days (inclusive)
                 const diffTime = Math.abs(end.getTime() - start.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                 const amount = diffDays * 50;

                 flat.push({
                     id: `diaria-${j.id}-${c.id}`,
                     date: j.endDate, // Payment due at end of job
                     amount: amount,
                     description: `Diaria Trasferta (${diffDays}gg): ${j.title}`,
                     category: 'Altro', // Display label will handle logic
                     status: ApprovalStatus.APPROVED_MANAGER, // Considered approved as it's an assigned job
                     crewName: c.name,
                     crewId: c.id,
                     type: 'PER_DIEM',
                     jobTitle: j.title
                 });
             });
        });

        return flat.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
    }, [crew, jobs]);

    // Calculate Totals
    const stats = useMemo(() => {
        return {
            totalPending: allExpenses.filter(e => e.status === ApprovalStatus.PENDING).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            countPending: allExpenses.filter(e => e.status === ApprovalStatus.PENDING).length,
            totalApproved: allExpenses.filter(e => e.status === ApprovalStatus.APPROVED_MANAGER).reduce((acc, curr) => acc + (curr.amount || 0), 0),
            totalPaid: allExpenses.filter(e => e.status === ApprovalStatus.COMPLETED).reduce((acc, curr) => acc + (curr.amount || 0), 0)
        };
    }, [allExpenses]);

    // Group by Month
    const groupedExpenses = useMemo(() => {
        const groups: Record<string, typeof allExpenses> = {};
        allExpenses.forEach(exp => {
            const date = new Date(exp.date || '');
            const key = date.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(exp);
        });
        return groups;
    }, [allExpenses]);

    const getStatusColor = (status: ApprovalStatus) => {
        if (status === ApprovalStatus.PENDING) return 'text-yellow-400 border-yellow-800 bg-yellow-900/20';
        if (status === ApprovalStatus.APPROVED_MANAGER) return 'text-blue-400 border-blue-800 bg-blue-900/20';
        if (status === ApprovalStatus.COMPLETED) return 'text-green-400 border-green-800 bg-green-900/20';
        return 'text-red-400 border-red-800 bg-red-900/20';
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText /> Dashboard Rimborsi & Spese
                </h2>
                <div className="bg-blue-900/30 border border-blue-800 rounded px-3 py-2 text-xs text-blue-300 flex items-center gap-2">
                    <Plane size={16}/>
                    <span>Include indennità trasferta automatiche (€50/gg) per tecnici interni</span>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Clock size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">In Attesa ({stats.countPending})</p>
                    <p className="text-4xl font-bold text-yellow-400 mt-2">€ {stats.totalPending.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Da approvare</p>
                </div>

                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><CheckCircle size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">Approvati (Da Pagare)</p>
                    <p className="text-4xl font-bold text-blue-400 mt-2">€ {stats.totalApproved.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Validati o Diarie Automatiche</p>
                </div>

                <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><FileText size={100} /></div>
                    <p className="text-gray-400 text-sm uppercase font-bold">Pagati (Totale)</p>
                    <p className="text-4xl font-bold text-green-400 mt-2">€ {stats.totalPaid.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Storico liquidato</p>
                </div>
            </div>

            {/* MONTHLY LISTS */}
            <div className="space-y-8">
                {Object.keys(groupedExpenses).map(month => (
                    <div key={month} className="bg-glr-800 border border-glr-700 rounded-xl overflow-hidden">
                        <div className="bg-glr-900/50 p-4 border-b border-glr-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white capitalize">{month}</h3>
                            <span className="text-sm text-gray-400">Totale Mese: € {groupedExpenses[month].reduce((acc, c) => acc + (c.amount || 0), 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-glr-900 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Tecnico</th>
                                        <th className="p-4">Descrizione / Lavoro</th>
                                        <th className="p-4">Categoria</th>
                                        <th className="p-4 text-right">Importo</th>
                                        <th className="p-4 text-center">Stato</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glr-700/50">
                                    {groupedExpenses[month].map(exp => (
                                        <tr key={exp.id} className="hover:bg-glr-700/30">
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
                                            <td className="p-4">
                                                <div className="font-medium text-white">{exp.description}</div>
                                                {exp.jobTitle && <div className="text-xs text-glr-accent mt-0.5">{exp.jobTitle}</div>}
                                            </td>
                                            <td className="p-4">
                                                {exp.type === 'PER_DIEM' ? (
                                                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800 text-xs flex items-center gap-1 w-fit">
                                                        <Plane size={10}/> Diaria (Auto)
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">{exp.category}</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-white">€ {(exp.amount || 0).toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] border uppercase font-bold ${getStatusColor(exp.status || ApprovalStatus.PENDING)}`}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
