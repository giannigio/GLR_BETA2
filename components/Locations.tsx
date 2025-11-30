
import React, { useState, useMemo, useRef } from 'react';
import { Location } from '../types';
import { MapPin, Phone, Zap, Network, Truck, Monitor, Plus, Edit3, Trash2, Save, X, ExternalLink, Speaker, Box, FileText, Ruler, Eye, Image as ImageIcon, ChevronLeft, ChevronRight, Search, Upload } from 'lucide-react';

interface LocationsProps {
  locations: Location[];
  onAddLocation: (loc: Location) => void;
  onUpdateLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

const ITEMS_PER_PAGE = 10;

export const Locations: React.FC<LocationsProps> = ({ locations, onAddLocation, onUpdateLocation, onDeleteLocation, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeLoc, setActiveLoc] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    const newLoc: Location = {
      id: Date.now().toString(), name: '', address: '', hallSizeMQ: 0, mapsLink: '', isZtl: false, contactName: '', contactPhone: '', accessHours: '',
      power: { hasCivil: true, hasIndustrial: false, industrialSockets: [], requiresGenerator: false, distanceFromPanel: 0, notes: '' },
      network: { isUnavailable: false, hasWired: false, hasWifi: true, hasWallLan: false, wallLanDistance: 0, addressing: 'DHCP', staticDetails: '', firewallProxyNotes: '' },
      logistics: { loadFloor: 'Piano Terra', hasParking: false, hasLift: false, stairsDetails: '', hasEmptyStorage: false, emptyStorageNotes: '' },
      equipment: {
        audio: { present: false, hasPA: false, paNotes: '', hasMics: false, micsNotes: '', hasMixerOuts: false, mixerNotes: '' },
        video: { present: false, hasTV: false, hasProjector: false, hasLedwall: false, hasMonitorGobo: false, signals: [], notes: '' },
        hasLights: false, lightsNotes: '', hasPerimeterSockets: true
      },
      generalSurveyNotes: '',
      photos: []
    };
    setActiveLoc(newLoc); setIsEditing(true);
  };

  const handleSave = () => {
    if (!activeLoc) return;
    const exists = locations.find(l => l.id === activeLoc.id);
    if (exists) onUpdateLocation(activeLoc); else onAddLocation(activeLoc);
    setIsEditing(false); setActiveLoc(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !activeLoc) return;

      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setActiveLoc(prev => {
                      if (!prev) return null;
                      return { ...prev, photos: [...(prev.photos || []), ev.target!.result as string] };
                  });
              }
          };
          reader.readAsDataURL(file);
      });
  };

  const removePhoto = (index: number) => {
      if (!activeLoc) return;
      setActiveLoc({
          ...activeLoc,
          photos: (activeLoc.photos || []).filter((_, i) => i !== index)
      });
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  // --- LIST LOGIC ---
  const filteredLocations = useMemo(() => {
      return locations.filter(l => 
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          l.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [locations, searchTerm]);

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const currentItems = filteredLocations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination on search
  React.useEffect(() => setCurrentPage(1), [searchTerm]);

  if (isEditing && activeLoc) {
    return (
      <div className="bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl h-[calc(100vh-140px)] flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin className="text-glr-accent" />{locations.find(l => l.id === activeLoc.id) ? 'Modifica Location' : 'Nuova Location'}</h2>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COL 1: GENERAL & ACCESS */}
            <div className="space-y-4">
                <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2">Dati Generali & Accesso</h3>
                <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 space-y-4">
                    <div><label className="block text-xs text-gray-400 mb-1">Nome Location</label><input type="text" value={activeLoc.name} onChange={e => setActiveLoc({...activeLoc, name: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white font-bold" /></div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-3"><label className="block text-xs text-gray-400 mb-1">Indirizzo</label><input type="text" value={activeLoc.address} onChange={e => setActiveLoc({...activeLoc, address: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white" /></div>
                        <div className="col-span-1"><label className="block text-xs text-gray-400 mb-1">MQ Sala</label><input type="number" value={activeLoc.hallSizeMQ} onChange={e => setActiveLoc({...activeLoc, hallSizeMQ: parseInt(e.target.value) || 0})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-center" /></div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Link Google Maps</label><input type="text" value={activeLoc.mapsLink} onChange={e => setActiveLoc({...activeLoc, mapsLink: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-xs" /></div>
                        <div className="mt-5"><label className="flex items-center gap-2 cursor-pointer bg-red-900/20 border border-red-900/50 px-3 py-2 rounded hover:bg-red-900/30"><input type="checkbox" checked={activeLoc.isZtl} onChange={e => setActiveLoc({...activeLoc, isZtl: e.target.checked})} className="w-4 h-4 rounded bg-glr-900 border-glr-700 text-red-500 focus:ring-red-500" /><span className="text-sm text-red-300 font-bold">Zona ZTL</span></label></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs text-gray-400 mb-1">Referente</label><input type="text" value={activeLoc.contactName} onChange={e => setActiveLoc({...activeLoc, contactName: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white" /></div>
                        <div><label className="block text-xs text-gray-400 mb-1">Telefono</label><input type="text" value={activeLoc.contactPhone} onChange={e => setActiveLoc({...activeLoc, contactPhone: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white" /></div>
                    </div>
                    <div><label className="block text-xs text-gray-400 mb-1">Orari Accesso & Pause</label><textarea value={activeLoc.accessHours} onChange={e => setActiveLoc({...activeLoc, accessHours: e.target.value})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white h-24 text-sm" /></div>
                </div>
            </div>

            {/* COL 2: LOGISTICS & POWER */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2"><Truck size={16}/> Logistica</h3>
                    <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs text-gray-400 mb-1">Piano Scarico</label><input type="text" value={activeLoc.logistics.loadFloor} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, loadFloor: e.target.value}})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" /></div>
                            <div><label className="block text-xs text-gray-400 mb-1">Dettagli Scale</label><input type="text" value={activeLoc.logistics.stairsDetails} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, stairsDetails: e.target.value}})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Larghezza, rampe..." /></div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasParking} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasParking: e.target.checked}})} /><span className="text-sm text-gray-300">Parcheggio Furgoni</span></label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasLift} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasLift: e.target.checked}})} /><span className="text-sm text-gray-300">Montacarichi</span></label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasEmptyStorage} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasEmptyStorage: e.target.checked}})} /><span className="text-sm text-gray-300">Stipaggio Vuoti</span></label>
                        </div>
                        {activeLoc.logistics.hasEmptyStorage && (<div><label className="block text-xs text-gray-400 mb-1">Note Stipaggio</label><input type="text" value={activeLoc.logistics.emptyStorageNotes} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, emptyStorageNotes: e.target.value}})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Dove vanno messi i vuoti?" /></div>)}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2"><Zap size={16}/> Corrente Elettrica</h3>
                    <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 space-y-4">
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={activeLoc.power.hasCivil} onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, hasCivil: e.target.checked}})} className="w-5 h-5 rounded bg-glr-800 border-glr-600 text-glr-accent"/><span className="text-sm text-white font-bold">Civile</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={activeLoc.power.hasIndustrial} onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, hasIndustrial: e.target.checked}})} className="w-5 h-5 rounded bg-glr-800 border-glr-600 text-glr-accent"/><span className="text-sm text-white font-bold">Industriale</span></label>
                        </div>
                        {activeLoc.power.hasIndustrial && (
                            <div className="bg-glr-800 p-3 rounded border border-glr-600">
                                <span className="text-xs text-gray-400 block mb-2 font-bold uppercase">Prese Industriali:</span>
                                <div className="flex flex-wrap gap-4">
                                    {['16A', '32A', '63A', '128A'].map(amp => (<label key={amp} className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={activeLoc.power.industrialSockets.includes(amp)} onChange={() => setActiveLoc({...activeLoc, power: {...activeLoc.power, industrialSockets: toggleArrayItem(activeLoc.power.industrialSockets, amp)}})} className="rounded bg-glr-900 border-glr-700"/><span className="text-sm text-gray-300">{amp}</span></label>))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Distanza Quadro (metri)</label><div className="flex items-center gap-2"><Ruler size={16} className="text-gray-500"/><input type="number" value={activeLoc.power.distanceFromPanel} onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, distanceFromPanel: parseInt(e.target.value) || 0}})} className="w-full bg-glr-800 border border-glr-600 rounded p-2 text-white" /></div></div>
                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-red-900/20 border border-red-900/50 rounded h-fit self-end mb-1"><input type="checkbox" checked={activeLoc.power.requiresGenerator} onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, requiresGenerator: e.target.checked}})} className="text-red-500 focus:ring-red-500 bg-glr-800 border-glr-600"/><span className="text-sm text-red-200 font-bold">Serve Generatore</span></label>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* MIDDLE ROW: EQUIPMENT & IT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2"><Monitor size={16}/> Dotazioni Sala</h3>
                <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 h-full">
                    <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer p-3 bg-glr-800 border border-glr-600 rounded hover:bg-glr-700 transition-colors"><input type="checkbox" checked={activeLoc.equipment.hasPerimeterSockets} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, hasPerimeterSockets: e.target.checked}})} className="w-5 h-5 rounded bg-glr-900 border-glr-700 text-glr-accent"/><span className="text-sm text-white font-bold">Prese a muro perimetrali presenti</span></label></div>
                    <div className="space-y-6">
                        <div className="p-3 bg-glr-800/50 rounded border border-glr-700/50">
                            <label className="flex items-center gap-2 font-bold text-white mb-2"><input type="checkbox" checked={activeLoc.equipment.audio.present} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, present: e.target.checked}}})} className="w-4 h-4 rounded text-glr-accent"/><Speaker size={16} className="text-gray-400" /> Audio</label>
                            {activeLoc.equipment.audio.present && (
                                <div className="ml-6 space-y-3 pt-2">
                                    <div className="space-y-1"><label className="flex items-center gap-2 text-sm text-gray-300 font-bold"><input type="checkbox" checked={activeLoc.equipment.audio.hasPA} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasPA: e.target.checked}}})} /> Impianto Residente</label>{activeLoc.equipment.audio.hasPA && <input type="text" placeholder="Specifiche Impianto" value={activeLoc.equipment.audio.paNotes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, paNotes: e.target.value}}})} className="w-full bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>}</div>
                                    <div className="space-y-1"><label className="flex items-center gap-2 text-sm text-gray-300 font-bold"><input type="checkbox" checked={activeLoc.equipment.audio.hasMics} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasMics: e.target.checked}}})} /> Microfonia Residente</label>{activeLoc.equipment.audio.hasMics && <input type="text" placeholder="Specifiche Microfoni" value={activeLoc.equipment.audio.micsNotes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, micsNotes: e.target.value}}})} className="w-full bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>}</div>
                                    <div className="space-y-1"><label className="flex items-center gap-2 text-sm text-gray-300 font-bold"><input type="checkbox" checked={activeLoc.equipment.audio.hasMixerOuts} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasMixerOuts: e.target.checked}}})} /> Uscite Mixer</label>{activeLoc.equipment.audio.hasMixerOuts && <input type="text" placeholder="Specifiche Mixer" value={activeLoc.equipment.audio.mixerNotes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, mixerNotes: e.target.value}}})} className="w-full bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>}</div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-glr-800/50 rounded border border-glr-700/50">
                            <label className="flex items-center gap-2 font-bold text-white mb-2"><input type="checkbox" checked={activeLoc.equipment.video.present} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, present: e.target.checked}}})} className="w-4 h-4 rounded text-glr-accent"/><Monitor size={16} className="text-gray-400" /> Video</label>
                            {activeLoc.equipment.video.present && (
                                <div className="ml-6 space-y-3 pt-2">
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-300">
                                        <label className="flex items-center gap-1"><input type="checkbox" checked={activeLoc.equipment.video.hasTV} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasTV: e.target.checked}}})} /> TV</label>
                                        <label className="flex items-center gap-1"><input type="checkbox" checked={activeLoc.equipment.video.hasProjector} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasProjector: e.target.checked}}})} /> Proiettore</label>
                                        <label className="flex items-center gap-1"><input type="checkbox" checked={activeLoc.equipment.video.hasLedwall} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasLedwall: e.target.checked}}})} /> Ledwall</label>
                                        <label className="flex items-center gap-1"><input type="checkbox" checked={activeLoc.equipment.video.hasMonitorGobo} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasMonitorGobo: e.target.checked}}})} /> Monitor Gobo</label>
                                    </div>
                                    <div className="border-t border-glr-700 pt-2">
                                        <span className="text-xs text-gray-500 block mb-1">Segnali:</span>
                                        <div className="flex gap-3 mb-2">{['HDMI', 'VGA', 'SDI'].map(sig => (<label key={sig} className="flex items-center gap-1 cursor-pointer text-xs text-gray-300"><input type="checkbox" checked={activeLoc.equipment.video.signals.includes(sig)} onChange={() => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, signals: toggleArrayItem(activeLoc.equipment.video.signals, sig)}}})} />{sig}</label>))}</div>
                                        <input type="text" placeholder="Note Video..." value={activeLoc.equipment.video.notes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, notes: e.target.value}}})} className="w-full bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-glr-800/50 rounded border border-glr-700/50">
                            <label className="flex items-center gap-2 font-bold text-white mb-2">
                                <input type="checkbox" checked={activeLoc.equipment.hasLights} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, hasLights: e.target.checked}})} className="w-4 h-4 rounded text-glr-accent"/>
                                <Zap size={16} className="text-gray-400" /> Luci Residenti
                            </label>
                            {activeLoc.equipment.hasLights && (
                                <div className="ml-6 pt-2">
                                    <input type="text" placeholder="Descrizione luci (es. piazzato americano, teste mobili...)" value={activeLoc.equipment.lightsNotes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, lightsNotes: e.target.value}})} className="w-full bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2"><Network size={16}/> Rete & IT</h3>
                <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 h-full">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-red-900/10 border border-red-900/30 rounded w-fit mb-4"><input type="checkbox" checked={activeLoc.network.isUnavailable} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, isUnavailable: e.target.checked}})} className="w-4 h-4 rounded bg-glr-800 border-glr-600 text-red-400 focus:ring-red-400" /><span className="text-sm text-red-300 font-bold">Rete NON Disponibile</span></label>
                    {!activeLoc.network.isUnavailable && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex gap-8">
                                <label className="flex items-center gap-2 p-2 bg-glr-800 rounded border border-glr-600 w-full justify-center"><input type="checkbox" checked={activeLoc.network.hasWired} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, hasWired: e.target.checked}})} className="rounded text-glr-accent"/><span className="text-sm text-white font-bold">Cablata</span></label>
                                <label className="flex items-center gap-2 p-2 bg-glr-800 rounded border border-glr-600 w-full justify-center"><input type="checkbox" checked={activeLoc.network.hasWifi} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, hasWifi: e.target.checked}})} className="rounded text-glr-accent"/><span className="text-sm text-white font-bold">Wi-Fi</span></label>
                            </div>
                            <div className="bg-glr-800/50 p-3 rounded border border-glr-700/50">
                                <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={activeLoc.network.hasWallLan} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, hasWallLan: e.target.checked}})} /><span className="text-sm text-white font-bold">Lan al muro presente</span></label>
                                {activeLoc.network.hasWallLan && (<div className="flex items-center gap-2 animate-fade-in pl-6"><span className="text-xs text-gray-400">Distanza da Regia:</span><input type="number" value={activeLoc.network.wallLanDistance} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, wallLanDistance: parseInt(e.target.value) || 0}})} className="w-24 bg-glr-900 border border-glr-600 rounded px-2 py-1 text-white text-sm" placeholder="mt" /><span className="text-xs text-gray-400">metri</span></div>)}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 mb-1">Indirizzamento IP</label><select value={activeLoc.network.addressing} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, addressing: e.target.value as any}})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"><option value="DHCP">DHCP</option><option value="STATIC">Statico</option></select></div>
                                {activeLoc.network.addressing === 'STATIC' && (<div><label className="block text-xs text-gray-400 mb-1">Dettagli IP</label><input type="text" value={activeLoc.network.staticDetails} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, staticDetails: e.target.value}})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Gateway, Subnet..." /></div>)}
                            </div>
                            <div><label className="block text-xs text-gray-400 mb-1">Firewall / Proxy / Note IT</label><input type="text" value={activeLoc.network.firewallProxyNotes} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, firewallProxyNotes: e.target.value}})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Note su blocchi o accessi..." /></div>
                        </div>
                    )}
                </div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2 mb-2"><FileText size={16}/> Note Generali Sopralluogo</h3>
                    <textarea value={activeLoc.generalSurveyNotes} onChange={e => setActiveLoc({...activeLoc, generalSurveyNotes: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-4 text-white h-48 text-sm" placeholder="Impressioni generali, criticità..." />
                </div>
                <div>
                    <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2 mb-2"><ImageIcon size={16}/> Foto Location</h3>
                    <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 h-48 overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                            {(activeLoc.photos || []).map((photo, idx) => (
                                <div key={idx} className="relative group aspect-square rounded overflow-hidden border border-glr-600">
                                    <img src={photo} alt={`Foto ${idx}`} className="w-full h-full object-cover"/>
                                    <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                </div>
                            ))}
                            <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed border-glr-600 rounded aspect-square cursor-pointer hover:bg-glr-800 hover:border-glr-400 transition-colors">
                                <Upload size={24} className="text-gray-400"/>
                                <span className="text-xs text-gray-500 mt-1">Carica Foto</span>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple className="hidden"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-glr-700 shrink-0">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400"><Save size={18} /> Salva Location</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-white">Database Locations</h2>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Cerca location..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-glr-800 border border-glr-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-glr-accent outline-none"
                />
            </div>
            <button onClick={handleNew} className="flex items-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"><Plus size={20} /> Nuova Location</button>
        </div>
      </div>

      {/* LIST TABLE VIEW */}
      <div className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col flex-1 overflow-hidden shadow-lg">
          <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                  <thead className="bg-glr-900 text-gray-400 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="p-4 border-b border-glr-700">Nome Location</th>
                          <th className="p-4 border-b border-glr-700">Indirizzo</th>
                          <th className="p-4 border-b border-glr-700">Contatti</th>
                          <th className="p-4 border-b border-glr-700 text-center">Specifiche</th>
                          <th className="p-4 border-b border-glr-700 text-right">Azioni</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-glr-700">
                      {currentItems.map(loc => (
                          <tr key={loc.id} className="hover:bg-glr-700/30 transition-colors group">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      {loc.photos && loc.photos.length > 0 ? (
                                          <img src={loc.photos[0]} alt="Thumb" className="w-10 h-10 rounded object-cover border border-glr-600"/>
                                      ) : (
                                          <div className="w-10 h-10 rounded bg-glr-900 border border-glr-600 flex items-center justify-center text-gray-500"><MapPin size={16}/></div>
                                      )}
                                      <div>
                                          <p className="font-bold text-white text-base group-hover:text-glr-accent transition-colors">{loc.name}</p>
                                          {loc.isZtl && <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded border border-red-800 font-bold">ZTL</span>}
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4 text-gray-300 max-w-xs truncate" title={loc.address}>{loc.address}</td>
                              <td className="p-4">
                                  <div className="text-gray-300 flex items-center gap-2"><Phone size={12} className="text-glr-accent"/> {loc.contactName}</div>
                                  <div className="text-gray-500 text-xs pl-5">{loc.contactPhone}</div>
                              </td>
                              <td className="p-4">
                                  <div className="flex justify-center gap-2">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${loc.power.requiresGenerator ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-green-900/30 text-green-300 border-green-800'}`}>{loc.power.requiresGenerator ? 'Generatore' : 'Corrente OK'}</span>
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${loc.network.isUnavailable ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-blue-900/30 text-blue-300 border-blue-800'}`}>{loc.network.isUnavailable ? 'No Rete' : 'Rete OK'}</span>
                                  </div>
                              </td>
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {loc.mapsLink && (<a href={loc.mapsLink} target="_blank" rel="noreferrer" className="p-1.5 bg-glr-900 rounded text-blue-400 hover:text-white border border-glr-600 hover:border-blue-500 transition-colors" title="Google Maps"><ExternalLink size={16} /></a>)}
                                      <button onClick={() => { setActiveLoc(loc); setIsEditing(true); }} className="p-1.5 bg-glr-900 rounded text-gray-300 hover:text-white border border-glr-600 hover:border-glr-400 transition-colors" title="Modifica"><Edit3 size={16} /></button>
                                      <button onClick={() => onDeleteLocation(loc.id)} className="p-1.5 bg-red-900/20 rounded text-red-400 hover:text-red-200 border border-red-900 hover:border-red-500 transition-colors" title="Elimina"><Trash2 size={16} /></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {currentItems.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Nessuna location trovata.</td></tr>
                      )}
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
