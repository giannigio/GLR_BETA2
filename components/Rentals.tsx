
import React, { useState, useMemo, useEffect } from 'react';
import { Rental, RentalStatus, InventoryItem, MaterialItem, Job, AppSettings } from '../types';
import { checkAvailabilityHelper } from '../services/helpers';
import { ShoppingBag, Plus, Search, Calendar, User, Phone, MapPin, Truck, Box, Trash2, Save, X, Printer, FileText, Minus, Package, AlertTriangle, ArrowDownCircle, Mail, Edit3, CheckCircle, ExternalLink, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface RentalsProps {
    rentals: Rental[];
    inventory: InventoryItem[];
    jobs: Job[];
    onAddRental: (rental: Rental) => void;
    onUpdateRental: (rental: Rental) => void;
    onDeleteRental: (id: string) => void;
    settings?: AppSettings;
    currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

const ITEMS_PER_PAGE = 10;

export const Rentals: React.FC<RentalsProps> = ({ rentals, inventory, jobs, onAddRental, onUpdateRental, onDeleteRental, settings, currentUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeRental, setActiveRental] = useState<Rental | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | RentalStatus>('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    // EDITOR STATES
    const [addMode, setAddMode] = useState<'BROWSE' | 'MANUAL'>('BROWSE');
    const [invSearch, setInvSearch] = useState('');
    const [invCategory, setInvCategory] = useState('ALL');

    // MANUAL ADD STATES
    const [manualName, setManualName] = useState('');
    const [manualQty, setManualQty] = useState(1);

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const handleNew = () => {
        setActiveRental({
            id: '',
            status: RentalStatus.DRAFT,
            client: '',
            pickupDate: new Date().toISOString().split('T')[0],
            returnDate: new Date().toISOString().split('T')[0],
            deliveryMethod: 'RITIRO',
            items: []
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!activeRental) return;
        if (activeRental.id) onUpdateRental(activeRental);
        else onAddRental({ ...activeRental, id: Date.now().toString() });
        setIsEditing(false); setActiveRental(null);
    };

    const handlePrint = () => window.print();

    // --- INVENTORY BROWSER LOGIC ---
    const availableCategories = useMemo(() => ['ALL', ...Array.from(new Set(inventory.map(i => i.category))).sort()], [inventory]);
    
    const filteredInventory = useMemo(() => {
        return inventory.filter(i => {
            const matchSearch = i.name.toLowerCase().includes(invSearch.toLowerCase());
            const matchCat = invCategory === 'ALL' || i.category === invCategory;
            return matchSearch && matchCat;
        });
    }, [inventory, invSearch, invCategory]);

    const addItem = (invItem: InventoryItem) => {
        if (!activeRental) return;
        
        // CHECK AVAILABILITY
        const availability = checkAvailabilityHelper(
            inventory, 
            jobs, 
            rentals, 
            invItem.id, 
            activeRental.pickupDate, 
            activeRental.returnDate, 
            activeRental.id // Exclude self
        );

        const existing = activeRental.items.find(i => i.inventoryId === invItem.id);
        const currentQty = existing?.quantity || 0;
        
        // Warning if insufficient
        if (availability.available <= currentQty) {
            if(!confirm(`Attenzione! Disponibilità limitata per ${invItem.name}.\nDisponibili: ${availability.available}\nConflitti: ${availability.conflicts.map(c => c.jobName).join(', ')}\n\nVuoi aggiungere comunque?`)) {
                return;
            }
        }

        if (existing) {
            setActiveRental({
                ...activeRental,
                items: activeRental.items.map(i => i.inventoryId === invItem.id ? { ...i, quantity: i.quantity + 1 } : i)
            });
        } else {
            const newItem: MaterialItem = {
                id: Date.now().toString() + Math.random(),
                inventoryId: invItem.id,
                name: invItem.name,
                category: invItem.category,
                type: invItem.type,
                quantity: 1,
                isExternal: false
            };
            setActiveRental({ ...activeRental, items: [...activeRental.items, newItem] });
        }
    };

    const addManualItem = () => {
        if (!activeRental || !manualName) return;
        const newItem: MaterialItem = {
            id: Date.now().toString() + Math.random(),
            name: manualName,
            category: 'Altro',
            type: 'Manuale',
            quantity: manualQty,
            isExternal: true
        };
        setActiveRental({ ...activeRental, items: [...activeRental.items, newItem] });
        setManualName(''); setManualQty(1);
    };

    const updateQty = (itemId: string, delta: number) => {
        if (!activeRental) return;
        setActiveRental({
            ...activeRental,
            items: activeRental.items.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        });
    };

    const removeItem = (itemId: string) => {
        if (!activeRental) return;
        setActiveRental({ ...activeRental, items: activeRental.items.filter(i => i.id !== itemId) });
    };

    // --- MAIN LIST LOGIC ---
    const filteredRentals = rentals.filter(r => {
        const matchesSearch = r.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (r.contactName && r.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE);
    const paginatedRentals = filteredRentals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getStatusBadge = (status: RentalStatus) => {
        switch(status) {
            case RentalStatus.DRAFT: return <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-[10px] uppercase font-bold border border-gray-600">Bozza</span>;
            case RentalStatus.CONFIRMED: return <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-300 text-[10px] uppercase font-bold border border-blue-800">Confermato</span>;
            case RentalStatus.OUT: return <span className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-300 text-[10px] uppercase font-bold border border-yellow-800">In Uscita</span>;
            case RentalStatus.RETURNED: return <span className="px-2 py-1 rounded bg-green-900/30 text-green-300 text-[10px] uppercase font-bold border border-green-800">Rientrato</span>;
            case RentalStatus.CANCELLED: return <span className="px-2 py-1 rounded bg-red-900/30 text-red-300 text-[10px] uppercase font-bold border border-red-800">Annullato</span>;
        }
    };

    if (isEditing && activeRental) {
        return (
            <div className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col h-[calc(100vh-140px)] animate-fade-in relative print-only">
                {/* HEADER (Screen Only) */}
                <div className="p-4 border-b border-glr-700 flex justify-between items-center shrink-0 no-print">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="text-glr-accent"/> {activeRental.id ? `Noleggio: ${activeRental.client}` : 'Nuovo Noleggio'}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-glr-900 text-white rounded hover:bg-glr-700 border border-glr-600 flex items-center gap-2"><Printer size={18}/> Stampa DDT</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
                        {canEdit && <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400 flex items-center gap-2"><Save size={18}/> Salva</button>}
                    </div>
                </div>

                {/* --- PRINTABLE DOCUMENT HEADER (DDT) --- */}
                <div className="hidden print:block bg-white text-black p-0 min-h-screen">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div className="flex items-center gap-4">
                            {settings?.logoUrl ? <img src={settings.logoUrl} className="w-24 h-24 object-contain" alt="Logo"/> : <div className="text-3xl font-bold">GLR</div>}
                            <div>
                                <h1 className="text-xl font-bold uppercase">{settings?.companyName}</h1>
                                <p className="text-sm">{settings?.address}</p>
                                <p className="text-sm">P.IVA: {settings?.pIva}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold uppercase tracking-tight">DDT / Documento di Trasporto</h2>
                            <p className="text-sm">Data Doc: {new Date().toLocaleDateString()}</p>
                            <p className="text-sm font-bold">ID Rif: {activeRental.id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm border-b-2 border-black pb-6">
                        <div className="border border-black p-4">
                            <h4 className="font-bold uppercase mb-2 border-b border-gray-400 pb-1 text-xs">Destinatario / Cliente</h4>
                            <p className="font-bold text-lg mb-1">{activeRental.client}</p>
                            <p>Ref: {activeRental.contactName || '-'}</p>
                            <p>Tel: {activeRental.contactPhone || '-'}</p>
                            <p>Email: {activeRental.contactEmail || '-'}</p>
                        </div>
                        <div className="border border-black p-4">
                            <h4 className="font-bold uppercase mb-2 border-b border-gray-400 pb-1 text-xs">Dettagli Logistici</h4>
                            <p><strong>Data Ritiro:</strong> {new Date(activeRental.pickupDate).toLocaleDateString()}</p>
                            <p><strong>Data Riconsegna:</strong> {new Date(activeRental.returnDate).toLocaleDateString()}</p>
                            <p><strong>Modalità:</strong> {activeRental.deliveryMethod}</p>
                            {activeRental.deliveryMethod === 'CONSEGNA' && <p className="mt-1"><strong>Destinazione:</strong> {activeRental.deliveryAddress}</p>}
                        </div>
                    </div>

                    <div className="mb-8">
                        <table className="w-full text-sm border-collapse border border-black">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border border-black p-2 text-center w-12">#</th>
                                    <th className="border border-black p-2 text-left">Descrizione Articolo</th>
                                    <th className="border border-black p-2 text-left">Categoria</th>
                                    <th className="border border-black p-2 text-center w-24">Quantità</th>
                                    <th className="border border-black p-2 text-center w-24">Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeRental.items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="border border-black p-2 text-center">{idx + 1}</td>
                                        <td className="border border-black p-2 font-bold">
                                            {item.name}
                                            {item.isExternal && <span className="ml-2 italic font-normal text-xs">(Manuale)</span>}
                                        </td>
                                        <td className="border border-black p-2">{item.category}</td>
                                        <td className="border border-black p-2 text-center font-bold text-lg">{item.quantity}</td>
                                        <td className="border border-black p-2 text-center align-middle">
                                            <div className="w-5 h-5 border border-black mx-auto"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mt-auto pt-10">
                         <div>
                             <p className="font-bold uppercase mb-12 border-b border-black pb-1 text-xs">Firma per Ritiro (Cliente)</p>
                         </div>
                         <div>
                             <p className="font-bold uppercase mb-12 border-b border-black pb-1 text-xs">Firma per Consegna (GLR)</p>
                         </div>
                    </div>
                    <p className="text-[10px] text-center mt-4 text-gray-500">Documento generato da GLR HUB il {new Date().toLocaleString()}</p>
                </div>

                {/* --- EDITOR CONTENT (Screen) --- */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-4 print:hidden">
                    
                    {/* LEFT COL: DETAILS & PICKER */}
                    <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto">
                        
                        {/* 1. INFO CARD */}
                        <div className="bg-glr-900 p-4 rounded-xl border border-glr-700 space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Cliente / Azienda</label>
                                <input disabled={!canEdit} type="text" value={activeRental.client} onChange={e => setActiveRental({...activeRental, client: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white font-bold text-lg focus:border-glr-accent outline-none" placeholder="Nome Cliente"/>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase">Referente</label>
                                    <div className="flex items-center gap-1 bg-glr-800 border border-glr-600 rounded p-1"><User size={14} className="text-gray-500"/><input disabled={!canEdit} type="text" value={activeRental.contactName || ''} onChange={e => setActiveRental({...activeRental, contactName: e.target.value})} className="w-full bg-transparent outline-none text-white text-xs"/></div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase">Telefono</label>
                                    <div className="flex items-center gap-1 bg-glr-800 border border-glr-600 rounded p-1"><Phone size={14} className="text-gray-500"/><input disabled={!canEdit} type="text" value={activeRental.contactPhone || ''} onChange={e => setActiveRental({...activeRental, contactPhone: e.target.value})} className="w-full bg-transparent outline-none text-white text-xs"/></div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase">Email</label>
                                    <div className="flex items-center gap-1 bg-glr-800 border border-glr-600 rounded p-1"><Mail size={14} className="text-gray-500"/><input disabled={!canEdit} type="text" value={activeRental.contactEmail || ''} onChange={e => setActiveRental({...activeRental, contactEmail: e.target.value})} className="w-full bg-transparent outline-none text-white text-xs"/></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-glr-700">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Data Ritiro</label>
                                    <input disabled={!canEdit} type="date" value={activeRental.pickupDate.split('T')[0]} onChange={e => setActiveRental({...activeRental, pickupDate: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Data Riconsegna</label>
                                    <input disabled={!canEdit} type="date" value={activeRental.returnDate.split('T')[0]} onChange={e => setActiveRental({...activeRental, returnDate: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Logistica</label>
                                    <select disabled={!canEdit} value={activeRental.deliveryMethod} onChange={e => setActiveRental({...activeRental, deliveryMethod: e.target.value as any})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm">
                                        <option value="RITIRO">Ritiro in Sede</option>
                                        <option value="CONSEGNA">Consegna a domicilio</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Stato</label>
                                    <select disabled={!canEdit} value={activeRental.status} onChange={e => setActiveRental({...activeRental, status: e.target.value as any})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm">
                                        {Object.values(RentalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {activeRental.deliveryMethod === 'CONSEGNA' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Indirizzo Consegna</label>
                                    <input disabled={!canEdit} type="text" value={activeRental.deliveryAddress || ''} onChange={e => setActiveRental({...activeRental, deliveryAddress: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Via..."/>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Note / Prezzo Pattuito</label>
                                <textarea disabled={!canEdit} value={activeRental.notes || ''} onChange={e => setActiveRental({...activeRental, notes: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm h-16"/>
                            </div>
                        </div>

                        {/* 2. ITEM ADDER */}
                        {canEdit && (
                        <div className="flex-1 flex flex-col bg-glr-900 border border-glr-700 rounded-xl overflow-hidden">
                            <div className="flex p-2 bg-glr-950 gap-2 border-b border-glr-800">
                                <button onClick={() => setAddMode('BROWSE')} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${addMode === 'BROWSE' ? 'bg-glr-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Magazzino</button>
                                <button onClick={() => setAddMode('MANUAL')} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${addMode === 'MANUAL' ? 'bg-glr-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Manuale</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                {addMode === 'BROWSE' ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <select value={invCategory} onChange={e => setInvCategory(e.target.value)} className="w-1/3 bg-glr-800 border border-glr-600 rounded text-white text-xs p-1 outline-none"><option value="ALL">Tutte</option>{availableCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}</select>
                                            <div className="relative flex-1">
                                                <Search size={14} className="absolute left-2 top-2 text-gray-500"/>
                                                <input type="text" placeholder="Cerca..." value={invSearch} onChange={e => setInvSearch(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded pl-7 pr-2 py-1 text-white text-xs outline-none"/>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {filteredInventory.slice(0, 50).map(item => {
                                                // Calculate Availability Real-Time
                                                const availability = checkAvailabilityHelper(inventory, jobs, rentals, item.id, activeRental.pickupDate, activeRental.returnDate, activeRental.id);
                                                const inCart = activeRental.items.find(i => i.inventoryId === item.id)?.quantity || 0;
                                                const realAvailable = availability.available - inCart;
                                                const isCritical = realAvailable <= 0;

                                                return (
                                                    <div key={item.id} onClick={() => addItem(item)} className="flex justify-between items-center p-2 bg-glr-800 rounded border border-glr-700 hover:border-glr-500 cursor-pointer group transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                                                {isCritical && (
                                                                    <span title="Scorta esaurita per queste date">
                                                                        <AlertTriangle size={10} className="text-red-500" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2 text-[10px]">
                                                                <span className="text-gray-500">{item.category}</span>
                                                                <span className={isCritical ? 'text-red-400 font-bold' : 'text-green-400'}>Disp: {realAvailable}</span>
                                                            </div>
                                                        </div>
                                                        <Plus size={16} className={`opacity-50 group-hover:opacity-100 ${isCritical ? 'text-red-500' : 'text-green-500'}`}/>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <input type="text" placeholder="Nome Articolo" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm outline-none"/>
                                        <input type="number" min="1" placeholder="Quantità" value={manualQty} onChange={e => setManualQty(parseInt(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm outline-none"/>
                                        <button onClick={addManualItem} className="w-full bg-glr-700 text-white font-bold py-2 rounded text-xs hover:bg-white hover:text-glr-900 transition-colors">Aggiungi Manuale</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>

                    {/* RIGHT COL: ITEM LIST */}
                    <div className="w-full md:w-1/2 flex flex-col bg-glr-900 rounded-xl border border-glr-700 overflow-hidden">
                        <div className="bg-glr-950 p-3 border-b border-glr-800 flex justify-between items-center">
                            <h4 className="font-bold text-gray-300 uppercase flex items-center gap-2"><Box size={16}/> Lista Materiale</h4>
                            <span className="text-xs bg-glr-800 px-2 py-1 rounded text-white">{activeRental.items.reduce((acc, i) => acc + i.quantity, 0)} Pz</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {activeRental.items.length === 0 && <p className="text-center text-gray-500 py-10">Nessun articolo inserito.</p>}
                            {activeRental.items.map((item, idx) => (
                                <div key={item.id} className="bg-glr-800 p-2 rounded flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-xs text-gray-500 w-5 text-center">{idx + 1}</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                            <span className="text-[10px] text-gray-400">{item.category} {item.isExternal && '(MAN)'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* EDITOR VIEW CONTROLS */}
                                    <div className="flex items-center gap-1 bg-glr-900 rounded p-1">
                                        {canEdit && <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-glr-700 rounded text-gray-400"><Minus size={12}/></button>}
                                        <span className="text-sm font-bold w-8 text-center text-white">{item.quantity}</span>
                                        {canEdit && <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-glr-700 rounded text-gray-400"><Plus size={12}/></button>}
                                        {canEdit && (
                                            <>
                                                <div className="w-px h-4 bg-glr-700 mx-1"></div>
                                                <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-900/50 hover:text-red-400 text-gray-500 rounded transition-colors"><Trash2 size={12}/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // MAIN LIST VIEW (TABLE)
    return (
        <div className="space-y-6 animate-fade-in no-print h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingBag/> Elenco Noleggi Attivi</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                        <input type="text" placeholder="Cerca noleggio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 bg-glr-800 border border-glr-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"/>
                    </div>
                    {canEdit && <button onClick={handleNew} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"><Plus size={20}/> Nuovo Noleggio</button>}
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex items-center gap-2 bg-glr-800 p-2 rounded-lg border border-glr-700 w-fit">
                <span className="text-xs text-gray-400 flex items-center gap-1 px-2"><Filter size={12}/> Stato:</span>
                {(['ALL', ...Object.values(RentalStatus)] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s as any)} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterStatus === s ? 'bg-glr-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {s === 'ALL' ? 'Tutti' : s}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden bg-glr-800 rounded-xl border border-glr-700 flex flex-col shadow-lg">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-glr-900 text-gray-400 text-xs uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold border-b border-glr-700">Stato</th>
                                <th className="p-4 font-bold border-b border-glr-700">Cliente / Riferimento</th>
                                <th className="p-4 font-bold border-b border-glr-700">Periodo</th>
                                <th className="p-4 font-bold border-b border-glr-700">Logistica</th>
                                <th className="p-4 font-bold border-b border-glr-700 text-center">Articoli</th>
                                <th className="p-4 font-bold border-b border-glr-700 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700">
                            {paginatedRentals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 italic">Nessun noleggio trovato con i filtri correnti.</td>
                                </tr>
                            )}
                            {paginatedRentals.map(rental => (
                                <tr key={rental.id} onClick={() => { setActiveRental(rental); setIsEditing(true); }} className="hover:bg-glr-700/30 cursor-pointer transition-colors group">
                                    <td className="p-4">
                                        {getStatusBadge(rental.status)}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-white text-sm">{rental.client}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{rental.contactName} {rental.contactPhone ? `• ${rental.contactPhone}` : ''}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-300 flex items-center gap-2"><Calendar size={14} className="text-glr-accent"/> {new Date(rental.pickupDate).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500 pl-6">al {new Date(rental.returnDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-300 flex items-center gap-2"><Truck size={14}/> {rental.deliveryMethod}</div>
                                        {rental.deliveryAddress && <div className="text-xs text-gray-500 pl-6 truncate max-w-[150px]" title={rental.deliveryAddress}>{rental.deliveryAddress}</div>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-glr-900 text-white font-mono text-xs px-2 py-1 rounded border border-glr-600">{rental.items.length}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 bg-glr-900 rounded text-gray-300 hover:text-white border border-glr-600 hover:border-glr-400" title="Modifica"><Edit3 size={16}/></button>
                                            {canEdit && <button onClick={(e) => { e.stopPropagation(); onDeleteRental(rental.id); }} className="p-1.5 bg-red-900/20 rounded text-red-400 hover:text-red-200 border border-red-900 hover:border-red-500" title="Elimina"><Trash2 size={16}/></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-glr-700 bg-glr-900 flex justify-between items-center shrink-0">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronLeft size={20} /></button>
                        <span className="text-sm text-gray-400">Pagina <span className="text-white font-bold">{currentPage}</span> di {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};
