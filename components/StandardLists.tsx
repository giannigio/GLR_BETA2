
import React, { useState, useMemo, useEffect } from 'react';
import { StandardMaterialList, MaterialItem, InventoryItem, Job, JobStatus } from '../types';
import { Plus, Edit3, Trash2, Save, X, Search, Minus, Package, Tag, CheckSquare, Layers, Box, ChevronRight, AlertCircle, ChevronLeft, Truck, ArrowRightCircle, ArrowLeftCircle, CheckCircle, RotateCcw, Copy, Printer, Archive, FileText } from 'lucide-react';

interface StandardListsProps {
    lists: StandardMaterialList[];
    inventory: InventoryItem[];
    onAddList: (list: StandardMaterialList) => void;
    onUpdateList: (list: StandardMaterialList) => void;
    onDeleteList: (id: string) => void;
    // New Props for Operational Mode
    jobs?: Job[];
    onUpdateJob?: (job: Job) => void;
}

const ITEMS_PER_PAGE = 8;

export const StandardLists: React.FC<StandardListsProps> = ({ lists, inventory, onAddList, onUpdateList, onDeleteList, jobs = [], onUpdateJob }) => {
    // TABS: 'KITS' (Templates) vs 'OPERATIONS' (Active Jobs)
    const [mainTab, setMainTab] = useState<'KITS' | 'OPERATIONS'>('KITS');

    // --- KITS STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [activeList, setActiveList] = useState<StandardMaterialList | null>(null);
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // --- OPERATIONS STATE ---
    const [opsSearchTerm, setOpsSearchTerm] = useState('');
    const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
    const [activeJobForCheck, setActiveJobForCheck] = useState<Job | null>(null);
    const [checkMode, setCheckMode] = useState<'LOAD_IN' | 'LOAD_OUT'>('LOAD_IN');
    
    // --- PRINT PREVIEW STATE ---
    const [printingJob, setPrintingJob] = useState<Job | null>(null);

    // UI Mode State (Inside Kit Editor)
    const [addMode, setAddMode] = useState<'BROWSE' | 'MANUAL'>('BROWSE');

    // Filter State (Inside Kit Editor)
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Manual Add State (Inside Kit Editor)
    const [manualName, setManualName] = useState('');
    const [manualCategory, setManualCategory] = useState('Audio');
    const [manualType, setManualType] = useState(''); 
    const [manualQty, setManualQty] = useState(1);

    // --- KIT HANDLERS ---
    const handleNew = () => {
        setActiveList({ id: '', name: 'Nuovo Kit', labels: [], items: [] });
        setIsEditing(true);
        setAddMode('BROWSE');
    };

    const handleDuplicate = (list: StandardMaterialList) => {
        const newList: StandardMaterialList = {
            ...list,
            id: Date.now().toString(),
            name: `${list.name} (Copia)`
        };
        onAddList(newList);
    };

    const handleSave = () => {
        if (!activeList) return;
        if (activeList.id) onUpdateList(activeList);
        else onAddList({ ...activeList, id: Date.now().toString() });
        setIsEditing(false); setActiveList(null);
    };

    const toggleLabel = (label: string) => {
        if (!activeList) return;
        const current = activeList.labels || [];
        const updated = current.includes(label) ? current.filter(l => l !== label) : [...current, label];
        setActiveList({ ...activeList, labels: updated });
    };

    // --- OPERATIONS HANDLERS ---
    const openCheckModal = (job: Job) => {
        setActiveJobForCheck(job);
        // Default to Load IN unless already loaded
        if (job.logisticsStatus === 'LOADED' || job.logisticsStatus === 'ON_SITE') {
            setCheckMode('LOAD_OUT');
        } else {
            setCheckMode('LOAD_IN');
        }
        setIsCheckModalOpen(true);
    };

    const toggleItemCheck = (itemId: string) => {
        if (!activeJobForCheck || !onUpdateJob) return;
        
        const updatedItems = activeJobForCheck.materialList.map(item => {
            if (item.id === itemId) {
                if (checkMode === 'LOAD_IN') {
                    return { ...item, loaded: !item.loaded };
                } else {
                    return { ...item, returned: !item.returned };
                }
            }
            return item;
        });

        // Calculate progress to auto-update status
        const total = updatedItems.length;
        const loadedCount = updatedItems.filter(i => i.loaded).length;
        const returnedCount = updatedItems.filter(i => i.returned).length;

        let newStatus = activeJobForCheck.logisticsStatus;
        if (checkMode === 'LOAD_IN') {
            if (loadedCount === 0) newStatus = 'PREPARATION';
            else if (loadedCount < total) newStatus = 'PREPARATION'; // Still preparing
            else newStatus = 'LOADED';
        } else {
            if (returnedCount === total) newStatus = 'RETURNED';
            // else remain as is
        }

        const updatedJob = { ...activeJobForCheck, materialList: updatedItems, logisticsStatus: newStatus };
        setActiveJobForCheck(updatedJob);
        onUpdateJob(updatedJob);
    };

    const handleFinishCheck = () => {
        setIsCheckModalOpen(false);
        setActiveJobForCheck(null);
    };

    const handleArchiveLogistics = (job: Job) => {
        if (!onUpdateJob) return;
        if (confirm("Sei sicuro di voler archiviare la logistica per questo lavoro? Scomparirà dalla lista operativa.")) {
            onUpdateJob({ ...job, logisticsStatus: 'CHECKED' });
        }
    };

    // --- LOGICA LISTE FILTRATE (KITS) ---
    const filteredLists = useMemo(() => {
        const s = listSearchTerm.toLowerCase();
        return lists.filter(l => 
            l.name.toLowerCase().includes(s) || 
            (l.labels || []).some(label => label.toLowerCase().includes(s))
        );
    }, [lists, listSearchTerm]);

    const totalPages = Math.ceil(filteredLists.length / ITEMS_PER_PAGE);
    const currentLists = filteredLists.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- LOGICA JOBS (OPERATIONS) ---
    const activeOpsJobs = useMemo(() => {
        const s = opsSearchTerm.toLowerCase();
        return jobs.filter(j => 
            j.status !== JobStatus.CANCELLED && 
            j.status !== JobStatus.COMPLETED &&
            j.logisticsStatus !== 'CHECKED' && // Filter out archived logistics
            (j.title.toLowerCase().includes(s) || j.location.toLowerCase().includes(s))
        ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [jobs, opsSearchTerm]);

    // Reset pagination when search changes
    React.useEffect(() => { setCurrentPage(1); }, [listSearchTerm]);

    // --- KIT EDITOR HELPERS (Inventory Filters) ---
    const availableCategories = useMemo(() => ['ALL', ...Array.from(new Set(inventory.map(i => i.category))).sort()], [inventory]);
    
    const availableTypes = useMemo(() => {
        let items = inventory;
        if (categoryFilter !== 'ALL') items = items.filter(i => i.category === categoryFilter);
        const types = new Set(items.map(i => i.type).filter(Boolean) as string[]);
        return ['ALL', ...Array.from(types).sort()];
    }, [inventory, categoryFilter]);

    const filteredInventory = useMemo(() => {
        return inventory.filter(i => {
            const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (i.type && i.type.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchCat = categoryFilter === 'ALL' || i.category === categoryFilter;
            const matchType = typeFilter === 'ALL' || i.type === typeFilter;
            return matchSearch && matchCat && matchType;
        });
    }, [inventory, searchTerm, categoryFilter, typeFilter]);

    const addItemFromInventory = (invItem: InventoryItem) => {
        if (!activeList) return;
        const existing = activeList.items.find(i => i.inventoryId === invItem.id);
        if (existing) {
            setActiveList({ ...activeList, items: activeList.items.map(i => i.inventoryId === invItem.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
            const newItem: MaterialItem = { id: Date.now().toString() + Math.random(), inventoryId: invItem.id, name: invItem.name, category: invItem.category, type: invItem.type, quantity: 1, isExternal: false };
            setActiveList({ ...activeList, items: [...activeList.items, newItem] });
        }
    };

    const addManualItem = () => {
        if (!activeList || !manualName) return;
        const newItem: MaterialItem = { id: Date.now().toString() + Math.random(), name: manualName, category: manualCategory, type: manualType, quantity: manualQty, isExternal: true };
        setActiveList({ ...activeList, items: [...activeList.items, newItem] });
        setManualName(''); setManualType(''); setManualQty(1);
    };

    const updateQty = (itemId: string, delta: number) => {
        if (!activeList) return;
        setActiveList({ ...activeList, items: activeList.items.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i) });
    };

    const removeItem = (itemId: string) => {
        if (!activeList) return;
        setActiveList({ ...activeList, items: activeList.items.filter(i => i.id !== itemId) });
    };

    const getQtyInList = (invId: string) => activeList?.items.find(i => i.inventoryId === invId)?.quantity || 0;

    // --- RENDER KIT EDITOR ---
    if (isEditing && activeList) {
        return (
            <div className="bg-glr-800 rounded-xl border border-glr-700 p-6 h-[calc(100vh-140px)] flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-4 border-b border-glr-700 pb-4 shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Box className="text-glr-accent"/> {activeList.id ? 'Modifica Kit' : 'Nuovo Kit'}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded transition-colors">Annulla</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400 flex items-center gap-2 transition-colors"><Save size={18}/> Salva</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0 bg-glr-900/30 p-4 rounded-lg border border-glr-700/50">
                    <div className="md:col-span-2 space-y-4">
                        <div><label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Nome Lista / Kit</label><input type="text" value={activeList.name} onChange={e => setActiveList({...activeList, name: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-bold focus:border-glr-accent outline-none" placeholder="Es. Kit Regia Video Base"/></div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 font-bold uppercase">Etichette Reparto</label>
                        <div className="flex gap-2 flex-wrap">
                            {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Rete'].map(lbl => (
                                <button key={lbl} onClick={() => toggleLabel(lbl)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${activeList.labels?.includes(lbl) ? 'bg-glr-accent text-glr-900 font-bold ring-2 ring-glr-accent ring-offset-2 ring-offset-glr-900' : 'text-gray-400 hover:text-white bg-glr-900 border border-glr-700'}`}>{activeList.labels?.includes(lbl) && <CheckSquare size={12}/>}{lbl}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
                    <div className="w-full md:w-1/2 flex flex-col gap-4 border-r border-glr-700 md:pr-4 overflow-hidden">
                        <div className="flex bg-glr-900 p-1 rounded-lg shrink-0">
                             <button onClick={() => setAddMode('BROWSE')} className={`flex-1 py-2 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${addMode === 'BROWSE' ? 'bg-glr-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}><Search size={16}/> Sfoglia Magazzino</button>
                             <button onClick={() => setAddMode('MANUAL')} className={`flex-1 py-2 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${addMode === 'MANUAL' ? 'bg-glr-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}><Edit3 size={16}/> Aggiunta Manuale</button>
                        </div>
                        {addMode === 'BROWSE' ? (
                            <div className="flex flex-col flex-1 overflow-hidden gap-3">
                                <div className="flex gap-2 shrink-0">
                                    <div className="w-1/2"><label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">Categoria</label><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-xs p-2 outline-none focus:border-glr-accent">{availableCategories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'Tutte' : c}</option>)}</select></div>
                                    <div className="w-1/2"><label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">Tipologia</label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded text-white text-xs p-2 outline-none focus:border-glr-accent">{availableTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'Tutte' : t}</option>)}</select></div>
                                </div>
                                <div className="relative shrink-0"><Search size={16} className="absolute left-3 top-2.5 text-gray-400"/><input type="text" placeholder="Cerca articolo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"/></div>
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {filteredInventory.map(item => {
                                        const qtyInList = getQtyInList(item.id);
                                        return (
                                            <div key={item.id} onClick={() => addItemFromInventory(item)} className="bg-glr-900 p-3 rounded border border-glr-700 cursor-pointer hover:border-glr-500 hover:bg-glr-800 transition-all group flex justify-between items-center relative">
                                                <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white truncate group-hover:text-glr-accent">{item.name}</span>{qtyInList > 0 && <span className="text-[10px] bg-glr-accent text-glr-900 px-1.5 rounded font-bold">In Kit: {qtyInList}</span>}</div><div className="flex gap-2 text-[10px] text-gray-500"><span className="bg-glr-950 px-1.5 py-0.5 rounded border border-glr-800">{item.category}</span>{item.type && <span className="opacity-70">• {item.type}</span>}</div></div>
                                                <button className="bg-glr-950 p-2 rounded-full text-green-500 hover:bg-green-500 hover:text-white transition-colors border border-glr-800 group-hover:border-green-500"><Plus size={16}/></button>
                                            </div>
                                        )
                                    })}
                                    {filteredInventory.length === 0 && <div className="text-center text-gray-500 py-10 italic">Nessun articolo trovato con questi filtri.</div>}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl space-y-4">
                                <div><label className="block text-xs text-gray-400 mb-1">Nome Materiale</label><input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm focus:border-glr-accent outline-none" placeholder="Es. Materiale Extra"/></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-400 mb-1">Categoria</label><select value={manualCategory} onChange={e => setManualCategory(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded text-white text-sm p-2"><option>Audio</option><option>Video</option><option>Luci</option><option>Cavi</option><option>Strutture</option><option>Altro</option></select></div><div><label className="block text-xs text-gray-400 mb-1">Tipologia</label><input type="text" value={manualType} onChange={e => setManualType(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Consumabile"/></div></div>
                                <div><label className="block text-xs text-gray-400 mb-1">Quantità</label><input type="number" min="1" value={manualQty} onChange={e => setManualQty(parseInt(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/></div>
                                <button onClick={addManualItem} disabled={!manualName} className="w-full bg-glr-700 hover:bg-white hover:text-glr-900 text-white py-2 rounded font-bold transition-colors disabled:opacity-50 mt-2">Aggiungi Manuale</button>
                                <div className="text-[10px] text-amber-500 bg-amber-900/10 p-2 rounded border border-amber-900/30 flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5"/>Nota: Gli articoli manuali non sono collegati al magazzino.</div>
                            </div>
                        )}
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col bg-glr-900 rounded-xl border border-glr-700 overflow-hidden">
                        <div className="bg-glr-950 p-3 border-b border-glr-800 flex justify-between items-center"><h4 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2"><Layers size={14}/> Contenuto Kit</h4><span className="bg-glr-800 text-glr-accent px-2 py-0.5 rounded text-xs font-mono">{activeList.items.reduce((acc, i) => acc + i.quantity, 0)} Pz.</span></div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {activeList.items.length === 0 && <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50"><Package size={48} className="mb-2 stroke-1"/><p className="text-sm">Il kit è vuoto</p></div>}
                            {activeList.items.map((item, idx) => (
                                <div key={item.id} className="bg-glr-800 hover:bg-glr-700/80 p-2 rounded flex items-center justify-between border border-transparent hover:border-glr-600 transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden"><span className="text-xs text-gray-500 w-5 text-center">{idx + 1}</span><div className="min-w-0"><p className="text-sm font-bold text-white truncate">{item.name}</p><span className="text-[10px] text-gray-400">{item.category} {item.type ? `• ${item.type}` : ''} {item.isExternal && <span className="text-amber-500 ml-1 font-bold">(MAN)</span>}</span></div></div>
                                    <div className="flex items-center gap-1 bg-glr-900 rounded p-1"><button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-glr-700 rounded text-gray-400"><Minus size={12}/></button><span className="text-sm font-bold w-8 text-center text-white">{item.quantity}</span><button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-glr-700 rounded text-gray-400"><Plus size={12}/></button><div className="w-px h-4 bg-glr-700 mx-1"></div><button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-900/50 hover:text-red-400 text-gray-500 rounded transition-colors"><Trash2 size={12}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER PRINT PREVIEW (OPERATIONS) ---
    if (printingJob) {
        return (
            <div className="fixed inset-0 z-50 bg-white text-black overflow-y-auto print-only">
                <div className="p-8 max-w-4xl mx-auto min-h-screen">
                    {/* Controls (Hidden in Print) */}
                    <div className="flex justify-between items-center mb-8 no-print sticky top-0 bg-white/95 backdrop-blur py-4 border-b border-gray-200">
                        <button onClick={() => setPrintingJob(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-bold">Chiudi</button>
                        <button onClick={() => window.print()} className="px-6 py-2 bg-black text-white rounded font-bold flex items-center gap-2"><Printer size={18}/> Stampa</button>
                    </div>

                    {/* Header */}
                    <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight">Packing List</h1>
                            <p className="text-sm font-bold mt-1">{printingJob.title}</p>
                            <p className="text-sm text-gray-600">{printingJob.location}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p>Data Evento: {new Date(printingJob.startDate).toLocaleDateString()}</p>
                            <p className="mt-1 font-mono">Tot. Articoli: {printingJob.materialList.reduce((a,b) => a + b.quantity, 0)}</p>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-6">
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Altro'].map(cat => {
                            const items = printingJob.materialList.filter(i => i.category === cat);
                            if (items.length === 0) return null;
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
        );
    }

    // --- MAIN RENDER ---
    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            
            {/* CHECK MODAL (Tablet / Vertical Optimized) */}
            {isCheckModalOpen && activeJobForCheck && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-slide-up h-screen overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 bg-glr-900 border-b border-glr-700 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button onClick={handleFinishCheck} className="p-2 rounded-full bg-glr-800 text-white"><ChevronLeft size={24}/></button>
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight">{activeJobForCheck.title}</h2>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Check Materiale</p>
                            </div>
                        </div>
                        <div className="flex bg-glr-800 rounded p-1">
                            <button onClick={() => setCheckMode('LOAD_IN')} className={`px-4 py-2 rounded font-bold text-xs uppercase flex items-center gap-2 ${checkMode === 'LOAD_IN' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><ArrowRightCircle size={16}/> Load IN</button>
                            <button onClick={() => setCheckMode('LOAD_OUT')} className={`px-4 py-2 rounded font-bold text-xs uppercase flex items-center gap-2 ${checkMode === 'LOAD_OUT' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}><ArrowLeftCircle size={16}/> Load OUT</button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-shrink-0 bg-glr-800 p-4 border-b border-glr-700">
                        {(() => {
                            const items = activeJobForCheck.materialList || [];
                            const total = items.length;
                            const checked = items.filter(i => checkMode === 'LOAD_IN' ? i.loaded : i.returned).length;
                            const pct = total > 0 ? (checked / total) * 100 : 0;
                            const isComplete = total > 0 && checked === total;

                            return (
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase">
                                        <span>{checkMode === 'LOAD_IN' ? 'Materiale Caricato' : 'Materiale Rientrato'}</span>
                                        <span className={isComplete ? 'text-green-400' : 'text-white'}>{checked} / {total}</span>
                                    </div>
                                    <div className="h-3 bg-glr-900 rounded-full overflow-hidden border border-glr-700">
                                        <div className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500' : checkMode === 'LOAD_IN' ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                        {activeJobForCheck.materialList.length === 0 && <p className="text-center text-gray-500 mt-10">Nessun materiale in lista.</p>}
                        
                        {/* Group by Category for easier checking */}
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Altro'].map(cat => {
                            const catItems = activeJobForCheck.materialList.filter(i => i.category === cat);
                            if (catItems.length === 0) return null;

                            return (
                                <div key={cat} className="mb-6">
                                    <h3 className="text-glr-accent text-xs font-bold uppercase mb-2 sticky top-0 bg-black/90 py-2 z-10 border-b border-glr-800">{cat}</h3>
                                    <div className="space-y-2">
                                        {catItems.map(item => {
                                            const isChecked = checkMode === 'LOAD_IN' ? item.loaded : item.returned;
                                            
                                            return (
                                                <button 
                                                    key={item.id} 
                                                    onClick={() => toggleItemCheck(item.id)}
                                                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 active:scale-95 ${isChecked ? 'bg-green-900/30 border-green-600' : 'bg-glr-800 border-glr-700'}`}
                                                >
                                                    <div className="text-left">
                                                        <p className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-gray-300'}`}>{item.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.type} {item.isExternal && '(Ext)'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-mono text-lg font-bold text-gray-400">x{item.quantity}</span>
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-transparent'}`}>
                                                            <CheckCircle size={20} fill="currentColor" />
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 p-4 bg-glr-900 border-t border-glr-700 flex justify-between items-center">
                        <button onClick={handleFinishCheck} className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg uppercase shadow-lg hover:bg-gray-200">
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center shrink-0 gap-4 no-print">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Package/> Magazzino & Liste</h2>
                
                {/* Mode Switcher */}
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setMainTab('KITS')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${mainTab === 'KITS' ? 'bg-glr-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Kit Predefiniti</button>
                    <button onClick={() => setMainTab('OPERATIONS')} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${mainTab === 'OPERATIONS' ? 'bg-glr-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Liste Operative</button>
                </div>
            </div>

            {/* --- OPERATIONS TAB (WAREHOUSE FLOW) --- */}
            {mainTab === 'OPERATIONS' && (
                <div className="flex-1 flex flex-col gap-6 animate-fade-in no-print">
                    <div className="flex justify-between items-center bg-glr-800 p-4 rounded-xl border border-glr-700">
                        <div className="relative w-full md:w-64">
                            <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                            <input type="text" placeholder="Cerca lavoro..." value={opsSearchTerm} onChange={e => setOpsSearchTerm(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
                        {activeOpsJobs.map(job => {
                            const status = job.logisticsStatus || 'PREPARATION';
                            const itemCount = job.materialList.length;
                            const isReturned = status === 'RETURNED';
                            
                            return (
                                <div key={job.id} className="bg-glr-800 border border-glr-700 rounded-xl p-5 hover:border-glr-500 transition-all group flex flex-col shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase border 
                                            ${status === 'PREPARATION' ? 'bg-gray-700 text-gray-300 border-gray-600' : 
                                              status === 'LOADED' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 
                                              status === 'ON_SITE' ? 'bg-green-900/30 text-green-300 border-green-800' : 
                                              'bg-orange-900/30 text-orange-300 border-orange-800'}`}>
                                            {status === 'PREPARATION' ? 'In Preparazione' : status === 'LOADED' ? 'Caricato' : status === 'ON_SITE' ? 'In Evento' : 'Rientrato'}
                                        </span>
                                        <span className="text-xs text-gray-500">{new Date(job.startDate).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-white mb-1 truncate" title={job.title}>{job.title}</h3>
                                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1"><Truck size={12}/> {job.location}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-glr-700 flex items-center gap-2">
                                        <div className="flex-1 text-xs text-gray-400">
                                            <span className="block font-bold text-white">{itemCount} Articoli</span>
                                            {job.materialList.filter(i => i.isExternal).length > 0 && <span className="text-amber-500">{job.materialList.filter(i => i.isExternal).length} Noleggi Ext</span>}
                                        </div>
                                        
                                        <button onClick={() => setPrintingJob(job)} className="bg-glr-900 hover:bg-white hover:text-glr-900 text-gray-300 p-2 rounded border border-glr-600 transition-colors" title="Anteprima PDF">
                                            <FileText size={16}/>
                                        </button>

                                        {isReturned ? (
                                            <button onClick={() => handleArchiveLogistics(job)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold border border-green-500 flex items-center gap-2 transition-colors">
                                                <Archive size={14}/> Archivia
                                            </button>
                                        ) : (
                                            <button onClick={() => openCheckModal(job)} className="bg-glr-900 hover:bg-glr-700 text-white px-3 py-1.5 rounded text-xs font-bold border border-glr-600 flex items-center gap-2 transition-colors">
                                                <CheckSquare size={14}/> Check List
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {activeOpsJobs.length === 0 && <div className="col-span-full text-center text-gray-500 py-10 italic">Nessun lavoro attivo trovato.</div>}
                    </div>
                </div>
            )}

            {/* --- KITS TAB (TEMPLATES) --- */}
            {mainTab === 'KITS' && (
                <div className="flex-1 flex flex-col gap-6 animate-fade-in no-print">
                    <div className="flex justify-between items-center">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                            <input type="text" placeholder="Cerca Kit..." value={listSearchTerm} onChange={e => setListSearchTerm(e.target.value)} className="w-64 bg-glr-800 border border-glr-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"/>
                        </div>
                        <button onClick={handleNew} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"><Plus size={20}/> Nuovo Kit</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {currentLists.length === 0 && <div className="col-span-full text-center text-gray-500 py-20 bg-glr-800/30 rounded-xl border border-dashed border-glr-700">Nessun kit standard trovato.</div>}
                            {currentLists.map(list => (
                                <div key={list.id} className="bg-glr-800 border border-glr-700 rounded-xl p-5 hover:border-glr-accent transition-all group flex flex-col shadow-lg hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden h-64">
                                    <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-glr-800 via-glr-800 to-transparent pl-8">
                                        <button onClick={() => handleDuplicate(list)} className="text-gray-400 hover:text-white bg-glr-700 p-1.5 rounded-md hover:bg-glr-600 transition-colors" title="Duplica"><Copy size={16}/></button>
                                        <button onClick={() => { setActiveList(list); setIsEditing(true); setAddMode('BROWSE'); }} className="text-gray-400 hover:text-white bg-glr-700 p-1.5 rounded-md hover:bg-glr-600 transition-colors" title="Modifica"><Edit3 size={16}/></button>
                                        <button onClick={() => onDeleteList(list.id)} className="text-gray-400 hover:text-red-400 bg-glr-700 p-1.5 rounded-md hover:bg-red-900/50 transition-colors" title="Elimina"><Trash2 size={16}/></button>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(list.labels || []).slice(0,3).map(l => (
                                                <span key={l} className="text-[10px] bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-900/50 flex items-center gap-1"><Tag size={8}/> {l}</span>
                                            ))}
                                            {(list.labels?.length || 0) > 3 && <span className="text-[10px] text-gray-500 px-1 py-0.5">+{list.labels!.length - 3}</span>}
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-glr-accent transition-colors truncate" title={list.name}>{list.name}</h3>
                                    </div>
                                    
                                    <div className="flex-1 bg-glr-900/50 rounded-lg p-3 border border-glr-700/50 mb-3 overflow-hidden">
                                        <div className="space-y-1">
                                            {list.items.slice(0, 4).map(i => (
                                                <div key={i.id} className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-300 truncate pr-2">{i.name}</span>
                                                    <span className="text-gray-500 font-mono">x{i.quantity}</span>
                                                </div>
                                            ))}
                                            {list.items.length > 4 && <div className="text-[10px] text-gray-500 italic mt-1 pt-1 border-t border-glr-700/50">...altri {list.items.length - 4} articoli</div>}
                                            {list.items.length === 0 && <span className="text-xs text-gray-600 italic">Nessun articolo</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-auto border-t border-glr-700/50 pt-3">
                                        <span className="flex items-center gap-1"><Layers size={12}/> {list.items.length} voci univoche</span>
                                        <span className="flex items-center gap-1"><Box size={12}/> {list.items.reduce((acc, i) => acc + i.quantity, 0)} pezzi tot.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-glr-800 p-3 rounded-xl border border-glr-700 shrink-0">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronLeft size={20} /></button>
                            <span className="text-sm text-gray-400">Pagina <span className="text-white font-bold">{currentPage}</span> di {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
