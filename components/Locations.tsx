
import React, { useState } from 'react';
import { Location } from '../types';
import { MapPin, Phone, Zap, Network, Truck, Monitor, Plus, Edit3, Trash2, Save, X, ExternalLink, Speaker, Box, FileText, Ruler, Eye } from 'lucide-react';

interface LocationsProps {
  locations: Location[];
  onAddLocation: (loc: Location) => void;
  onUpdateLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

export const Locations: React.FC<LocationsProps> = ({ locations, onAddLocation, onUpdateLocation, onDeleteLocation, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeLoc, setActiveLoc] = useState<Location | null>(null);

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
      generalSurveyNotes: ''
    };
    setActiveLoc(newLoc); setIsEditing(true);
  };

  const handleSave = () => {
    if (!activeLoc) return;
    const exists = locations.find(l => l.id === activeLoc.id);
    if (exists) onUpdateLocation(activeLoc); else onAddLocation(activeLoc);
    setIsEditing(false); setActiveLoc(null);
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  if (isEditing && activeLoc) {
    return (
      <div className="bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl max-w-6xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin className="text-glr-accent" />{locations.find(l => l.id === activeLoc.id) ? 'Modifica Location' : 'Nuova Location'}</h2>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* COL 1: GENERAL & ACCESS */}
          <div className="space-y-4 h-full flex flex-col">
            <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2">Dati Generali & Accesso</h3>
            <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50 flex-1 space-y-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

                    {/* LIGHTS SECTION RE-INTRODUCED */}
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

        <div className="col-span-1">
            <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2 mb-2"><FileText size={16}/> Note Generali Sopralluogo</h3>
            <textarea value={activeLoc.generalSurveyNotes} onChange={e => setActiveLoc({...activeLoc, generalSurveyNotes: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-4 text-white h-32 text-sm" placeholder="Impressioni generali, criticità..." />
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-glr-700">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400"><Save size={18} /> Salva Location</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Database Locations</h2>
        <button onClick={handleNew} className="flex items-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"><Plus size={20} /> Nuova Location</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
          <div key={loc.id} className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col hover:border-glr-accent transition-colors group">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold text-white group-hover:text-glr-accent transition-colors">{loc.name}</h3>{loc.isZtl && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800">ZTL</span>}</div>
                <p className="text-sm text-gray-400 flex items-start gap-1 mb-3"><MapPin size={14} className="mt-0.5 shrink-0" /> {loc.address}</p>
                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300"><Phone size={14} className="text-glr-accent" /><span>{loc.contactName} - {loc.contactPhone}</span></div>
                     <div className="flex items-center gap-2 text-gray-300"><Zap size={14} className={loc.power.requiresGenerator ? "text-red-400" : "text-green-400"} /><span>{loc.power.requiresGenerator ? 'Serve Generatore' : `${loc.power.hasCivil ? 'Civile' : ''} ${loc.power.hasIndustrial ? 'Industriale' : ''}`}</span></div>
                </div>
            </div>
            <div className="bg-glr-900 p-3 border-t border-glr-700 flex justify-between items-center text-xs">
                {loc.mapsLink && (<a href={loc.mapsLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline"><ExternalLink size={12} /> Maps</a>)}
                <div className="flex gap-2 ml-auto">
                    <button onClick={() => { setActiveLoc(loc); setIsEditing(true); }} className="text-gray-400 hover:text-white p-1" title="Modifica"><Edit3 size={16} /></button>
                    <button onClick={() => onDeleteLocation(loc.id)} className="text-gray-400 hover:text-red-400 p-1" title="Elimina"><Trash2 size={16} /></button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
