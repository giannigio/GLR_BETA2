
import React, { useState, useMemo } from 'react';
import { StandardMaterialList, MaterialItem, InventoryItem } from '../types';
import { Plus, Edit3, Trash2, Save, X, Search, Minus, Package, Tag, CheckSquare, Square } from 'lucide-react';

interface StandardListsProps {
    lists: StandardMaterialList[];
    inventory: InventoryItem[];
    onAddList: (list: StandardMaterialList) => void;
    onUpdateList: (list: StandardMaterialList) => void;
    onDeleteList: (id: string) => void;
}

export const StandardLists: React.FC<StandardListsProps> = ({ lists, inventory, onAddList, onUpdateList, onDeleteList }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeList, setActiveList] = useState<StandardMaterialList | null>(null);
    
    // Editor State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    const handleNew = () => {
        setActiveList({ id: '', name: 'Nuovo Kit', labels: [], items: [] });
        setIsEditing(true);
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

    const filteredInventory = useMemo(() => {
        return inventory.filter(i => {
            const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = categoryFilter === 'ALL' || i.category === categoryFilter;
            return matchSearch && matchCat;
        });
    }, [inventory, searchTerm, categoryFilter]);

    const addItem = (invItem: InventoryItem) => {
        if (!activeList) return;
        const existing = activeList.items.find(i => i.inventoryId === invItem.id);
        if (existing) {
            setActiveList({
                ...activeList,
                items: activeList.items.map(i => i.inventoryId === invItem.id ? { ...i, quantity: i.quantity + 1 } : i)
            });
        } else {
            const newItem: MaterialItem = {
                id: Date.now().toString(),
                inventoryId: invItem.id,
                name: invItem.name,
                category: invItem.category,
                type: invItem.type,
                quantity: 1,
                isExternal: false
            };
            setActiveList({ ...activeList, items: [...activeList.items, newItem] });
        }
    };

    const updateQty = (itemId: string, delta: number) => {
        if (!activeList) return;
        setActiveList({
            ...activeList,
            items: activeList.items.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        });
    };

    const removeItem = (itemId: string) => {
        if (!activeList) return;
        setActiveList({ ...activeList, items: activeList.items.filter(i => i.id !== itemId) });
    };

    if (isEditing && activeList) {
        return (
            <div className="bg-glr-800 rounded-xl border border-glr-700 p-6 h-[calc(100vh-140px)] flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-4 border-b border-glr-700 pb-4">
                    <h3 className="text-xl font-bold text-white">{activeList.id ? 'Modifica Kit' : 'Nuovo Kit'}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400 flex items-center gap-2"><Save size={18}/> Salva</button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Nome Lista / Kit</label>
                            <input type="text" value={activeList.name} onChange={e => setActiveList({...activeList, name: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-bold"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Etichette Lavoro</label>
                        <div className="flex flex-col gap-2 bg-glr-900 p-3 rounded border border-glr-600">
                            {['Audio', 'Video', 'Luci'].map(lbl => (
                                <button key={lbl} onClick={() => toggleLabel(lbl)} className="flex items-center gap-2 text-sm hover:text-white text-gray-300">
                                    {activeList.labels?.includes(lbl) ? <CheckSquare size={16} className="text-glr-accent"/> : <Square size={16}/>}
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* LEFT: INVENTORY PICKER */}
                    <div className="w-1/2 flex flex-col gap-4 border-r border-glr-700 pr-4">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-glr-900 border border-glr-600 rounded text-white text-xs px-2 py-2 w-1/3"><option value="ALL">Tutte Categorie</option><option>Audio</option><option>Video</option><option>Luci</option><option>Cavi</option><option>Strutture</option></select>
                            </div>
                            <div className="relative w-full">
                                <Search size={14} className="absolute left-2 top-2.5 text-gray-400"/>
                                <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded pl-8 pr-2 py-1.5 text-white text-sm"/>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredInventory.map(item => (
                                <div key={item.id} onClick={() => addItem(item)} className="bg-glr-900 p-2 rounded border border-glr-700 cursor-pointer hover:border-glr-accent group flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-white">{item.name}</p>
                                        <div className="flex gap-2 text-[10px] text-gray-400">
                                            <span className="bg-glr-800 px-1 rounded">{item.category}</span>
                                            {item.type && <span className="bg-glr-800 px-1 rounded">{item.type}</span>}
                                        </div>
                                    </div>
                                    <Plus size={16} className="text-gray-500 group-hover:text-glr-accent"/>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: CURRENT LIST */}
                    <div className="w-1/2 flex flex-col">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Contenuto Kit ({activeList.items.length})</h4>
                        <div className="flex-1 overflow-y-auto bg-glr-900/50 rounded border border-glr-700 p-2 space-y-2">
                            {activeList.items.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">Kit vuoto.</p>}
                            {activeList.items.map(item => (
                                <div key={item.id} className="bg-glr-800 p-2 rounded flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{item.name}</p>
                                        <span className="text-[10px] text-gray-400">{item.category} {item.type ? `• ${item.type}` : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-glr-700 rounded text-gray-400"><Minus size={12}/></button>
                                        <span className="text-sm font-bold w-6 text-center text-white">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-glr-700 rounded text-gray-400"><Plus size={12}/></button>
                                        <button onClick={() => removeItem(item.id)} className="p-1 hover:text-red-400 text-gray-500 ml-2"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Package/> Kit & Liste Standard</h2>
                <button onClick={handleNew} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2"><Plus size={20}/> Nuovo Kit</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {lists.map(list => (
                    <div key={list.id} className="bg-glr-800 border border-glr-700 rounded-xl p-5 hover:border-glr-accent transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                                {(list.labels || []).map(l => (
                                    <span key={l} className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-1 rounded border border-blue-900 flex items-center gap-1"><Tag size={10}/> {l}</span>
                                ))}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setActiveList(list); setIsEditing(true); }} className="text-gray-400 hover:text-white"><Edit3 size={16}/></button>
                                <button onClick={() => onDeleteList(list.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{list.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{list.items.length} articoli</p>
                        <div className="text-xs text-gray-500 line-clamp-2">
                            {list.items.map(i => i.name).join(', ')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
