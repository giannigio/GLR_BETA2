
import React, { useState, useMemo } from 'react';
import { Rental, RentalStatus, InventoryItem, MaterialItem, Job, AppSettings } from '../types';
import { checkAvailabilityHelper } from '../services/helpers';
import { ShoppingBag, Plus, Search, Calendar, User, Phone, MapPin, Truck, Box, Trash2, Save, X, Printer, FileText, Minus, Package, AlertTriangle, ArrowDownCircle, Mail } from 'lucide-react';

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

export const Rentals: React.FC<RentalsProps> = ({ rentals, inventory, jobs, onAddRental, onUpdateRental, onDeleteRental, settings, currentUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeRental, setActiveRental] = useState<Rental | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | RentalStatus>('ALL');

    // EDITOR STATES
    const [addMode, setAddMode] = useState<'BROWSE' | 'MANUAL'>('BROWSE');
    const [invSearch, setInvSearch] = useState('');
    const [invCategory, setInvCategory] = useState('ALL');

    // MANUAL ADD STATES
    const [manualName, setManualName] = useState('');
    const [manualQty, setManualQty] = useState(1);

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

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

    // --- INVENTORY BROWSER LOGIC (Similar to StandardLists) ---
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
        
        if (availability.available <= (existing?.quantity || 0)) {
            alert(`Attenzione! Disponibilità insufficiente per ${invItem.name}. Disponibili: ${availability.available}. Conflitti: ${availability.conflicts.map(c => c.jobName).join(', ')}`);
            // Allow adding anyway but warn
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

    const filteredRentals = rentals.filter(r => {
        const matchesSearch = r.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (r.contactName && r.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: RentalStatus) => {
        switch(status) {
            case RentalStatus.DRAFT: return 'bg-gray-700 text-gray-300';
            case RentalStatus.CONFIRMED: return 'bg-blue-900 text-blue-300 border-blue-700';
            case RentalStatus.OUT: return 'bg-yellow-900 text-yellow-300 border-yellow-700';
            case RentalStatus.RETURNED: return 'bg-green-900 text-green-300 border-green-700';
            case RentalStatus.CANCELLED: return 'bg-red-900 text-red-300 border-red-700';
        }
    };

    if (isEditing && activeRental) {
        return (
            <div className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col h-[calc(100vh-140px)] animate-fade-in print-only">
                {/* HEADER (No Print) */}
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

                {/* --- PRINTABLE DOCUMENT HEADER --- */}
                <div className="hidden print-block p-8 bg-white text-black mb-4">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div className="flex items-center gap-4">
                            {settings?.logoUrl ? <img src={settings.logoUrl} className="w-20 h-20 object-contain" alt="Logo"/> : <div className="text-2xl font-bold">GLR</div>}
                            <div>
                                <h1 className="text-xl font-bold uppercase">{settings?.companyName}</h1>
                                <p className="text-sm">{settings?.address}</p>
                                <p className="text-sm">P.IVA: {settings?.pIva}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold uppercase">Scheda Noleggio / DDT</h2>
                            <p className="text-sm">Data: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                        <div className="border border-black p-4">
                            <h4 className="font-bold uppercase mb-2 border-b border-gray-300 pb-1">Cliente / Destinatario</h4>
                            <p className="font-bold text-lg">{activeRental.client}</p>
                            <p>Ref: {activeRental.contactName}</p>
                            <p>Tel: {activeRental.contactPhone}</p>
                            <p>Email: {activeRental.contactEmail}</p>
                        </div>
                        <div className="border border-black p-4">
                            <h4 className="font-bold uppercase mb-2 border-b border-gray-300 pb-1">Dettagli Logistici</h4>
                            <p><strong>Ritiro:</strong> {new Date(activeRental.pickupDate).toLocaleDateString()}</p>
                            <p><strong>Riconsegna:</strong> {new Date(activeRental.returnDate).toLocaleDateString()}</p>
                            <p><strong>Metodo:</strong> {activeRental.deliveryMethod}</p>
                            {activeRental.deliveryMethod === 'CONSEGNA' && <p><strong>Indirizzo:</strong> {activeRental.deliveryAddress}</p>}
                        </div>
                    </div>
                </div>

                {/* --- EDITOR CONTENT (Grid) --- */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 p-4">
                    
                    {/* LEFT COL: DETAILS & ITEM PICKER (No Print) */}
                    <div className="w-full md:w-1/2 flex flex-col gap-4 no-print overflow-y-auto">
                        
                        {/* 1. ANAGRAFICA & DATE */}
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
                            <div className="flex p-2 bg-glr-950 gap-2">
                                <button onClick={() => setAddMode('BROWSE')} className={`flex-1 py-1.5 rounded text-xs font-bold ${addMode === 'BROWSE' ? 'bg-glr-700 text-white' : 'text-gray-500'}`}>Magazzino</button>
                                <button onClick={() => setAddMode('MANUAL')} className={`flex-1 py-1.5 rounded text-xs font-bold ${addMode === 'MANUAL' ? 'bg-glr-700 text-white' : 'text-gray-500'}`}>Manuale</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-3">
                                {addMode === 'BROWSE' ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <select value={invCategory} onChange={e => setInvCategory(e.target.value)} className="w-1/3 bg-glr-800 border border-glr-600 rounded text-white text-xs p-1"><option value="ALL">Tutte</option>{availableCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}</select>
                                            <div className="relative flex-1">
                                                <Search size={14} className="absolute left-2 top-2 text-gray-500"/>
                                                <input type="text" placeholder="Cerca..." value={invSearch} onChange={e => setInvSearch(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded pl-7 pr-2 py-1 text-white text-xs"/>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            {filteredInventory.slice(0, 50).map(item => (
                                                <div key={item.id} onClick={() => addItem(item)} className="flex justify-between items-center p-2 bg-glr-800 rounded border border-glr-700 hover:border-glr-500 cursor-pointer group">
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{item.name}</p>
                                                        <p className="text-[10px] text-gray-500">Disp: {item.quantityOwned}</p>
                                                    </div>
                                                    <Plus size={16} className="text-green-500 opacity-50 group-hover:opacity-100"/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <input type="text" placeholder="Nome Articolo" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/>
                                        <input type="number" min="1" placeholder="Quantità" value={manualQty} onChange={e => setManualQty(parseInt(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm"/>
                                        <button onClick={addManualItem} className="w-full bg-glr-700 text-white font-bold py-2 rounded text-xs hover:bg-white hover:text-glr-900">Aggiungi</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>

                    {/* RIGHT COL: ITEM LIST (Visible in Editor AND Print) */}
                    <div className="w-full md:w-1/2 flex flex-col bg-glr-900 rounded-xl border border-glr-700 overflow-hidden print-only print:border-none print:bg-white print:text-black">
                        <div className="bg-glr-950 p-3 border-b border-glr-800 flex justify-between items-center print:bg-gray-100 print:border-black print:text-black">
                            <h4 className="font-bold text-gray-300 uppercase flex items-center gap-2 print:text-black"><Box size={16}/> Lista Materiale</h4>
                            <span className="text-xs bg-glr-800 px-2 py-1 rounded text-white print:hidden">{activeRental.items.reduce((acc, i) => acc + i.quantity, 0)} Pz</span>
                        </div>
                        
                        {/* TABLE HEADER FOR PRINT */}
                        <div className="hidden print:grid grid-cols-12 text-xs font-bold border-b border-black p-2 uppercase">
                            <div className="col-span-8">Articolo</div>
                            <div className="col-span-2 text-center">Qtà</div>
                            <div className="col-span-2 text-center">Check</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 print:overflow-visible print:block">
                            {activeRental.items.length === 0 && <p className="text-center text-gray-500 py-10 print:hidden">Nessun articolo inserito.</p>}
                            {activeRental.items.map((item, idx) => (
                                <div key={item.id} className="bg-glr-800 p-2 rounded flex items-center justify-between group print:bg-transparent print:border-b print:border-gray-300 print:rounded-none print:grid print:grid-cols-12 print:gap-2">
                                    <div className="flex items-center gap-3 overflow-hidden print:col-span-8">
                                        <span className="text-xs text-gray-500 w-5 text-center print:text-black">{idx + 1}</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate print:text-black">{item.name}</p>
                                            <span className="text-[10px] text-gray-400 print:hidden">{item.category} {item.isExternal && '(MAN)'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* PRINT VIEW QTY */}
                                    <div className="hidden print:col-span-2 print:block text-center font-bold text-black border-l border-r border-gray-300">{item.quantity}</div>
                                    <div className="hidden print:col-span-2 print:block border border-black h-4 w-4 mx-auto my-auto"></div>

                                    {/* EDITOR VIEW CONTROLS */}
                                    <div className="flex items-center gap-1 bg-glr-900 rounded p-1 print:hidden">
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

                {/* --- PRINT FOOTER --- */}
                <div className="hidden print:block mt-8 pt-8 border-t-2 border-black px-8 text-black">
                     <div className="grid grid-cols-2 gap-20">
                         <div>
                             <p className="font-bold uppercase mb-8 border-b border-black pb-1">Firma per Ritiro (Cliente)</p>
                             <div className="h-10"></div>
                         </div>
                         <div>
                             <p className="font-bold uppercase mb-8 border-b border-black pb-1">Firma per Consegna (GLR)</p>
                             <div className="h-10"></div>
                         </div>
                     </div>
                     <p className="text-[10px] text-center mt-10">Documento generato da GLR HUB il {new Date().toLocaleString()}</p>
                </div>

            </div>
        );
};