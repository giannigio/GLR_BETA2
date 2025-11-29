
import React, { useState, useRef } from 'react';
import { InventoryItem } from '../types';
import { Package, Search, Plus, Trash2, Edit3, X, Save, Speaker, Monitor, Zap, Box, Cable, Upload, Radio, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const ITEMS_PER_PAGE = 25;

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories: string[] = ['ALL', ...(Array.from(new Set(inventory.map((i: InventoryItem) => i.category))) as string[])].sort();

  const filteredItems = inventory.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(s) || 
                          (item.type && item.type.toLowerCase().includes(s)) ||
                          (item.serialNumber && item.serialNumber.toLowerCase().includes(s));
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const currentItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory]);

  const getCategoryCount = (cat: string) => cat === 'ALL' ? inventory.length : inventory.filter(i => i.category === cat).length;

  const getCategoryIcon = (cat: string) => {
      if(cat.includes('Audio')) return <Speaker size={14}/>;
      if(cat.includes('Video') || cat.includes('Ledwall')) return <Monitor size={14}/>;
      if(cat.includes('Luci')) return <Zap size={14}/>;
      if(cat.includes('Strutture') || cat.includes('Hardware')) return <Box size={14}/>;
      if(cat.includes('Cavi') || cat.includes('Corrente')) return <Cable size={14}/>;
      if(cat.includes('Rulle')) return <Radio size={14}/>;
      return <Package size={14}/>;
  };

  const handleNew = () => {
    setActiveItem({
      id: Date.now().toString(),
      category: 'Audio', type: '', quantityOwned: 1, name: '',
      related: '', accessories: '', correlationType: '',
      notes: '', status: 'Operativo', serialNumber: '', weightKg: 0
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!activeItem) return;
    const exists = inventory.find(i => i.id === activeItem.id);
    if (exists) onUpdateItem(activeItem); else onAddItem(activeItem);
    setIsEditing(false); setActiveItem(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const text = event.target?.result as string;
              if (!text) return;
              const lines = text.split(/\r?\n/);
              let importCount = 0;
              const separator = text.includes(';') ? ';' : ',';

              // Header Expected: Categoria;Tipologia;Quantità;Attrezzatura;Correlati;Accessori/Kit;Tipo Correlazione;Note;Stato;Seriale
              for (let i = 1; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  const cols = line.split(separator).map(c => c.trim());
                  
                  if (!cols[3]) continue; // Name (Attrezzatura) is required

                  const newItem: InventoryItem = {
                      id: `imp-${Date.now()}-${i}`,
                      category: cols[0] || 'Altro',
                      type: cols[1],
                      quantityOwned: parseInt(cols[2]?.replace(/\D/g, '') || '0'),
                      name: cols[3],
                      related: cols[4],
                      accessories: cols[5],
                      correlationType: cols[6],
                      notes: cols[7],
                      status: cols[8] || 'Operativo',
                      serialNumber: cols[9],
                      weightKg: 0
                  };
                  onAddItem(newItem);
                  importCount++;
              }
              alert(importCount > 0 ? `Importazione completata: ${importCount} articoli.` : "Nessun articolo importato.");
          } catch (err) { console.error("CSV Error:", err); alert("Errore importazione CSV."); }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 no-print">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Package /> Magazzino & Inventario</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Cerca nome, tipo, seriale..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-glr-800 border border-glr-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-glr-accent outline-none"/>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="bg-glr-800 text-gray-300 border border-glr-700 font-bold px-3 py-2 rounded-lg hover:text-white flex items-center gap-2">
                <Upload size={20} /> <span className="hidden sm:inline">Importa CSV</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            <button onClick={handleNew} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2">
                <Plus size={20} /> <span className="hidden sm:inline">Nuovo</span>
            </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-thin scrollbar-thumb-glr-700 no-print">
         {availableCategories.map((cat: string) => (
             <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-2 ${filterCategory === cat ? 'bg-glr-700 text-white border border-glr-500 shadow-lg' : 'bg-glr-900 text-gray-400 border border-transparent hover:bg-glr-800'}`}>
                 {getCategoryIcon(cat)} <span>{cat === 'ALL' ? 'Tutto' : cat}</span>
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterCategory === cat ? 'bg-glr-900 text-white' : 'bg-glr-800 text-gray-500'}`}>{getCategoryCount(cat)}</span>
             </button>
         ))}
      </div>

      {isEditing && activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
              <div className="bg-glr-800 rounded-xl border border-glr-600 p-6 w-full max-w-4xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="text-xl font-bold text-white">{inventory.find(i => i.id === activeItem.id) ? 'Modifica Articolo' : 'Nuovo Articolo'}</h3>
                      <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                  </div>
                  <div className="space-y-4 overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="col-span-2">
                              <label className="block text-xs text-gray-400 mb-1">Attrezzatura (Nome)</label>
                              <input type="text" value={activeItem.name} onChange={e => setActiveItem({...activeItem, name: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" autoFocus />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                            <input type="text" value={activeItem.category} onChange={e => setActiveItem({...activeItem, category: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" list="categories" />
                            <datalist id="categories">{availableCategories.filter(c => c !== 'ALL').map(c => <option key={c} value={c} />)}</datalist>
                          </div>
                          <div>
                             <label className="block text-xs text-gray-400 mb-1">Tipologia</label>
                             <input type="text" value={activeItem.type || ''} onChange={e => setActiveItem({...activeItem, type: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div>
                             <label className="block text-xs text-gray-400 mb-1">Quantità</label>
                             <input type="number" value={activeItem.quantityOwned} onChange={e => setActiveItem({...activeItem, quantityOwned: parseInt(e.target.value) || 0})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                          </div>
                          <div>
                              <label className="block text-xs text-gray-400 mb-1">Seriale</label>
                              <input type="text" value={activeItem.serialNumber || ''} onChange={e => setActiveItem({...activeItem, serialNumber: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                          </div>
                          <div>
                              <label className="block text-xs text-gray-400 mb-1">Stato</label>
                              <input type="text" value={activeItem.status || ''} onChange={e => setActiveItem({...activeItem, status: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                          </div>
                          <div>
                             <label className="block text-xs text-gray-400 mb-1">Peso (Kg)</label>
                             <input type="number" step="0.1" value={activeItem.weightKg || 0} onChange={e => setActiveItem({...activeItem, weightKg: parseFloat(e.target.value) || 0})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-glr-900/30 p-4 rounded-lg border border-glr-700/50">
                          <div>
                             <label className="block text-xs text-glr-accent font-bold mb-1">Correlati</label>
                             <input type="text" value={activeItem.related || ''} onChange={e => setActiveItem({...activeItem, related: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Es. Asta microfonica, Cavo XLR" />
                          </div>
                           <div>
                             <label className="block text-xs text-glr-accent font-bold mb-1">Accessori / Kit</label>
                             <input type="text" value={activeItem.accessories || ''} onChange={e => setActiveItem({...activeItem, accessories: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Es. Custodia, Alimentatore" />
                          </div>
                          <div className="col-span-2">
                             <label className="block text-xs text-gray-400 mb-1">Tipo Correlazione</label>
                             <input type="text" value={activeItem.correlationType || ''} onChange={e => setActiveItem({...activeItem, correlationType: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Note</label>
                          <textarea value={activeItem.notes || ''} onChange={e => setActiveItem({...activeItem, notes: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white h-16 text-sm" />
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 shrink-0">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
                      <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400">
                          <Save size={18}/> Salva
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-xl flex flex-col flex-1">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-glr-900 z-10 shadow-sm">
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-glr-700">
                        <th className="p-4">Attrezzatura</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Tipologia</th>
                        <th className="p-4 text-center">Qt. Tot</th>
                        <th className="p-4">Suggerimenti</th>
                        <th className="p-4 text-right">Azioni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-glr-700">
                    {currentItems.map(item => (
                        <tr key={item.id} className="hover:bg-glr-700/50 transition-colors">
                            <td className="p-4 font-medium text-white w-1/3">
                                {item.name}
                                {item.serialNumber && <div className="text-[10px] text-gray-500 font-mono">SN: {item.serialNumber}</div>}
                            </td>
                            <td className="p-4">
                                <span className="text-[10px] px-2 py-0.5 rounded border flex w-fit items-center gap-1 border-glr-600 bg-glr-900 text-gray-400">
                                    {getCategoryIcon(item.category)} {item.category}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-gray-300">
                                {item.type || '-'}
                            </td>
                            <td className="p-4 text-center">
                                <span className="text-glr-accent font-bold text-lg">{item.quantityOwned}</span>
                            </td>
                            <td className="p-4 text-sm text-gray-400 max-w-xs">
                                {(item.related || item.accessories) && (
                                    <div className="flex items-center gap-1 mb-1" title="Suggerimenti">
                                        <Lightbulb size={12} className="shrink-0 text-glr-accent"/> 
                                        <span className="truncate text-xs">{[item.related, item.accessories].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setActiveItem(item); setIsEditing(true); }} className="text-gray-400 hover:text-white p-1 bg-glr-900 rounded"><Edit3 size={16} /></button>
                                    <button onClick={() => onDeleteItem(item.id)} className="text-gray-400 hover:text-red-400 p-1 bg-glr-900 rounded"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {currentItems.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nessun articolo trovato.</td></tr>}
                </tbody>
            </table>
        </div>
        {totalPages > 1 && (
            <div className="p-4 border-t border-glr-700 bg-glr-900 flex justify-between items-center shrink-0 no-print">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronLeft size={20} /></button>
                <span className="text-sm text-gray-400">Pagina <span className="text-white font-bold">{currentPage}</span> di {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-glr-700 disabled:opacity-30 text-white"><ChevronRight size={20} /></button>
            </div>
        )}
      </div>
    </div>
  );
};
