

import React, { useState, useMemo, useEffect } from 'react';
import { Job, CrewMember, CostCenter, F24Payment, JobStatus, CrewType, ApprovalStatus, AppSettings } from '../types';
import { api } from '../services/api';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
    Building2, DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, Plus, Trash2, Edit3, Calendar, FileText, CheckCircle, Wallet, Receipt, Briefcase, Printer 
} from 'lucide-react';

interface CompanyManagementProps {
    jobs: Job[];
    crew: CrewMember[];
    settings: AppSettings | null;
}

export const CompanyManagement: React.FC<CompanyManagementProps> = ({ jobs, crew: initialCrew, settings }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'JOBS_ANALYSIS' | 'COST_CENTERS' | 'PERSONNEL'>('DASHBOARD');
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [f24Payments, setF24Payments] = useState<F24Payment[]>([]);
    const [crew, setCrew] = useState<CrewMember[]>(initialCrew);
    
    // Cost Center Edit State
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [editingCost, setEditingCost] = useState<CostCenter | null>(null);

    // F24 Edit State
    const [isF24ModalOpen, setIsF24ModalOpen] = useState(false);
    const [newF24, setNewF24] = useState<Partial<F24Payment>>({ year: new Date().getFullYear(), month: new Date().getMonth() });

    // Personnel Edit State
    const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
    const [tempNetCost, setTempNetCost] = useState(0);
    const [tempTaxCost, setTempTaxCost] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            const [cc, f24] = await Promise.all([api.getCostCenters(), api.getF24Payments()]);
            setCostCenters(cc);
            setF24Payments(f24);
        };
        loadData();
    }, []);

    // --- LOGIC: JOB PROFITABILITY ---
    const analyzedJobs = useMemo(() => {
        return jobs.filter(j => j.status !== JobStatus.CANCELLED).map(job => {
            const days = Math.max(1, Math.ceil((new Date(job.endDate).getTime() - new Date(job.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
            
            // Costs
            const freelanceCost = job.assignedCrew.reduce((acc, cid) => {
                const c = crew.find(x => x.id === cid);
                return acc + (c && c.type === CrewType.FREELANCE ? c.dailyRate * days : 0);
            }, 0);

            // Internal "Figurative" Cost (for job profitability, not balance sheet)
            const internalCost = job.assignedCrew.reduce((acc, cid) => {
                const c = crew.find(x => x.id === cid);
                return acc + (c && c.type === CrewType.INTERNAL ? (settings?.defaultDailyIndemnity || 50) * days : 0); // Using per diem as base or distinct rate if added
            }, 0);
            
            const materials = job.materialList.reduce((acc, m) => acc + (m.isExternal ? (m.cost || 0) * m.quantity : 0), 0);
            const vehicles = job.vehicles.reduce((acc, v) => acc + (v.isRental ? (v.cost || 0) : 0), 0);
            
            const expenses = crew.reduce((acc, c) => {
                 return acc + (c.expenses || []).filter(e => e.jobId === job.id && (e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED))
                    .reduce((sum, e) => sum + e.amount, 0);
            }, 0);

            const ztl = (jobs.find(j => j.id === job.id)?.locationId && 
                         costCenters /* Using this just to verify logic, normally check location isZtl */) ? 0 : 0; // Simplified for now

            const extra = (job.extraCosts || []).reduce((acc, e) => acc + e.amount, 0);

            const totalCosts = freelanceCost + internalCost + materials + vehicles + expenses + extra;
            const revenue = job.invoiceAmount || 0;
            const margin = revenue - totalCosts;
            const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

            return { ...job, totalCosts, revenue, margin, marginPercent, freelanceCost, materials };
        }).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [jobs, crew, settings, costCenters]);

    // --- LOGIC: DASHBOARD TOTALS ---
    const dashboardStats = useMemo(() => {
        const totalRevenue = analyzedJobs.reduce((acc, j) => acc + j.revenue, 0);
        const totalJobCosts = analyzedJobs.reduce((acc, j) => acc + j.totalCosts, 0);
        
        // Fixed Costs (Annual Projection based on Cost Centers)
        const fixedCosts = costCenters.reduce((acc, cc) => {
            if (cc.periodicity === 'Mensile') return acc + (cc.amount * 12);
            if (cc.periodicity === 'Trimestrale') return acc + (cc.amount * 4);
            return acc + cc.amount; 
        }, 0);

        // Personnel Costs (Annual Projection)
        const personnelAnnual = crew.filter(c => c.type === CrewType.INTERNAL).reduce((acc, c) => {
            return acc + ((c.monthlyNetCost || 0) + (c.monthlyTaxCost || 0)) * 12; // Approximation excluding 13th/14th for demo
        }, 0);

        const totalAnnualCosts = totalJobCosts + fixedCosts + personnelAnnual;
        const netProfit = totalRevenue - totalAnnualCosts;

        return { totalRevenue, totalJobCosts, fixedCosts, personnelAnnual, totalAnnualCosts, netProfit };
    }, [analyzedJobs, costCenters, crew]);

    // --- CHARTS DATA ---
    const monthlyData = useMemo(() => {
        const data: Record<string, {name: string, ricavi: number, costi: number}> = {};
        const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
        
        months.forEach(m => data[m] = { name: m, ricavi: 0, costi: 0 });

        analyzedJobs.forEach(j => {
            const mIndex = new Date(j.startDate).getMonth();
            const mName = months[mIndex];
            if(data[mName]) {
                data[mName].ricavi += j.revenue;
                data[mName].costi += j.totalCosts;
            }
        });

        // Add fixed monthly costs
        const monthlyFixed = (dashboardStats.fixedCosts + dashboardStats.personnelAnnual) / 12;
        Object.values(data).forEach(d => d.costi += monthlyFixed);

        return Object.values(data);
    }, [analyzedJobs, dashboardStats]);

    const costDistributionData = [
        { name: 'Tecnici Freelance', value: analyzedJobs.reduce((acc, j) => acc + j.freelanceCost, 0) },
        { name: 'Materiali & Noleggi', value: analyzedJobs.reduce((acc, j) => acc + j.materials, 0) },
        { name: 'Personale Interno', value: dashboardStats.personnelAnnual },
        { name: 'Costi Fissi (Sede/Sw)', value: dashboardStats.fixedCosts },
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // --- HANDLERS ---
    const handleSaveCostCenter = async () => {
        if (!editingCost) return;
        if (editingCost.id) {
            await api.updateCostCenter(editingCost);
            setCostCenters(prev => prev.map(c => c.id === editingCost.id ? editingCost : c));
        } else {
            const newC = await api.createCostCenter(editingCost);
            setCostCenters(prev => [...prev, newC]);
        }
        setIsCostModalOpen(false); setEditingCost(null);
    };

    const handleDeleteCostCenter = async (id: string) => {
        if(!confirm("Eliminare voce di costo?")) return;
        await api.deleteCostCenter(id);
        setCostCenters(prev => prev.filter(c => c.id !== id));
    };

    const handleSaveF24 = async () => {
        if (!newF24.amount || !newF24.paymentDate) return;
        const saved = await api.createF24Payment(newF24 as F24Payment);
        setF24Payments(prev => [...prev, saved]);
        setIsF24ModalOpen(false); setNewF24({ year: new Date().getFullYear(), month: new Date().getMonth() });
    };

    const handleUpdateCrewCost = async (c: CrewMember) => {
        const updated = { ...c, monthlyNetCost: tempNetCost, monthlyTaxCost: tempTaxCost };
        await api.updateCrewMember(updated);
        setCrew(prev => prev.map(x => x.id === c.id ? updated : x));
        setEditingCrewId(null);
    };

    const handlePrint = () => window.print();

    // Check expiring costs (within 30 days)
    const expiringCosts = costCenters.filter(c => {
        if(!c.expiryDate) return false;
        const days = (new Date(c.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
    });

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* HEADER & NAV */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Building2 className="text-glr-accent"/> Gestione Azienda
                </h2>
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'DASHBOARD' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('JOBS_ANALYSIS')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'JOBS_ANALYSIS' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Commesse</button>
                    <button onClick={() => setActiveTab('COST_CENTERS')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'COST_CENTERS' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Centri di Costo</button>
                    <button onClick={() => setActiveTab('PERSONNEL')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === 'PERSONNEL' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Personale</button>
                </div>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-glr-800 p-5 rounded-xl border border-glr-700 shadow-lg">
                            <p className="text-gray-400 text-xs uppercase font-bold flex items-center gap-2"><TrendingUp size={14}/> Ricavi Totali (Commesse)</p>
                            <p className="text-3xl font-bold text-white mt-2">€ {dashboardStats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-glr-800 p-5 rounded-xl border border-glr-700 shadow-lg">
                            <p className="text-gray-400 text-xs uppercase font-bold flex items-center gap-2"><TrendingDown size={14}/> Costi Totali (Anno)</p>
                            <p className="text-3xl font-bold text-red-400 mt-2">€ {dashboardStats.totalAnnualCosts.toLocaleString()}</p>
                        </div>
                        <div className="bg-glr-800 p-5 rounded-xl border border-glr-700 shadow-lg">
                             <p className="text-gray-400 text-xs uppercase font-bold flex items-center gap-2"><Wallet size={14}/> Utile Netto Stimato</p>
                             <p className={`text-3xl font-bold mt-2 ${dashboardStats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>€ {dashboardStats.netProfit.toLocaleString()}</p>
                        </div>
                        <div className="bg-glr-800 p-5 rounded-xl border border-glr-700 shadow-lg">
                             <p className="text-gray-400 text-xs uppercase font-bold flex items-center gap-2"><Users size={14}/> Costo Personale (Anno)</p>
                             <p className="text-3xl font-bold text-blue-400 mt-2">€ {dashboardStats.personnelAnnual.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* EXPIRING ALERTS */}
                    {expiringCosts.length > 0 && (
                        <div className="bg-orange-900/20 border border-orange-800 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle size={24} className="text-orange-500 mt-1"/>
                            <div>
                                <h4 className="text-orange-400 font-bold">Scadenze Imminenti (30gg)</h4>
                                <ul className="mt-1 space-y-1">
                                    {expiringCosts.map(c => (
                                        <li key={c.id} className="text-sm text-gray-300">
                                            <b>{c.description}</b> scade il {new Date(c.expiryDate).toLocaleDateString()} (€ {c.amount})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 flex flex-col">
                            <h3 className="text-white font-bold mb-4 text-sm">Andamento Mensile (Ricavi vs Costi)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                                    <YAxis stroke="#94a3b8" fontSize={12}/>
                                    <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}}/>
                                    <Legend />
                                    <Bar dataKey="ricavi" fill="#22c55e" name="Ricavi" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="costi" fill="#ef4444" name="Costi" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                         <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 flex flex-col">
                            <h3 className="text-white font-bold mb-4 text-sm">Ripartizione Costi Annuali</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={costDistributionData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {costDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: JOBS ANALYSIS */}
            {activeTab === 'JOBS_ANALYSIS' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2 no-print">
                        <h3 className="text-lg font-bold text-white">Analisi Marginalità Commesse</h3>
                        <button onClick={handlePrint} className="flex items-center gap-2 bg-glr-900 border border-glr-600 px-3 py-1.5 rounded text-sm hover:bg-glr-800 text-gray-300"><Printer size={16}/> Stampa Report</button>
                    </div>
                    <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-lg print-only">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-glr-900 text-gray-400 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Commessa</th>
                                    <th className="p-4">Periodo</th>
                                    <th className="p-4 text-right">Ricavo Totale</th>
                                    <th className="p-4 text-right">Costi Diretti</th>
                                    <th className="p-4 text-right">Utile</th>
                                    <th className="p-4 text-center">Margine %</th>
                                    <th className="p-4 text-center">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glr-700">
                                {analyzedJobs.map(job => (
                                    <tr key={job.id} className="hover:bg-glr-700/50">
                                        <td className="p-4 font-bold text-white">
                                            {job.title}
                                            <div className="text-[10px] text-gray-500 font-normal">{job.client}</div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs">
                                            {new Date(job.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">€ {job.revenue.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono text-red-300">€ {job.totalCosts.toLocaleString()}</td>
                                        <td className={`p-4 text-right font-mono font-bold ${job.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            € {job.margin.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center font-bold text-gray-300">{job.marginPercent.toFixed(1)}%</td>
                                        <td className="p-4 text-center">
                                            <span className={`w-3 h-3 rounded-full inline-block ${job.marginPercent > 30 ? 'bg-green-500' : job.marginPercent > 10 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: COST CENTERS */}
            {activeTab === 'COST_CENTERS' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center no-print">
                        <h3 className="text-lg font-bold text-white">Centri di Costo (Fissi & Ricorrenti)</h3>
                        <button onClick={() => { 
                            setEditingCost({ id: '', category: 'Altro', description: '', amount: 0, periodicity: 'Mensile', expiryDate: '', supplier: '', autoRenew: false }); 
                            setIsCostModalOpen(true); 
                        }} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-400"><Plus size={18}/> Aggiungi Costo</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {costCenters.map(cc => {
                            const isExpired = cc.expiryDate && new Date(cc.expiryDate) < new Date();
                            const isExpiring = cc.expiryDate && !isExpired && (new Date(cc.expiryDate).getTime() - new Date().getTime() < 2592000000); // 30 days
                            
                            return (
                                <div key={cc.id} className={`bg-glr-800 rounded-xl border p-5 relative group transition-all ${isExpired ? 'border-red-600 opacity-80' : isExpiring ? 'border-orange-500' : 'border-glr-700 hover:border-glr-500'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs bg-glr-900 px-2 py-1 rounded border border-glr-700 text-gray-300 uppercase">{cc.category}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCost(cc); setIsCostModalOpen(true); }} className="text-gray-400 hover:text-white"><Edit3 size={16}/></button>
                                            <button onClick={() => handleDeleteCostCenter(cc.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-white text-lg mb-1">{cc.description}</h4>
                                    <p className="text-sm text-gray-400 mb-4">{cc.supplier}</p>
                                    
                                    <div className="flex justify-between items-end border-t border-glr-700 pt-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Importo</p>
                                            <p className="text-xl font-bold text-white">€ {cc.amount}</p>
                                            <p className="text-[10px] text-gray-400">{cc.periodicity}</p>
                                        </div>
                                        <div className="text-right">
                                            {cc.expiryDate && (
                                                <>
                                                    <p className="text-xs text-gray-500 uppercase">Scadenza</p>
                                                    <p className={`font-bold ${isExpired ? 'text-red-500' : isExpiring ? 'text-orange-500' : 'text-white'}`}>{new Date(cc.expiryDate).toLocaleDateString()}</p>
                                                </>
                                            )}
                                            {cc.autoRenew && <span className="text-[10px] text-green-400 flex items-center gap-1 justify-end mt-1"><CheckCircle size={10}/> Rinnovo Auto</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB: PERSONNEL */}
            {activeTab === 'PERSONNEL' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* LEFT: STAFF LIST */}
                    <div className="lg:col-span-2 bg-glr-800 rounded-xl border border-glr-700 overflow-hidden">
                        <div className="p-4 bg-glr-900 border-b border-glr-700">
                             <h3 className="font-bold text-white flex items-center gap-2"><Users size={18}/> Costi Personale Interno</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-glr-900/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Ruolo</th>
                                    <th className="p-4 text-right">Netto Mensile</th>
                                    <th className="p-4 text-right">Contributi/Tasse</th>
                                    <th className="p-4 text-right">Costo Totale</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glr-700">
                                {crew.filter(c => c.type === CrewType.INTERNAL).map(c => (
                                    <tr key={c.id}>
                                        <td className="p-4 font-bold text-white">{c.name}</td>
                                        <td className="p-4 text-gray-400">{c.roles[0]}</td>
                                        {editingCrewId === c.id ? (
                                            <>
                                                <td className="p-4 text-right"><input type="number" value={tempNetCost} onChange={e => setTempNetCost(parseFloat(e.target.value))} className="bg-glr-900 border border-glr-600 w-24 rounded px-2 py-1 text-white text-right"/></td>
                                                <td className="p-4 text-right"><input type="number" value={tempTaxCost} onChange={e => setTempTaxCost(parseFloat(e.target.value))} className="bg-glr-900 border border-glr-600 w-24 rounded px-2 py-1 text-white text-right"/></td>
                                                <td className="p-4 text-right font-bold text-white">€ {(tempNetCost + tempTaxCost).toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleUpdateCrewCost(c)} className="bg-green-600 p-1 rounded hover:bg-green-500"><CheckCircle size={16} text-white/></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 text-right text-gray-300">€ {(c.monthlyNetCost || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right text-gray-300">€ {(c.monthlyTaxCost || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right font-bold text-white">€ {((c.monthlyNetCost||0) + (c.monthlyTaxCost||0)).toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => { setEditingCrewId(c.id); setTempNetCost(c.monthlyNetCost||0); setTempTaxCost(c.monthlyTaxCost||0); }} className="text-gray-500 hover:text-white"><Edit3 size={16}/></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT: F24 PAYMENTS */}
                    <div className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col">
                        <div className="p-4 bg-glr-900 border-b border-glr-700 flex justify-between items-center">
                             <h3 className="font-bold text-white flex items-center gap-2"><Receipt size={18}/> Pagamenti F24</h3>
                             <button onClick={() => setIsF24ModalOpen(true)} className="bg-glr-700 p-1.5 rounded hover:bg-white hover:text-glr-900 text-white transition-colors"><Plus size={16}/></button>
                        </div>
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px]">
                            {f24Payments.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(f => (
                                <div key={f.id} className="bg-glr-900/50 p-3 rounded border border-glr-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-white">F24 {f.month}/{f.year}</p>
                                        <p className="text-xs text-gray-400">Pagato il {new Date(f.paymentDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-mono font-bold text-white">€ {f.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {isCostModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md shadow-2xl animate-fade-in p-6">
                        <h3 className="text-lg font-bold text-white mb-4">{editingCost?.id ? 'Modifica Costo' : 'Nuovo Centro di Costo'}</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-400 block mb-1">Descrizione</label><input type="text" value={editingCost?.description} onChange={e => setEditingCost(prev => prev ? {...prev, description: e.target.value} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400 block mb-1">Categoria</label><select value={editingCost?.category} onChange={e => setEditingCost(prev => prev ? {...prev, category: e.target.value as any} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white text-sm"><option>Affitto</option><option>Leasing</option><option>Software</option><option>Assicurazione</option><option>Telefonia</option><option>Utenze</option><option>Altro</option></select></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Periodicità</label><select value={editingCost?.periodicity} onChange={e => setEditingCost(prev => prev ? {...prev, periodicity: e.target.value as any} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white text-sm"><option>Mensile</option><option>Annuale</option><option>Trimestrale</option><option>Una Tantum</option></select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400 block mb-1">Importo (€)</label><input type="number" value={editingCost?.amount} onChange={e => setEditingCost(prev => prev ? {...prev, amount: parseFloat(e.target.value)} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Scadenza</label><input type="date" value={editingCost?.expiryDate} onChange={e => setEditingCost(prev => prev ? {...prev, expiryDate: e.target.value} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                            </div>
                            <div><label className="text-xs text-gray-400 block mb-1">Fornitore</label><input type="text" value={editingCost?.supplier} onChange={e => setEditingCost(prev => prev ? {...prev, supplier: e.target.value} : null)} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingCost?.autoRenew} onChange={e => setEditingCost(prev => prev ? {...prev, autoRenew: e.target.checked} : null)} /><span className="text-sm text-gray-300">Rinnovo Automatico</span></label>
                            
                            <div className="flex gap-2 justify-end pt-4">
                                <button onClick={() => setIsCostModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Annulla</button>
                                <button onClick={handleSaveCostCenter} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded">Salva</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {isF24ModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-sm shadow-2xl animate-fade-in p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Registra Pagamento F24</h3>
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-400 block mb-1">Mese</label><input type="number" min="1" max="12" value={newF24.month} onChange={e => setNewF24({...newF24, month: parseInt(e.target.value)})} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                                <div><label className="text-xs text-gray-400 block mb-1">Anno</label><input type="number" value={newF24.year} onChange={e => setNewF24({...newF24, year: parseInt(e.target.value)})} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                             </div>
                             <div><label className="text-xs text-gray-400 block mb-1">Importo (€)</label><input type="number" value={newF24.amount || ''} onChange={e => setNewF24({...newF24, amount: parseFloat(e.target.value)})} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                             <div><label className="text-xs text-gray-400 block mb-1">Data Pagamento</label><input type="date" value={newF24.paymentDate || ''} onChange={e => setNewF24({...newF24, paymentDate: e.target.value})} className="w-full bg-glr-900 border-glr-700 rounded p-2 text-white"/></div>
                             <div className="flex gap-2 justify-end pt-4">
                                <button onClick={() => setIsF24ModalOpen(false)} className="text-gray-400 hover:text-white px-4 py-2">Annulla</button>
                                <button onClick={handleSaveF24} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded">Salva</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};