
import React, { useState } from 'react';
import { AppSettings, RolePermissions } from '../types';
import { Save, Building2, DollarSign, Calendar, Database, AlertCircle, CheckCircle, Shield, Lock, Briefcase, Plus, Trash2, Tag, Eye, Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'ECONOMICS' | 'INTEGRATIONS' | 'SYSTEM' | 'ROLES'>('COMPANY');
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const handleSave = () => {
      try {
          onUpdateSettings(localSettings);
          setStatusMsg({ type: 'success', text: 'Impostazioni salvate con successo!' });
          setTimeout(() => setStatusMsg(null), 3000);
      } catch (err) {
          setStatusMsg({ type: 'error', text: 'Errore durante il salvataggio.' });
      }
  };

  const updateField = (field: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const updatePermission = (role: 'MANAGER' | 'TECH', perm: keyof RolePermissions) => {
      setLocalSettings(prev => ({
          ...prev,
          permissions: {
              ...prev.permissions,
              [role]: {
                  ...prev.permissions[role],
                  [perm]: !prev.permissions[role][perm]
              }
          }
      }));
  };

  const addRole = () => {
      if (!newRoleName.trim()) return;
      const currentRoles = localSettings.crewRoles || [];
      if (!currentRoles.includes(newRoleName)) {
          setLocalSettings(prev => ({
              ...prev,
              crewRoles: [...currentRoles, newRoleName]
          }));
          setNewRoleName('');
      }
  };

  const removeRole = (role: string) => {
      setLocalSettings(prev => ({
          ...prev,
          crewRoles: prev.crewRoles.filter(r => r !== role)
      }));
  };

  // --- PERMISSION DEFINITIONS ---
  
  // 1. Menu Visibility (Navigation)
  const VIEW_PERMISSIONS: { id: keyof RolePermissions; label: string }[] = [
      { id: 'canViewDashboard', label: 'Dashboard' },
      { id: 'canViewTasks', label: 'Task & Attività' },
      { id: 'canViewJobs', label: 'Schede Lavoro' },
      { id: 'canViewKits', label: 'Kit & Liste' },
      { id: 'canViewRentals', label: 'Noleggi' },
      { id: 'canViewInventory', label: 'Magazzino' },
      { id: 'canViewLocations', label: 'Locations' },
      { id: 'canViewCrew', label: 'Crew & Tecnici' },
      { id: 'canViewExpenses', label: 'Rimborsi' },
      { id: 'canViewCompany', label: 'Gestione Azienda' },
  ];

  // 2. Operational Actions
  const ACTION_PERMISSIONS: { id: keyof RolePermissions; label: string }[] = [
      { id: 'canManageJobs', label: 'Crea/Modifica Schede Lavoro' },
      { id: 'canDeleteJobs', label: 'Elimina Schede Lavoro' },
      { id: 'canViewBudget', label: 'Visualizza Budget Economico' },
      { id: 'canManageCrew', label: 'Gestione Anagrafiche Crew' },
      { id: 'canManageInventory', label: 'Gestione Magazzino (Add/Edit)' },
      { id: 'canManageLocations', label: 'Gestione Locations (Add/Edit)' },
      { id: 'canManageRentals', label: 'Gestione Noleggi' },
      { id: 'canManageExpenses', label: 'Gestione/Approvazione Rimborsi' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 /> Impostazioni Sistema
          </h2>
          <button onClick={handleSave} className="bg-glr-accent text-glr-900 font-bold px-6 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20">
              <Save size={20}/> Salva Modifiche
          </button>
       </div>

       {statusMsg && (
           <div className={`p-3 rounded-lg border flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-red-900/30 border-red-600 text-red-400'}`}>
               {statusMsg.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
               {statusMsg.text}
           </div>
       )}

       <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden">
           {/* Tabs */}
           <div className="flex border-b border-glr-700 bg-glr-900/50 overflow-x-auto">
               <button onClick={() => setActiveTab('COMPANY')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'COMPANY' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Building2 size={16}/> Dati Aziendali
               </button>
               <button onClick={() => setActiveTab('ECONOMICS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'ECONOMICS' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <DollarSign size={16}/> Parametri Economici
               </button>
               <button onClick={() => setActiveTab('INTEGRATIONS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'INTEGRATIONS' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Calendar size={16}/> Integrazioni
               </button>
               <button onClick={() => setActiveTab('ROLES')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'ROLES' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Shield size={16}/> Ruoli & Permessi
               </button>
               <button onClick={() => setActiveTab('SYSTEM')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'SYSTEM' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Database size={16}/> Backup
               </button>
           </div>

           <div className="p-8">
               
               {/* TAB: COMPANY */}
               {activeTab === 'COMPANY' && (
                   <div className="max-w-2xl space-y-4">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Intestazione Documenti & Report</h3>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Ragione Sociale</label>
                           <input type="text" value={localSettings.companyName} onChange={e => updateField('companyName', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Partita IVA / Codice Fiscale</label>
                           <input type="text" value={localSettings.pIva} onChange={e => updateField('pIva', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Indirizzo Sede Legale</label>
                           <input type="text" value={localSettings.address} onChange={e => updateField('address', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Banca d'Appoggio</label>
                                <input type="text" value={localSettings.bankName} onChange={e => updateField('bankName', e.target.value)} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">IBAN</label>
                                <input type="text" value={localSettings.iban} onChange={e => updateField('iban', e.target.value)} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                       </div>
                   </div>
               )}

               {/* TAB: ECONOMICS */}
               {activeTab === 'ECONOMICS' && (
                   <div className="max-w-2xl space-y-4">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Parametri di Calcolo Automatico</h3>
                       <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Diaria Giornaliera Standard (€)</label>
                                <input type="number" value={localSettings.defaultDailyIndemnity} onChange={e => updateField('defaultDailyIndemnity', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                                <p className="text-[10px] text-gray-500 mt-1">Utilizzata per calcolare in automatico le trasferte dei tecnici interni.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Rimborso Chilometrico (€/km)</label>
                                <input type="number" step="0.01" value={localSettings.kmCost} onChange={e => updateField('kmCost', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                                <p className="text-[10px] text-gray-500 mt-1">Costo ACI standard per rimborsi auto propria.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Aliquota IVA Default (%)</label>
                                <input type="number" value={localSettings.defaultVatRate} onChange={e => updateField('defaultVatRate', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                       </div>
                   </div>
               )}

               {/* TAB: INTEGRATIONS */}
               {activeTab === 'INTEGRATIONS' && (
                   <div className="max-w-2xl space-y-6">
                       <h3 className="text-lg font-bold text-white mb-2 border-b border-glr-700 pb-2 flex items-center gap-2">
                           <Calendar size={20}/> Google Calendar API
                       </h3>
                       <div className="bg-blue-900/20 border border-blue-800 p-4 rounded text-sm text-blue-200 mb-4">
                           <p>Per abilitare la sincronizzazione automatica dei lavori sul calendario aziendale, è necessario creare un progetto su <b>Google Cloud Console</b> e generare le credenziali OAuth 2.0.</p>
                       </div>

                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs text-gray-400 mb-1">Google Client ID</label>
                               <input type="text" value={localSettings.googleCalendarClientId} onChange={e => updateField('googleCalendarClientId', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-mono text-xs" placeholder="xxx-xxx.apps.googleusercontent.com"/>
                           </div>
                           <div>
                               <label className="block text-xs text-gray-400 mb-1">Google Client Secret</label>
                               <input type="password" value={localSettings.googleCalendarClientSecret} onChange={e => updateField('googleCalendarClientSecret', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-mono text-xs" placeholder="Inserisci Secret Key"/>
                           </div>
                            <div>
                               <label className="block text-xs text-gray-400 mb-1">ID Calendario Principale</label>
                               <input type="text" value={localSettings.googleCalendarId} onChange={e => updateField('googleCalendarId', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="primary o indirizzo email calendario"/>
                           </div>
                       </div>
                   </div>
               )}

               {/* TAB: ROLES & PERMISSIONS */}
               {activeTab === 'ROLES' && (
                   <div className="space-y-8">
                        {/* SECTION 1: CREW ROLES (TITLES) */}
                        <div className="max-w-4xl">
                            <h3 className="text-lg font-bold text-white mb-2 border-b border-glr-700 pb-2 flex items-center gap-2">
                                <Briefcase size={20}/> Gestione Ruoli & Etichette
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">Definisci le etichette per i ruoli tecnici (es. Project Manager, Rigger, etc.). Queste opzioni appariranno nelle schede anagrafiche.</p>
                            
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={newRoleName} 
                                    onChange={e => setNewRoleName(e.target.value)} 
                                    placeholder="Nuovo Ruolo (es. Stage Manager)" 
                                    className="bg-glr-900 border border-glr-600 rounded p-2 text-white flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && addRole()}
                                />
                                <button onClick={addRole} className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white font-bold px-4 py-2 rounded transition-colors flex items-center gap-2">
                                    <Plus size={18}/> Aggiungi
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(localSettings.crewRoles || []).map((role) => (
                                    <div key={role} className="flex items-center gap-2 bg-glr-900 border border-glr-700 px-3 py-1.5 rounded-full group">
                                        <span className="text-sm font-bold text-gray-300">{role}</span>
                                        <button onClick={() => removeRole(role)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECTION 2: PERMISSIONS MATRIX */}
                        <div className="max-w-full">
                             <h3 className="text-lg font-bold text-white mb-2 border-b border-glr-700 pb-2 flex items-center gap-2">
                                <Lock size={20}/> Matrice Permessi Applicativo
                            </h3>
                            <div className="bg-yellow-900/20 border border-yellow-800 p-4 rounded text-sm text-yellow-200 mb-6 flex items-start gap-2">
                               <Shield size={16} className="mt-0.5 shrink-0"/>
                               <p>Configura l'accesso alle sezioni del menu e le azioni consentite. L'<b>Amministratore</b> ha sempre accesso completo.</p>
                            </div>

                            {localSettings.permissions ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* MANAGER PERMISSIONS */}
                                    <div className="bg-glr-900 rounded border border-glr-700 p-5">
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2 pb-2 border-b border-glr-700"><Shield size={16} className="text-blue-400"/> Manager / Direttore Tecnico</h4>
                                        <div className="space-y-6">
                                            
                                            {/* Visibility Toggle */}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Eye size={12}/> Visibilità Menu (Sezioni Abilitate)</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {VIEW_PERMISSIONS.map(item => (
                                                        <label key={item.id} className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${localSettings.permissions.MANAGER[item.id] ? 'bg-glr-800' : 'hover:bg-glr-800/50'}`}>
                                                            <input type="checkbox" checked={localSettings.permissions.MANAGER[item.id]} onChange={() => updatePermission('MANAGER', item.id)} className="rounded bg-glr-950 border-glr-600 text-glr-accent"/>
                                                            <span className={`text-sm ${localSettings.permissions.MANAGER[item.id] ? 'text-white font-medium' : 'text-gray-500'}`}>{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action Permissions */}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><SettingsIcon size={12}/> Permessi Operativi</h5>
                                                <div className="space-y-2 pl-2 border-l-2 border-glr-800">
                                                    {ACTION_PERMISSIONS.map(action => (
                                                        <label key={action.id} className="flex items-center gap-3 cursor-pointer">
                                                            <input type="checkbox" checked={localSettings.permissions.MANAGER[action.id]} onChange={() => updatePermission('MANAGER', action.id)} className="rounded bg-glr-950 border-glr-600 text-glr-accent"/>
                                                            <span className={`text-xs ${localSettings.permissions.MANAGER[action.id] ? 'text-gray-200' : 'text-gray-500'}`}>{action.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TECH PERMISSIONS */}
                                    <div className="bg-glr-900 rounded border border-glr-700 p-5">
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2 pb-2 border-b border-glr-700"><Shield size={16} className="text-gray-400"/> Tecnico (Tech)</h4>
                                        <div className="space-y-6">
                                            
                                            {/* Visibility Toggle */}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Eye size={12}/> Visibilità Menu (Sezioni Abilitate)</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {VIEW_PERMISSIONS.map(item => (
                                                        <label key={item.id} className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${localSettings.permissions.TECH[item.id] ? 'bg-glr-800' : 'hover:bg-glr-800/50'}`}>
                                                            <input type="checkbox" checked={localSettings.permissions.TECH[item.id]} onChange={() => updatePermission('TECH', item.id)} className="rounded bg-glr-950 border-glr-600 text-glr-accent"/>
                                                            <span className={`text-sm ${localSettings.permissions.TECH[item.id] ? 'text-white font-medium' : 'text-gray-500'}`}>{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action Permissions */}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><SettingsIcon size={12}/> Permessi Operativi</h5>
                                                <div className="space-y-2 pl-2 border-l-2 border-glr-800">
                                                    {ACTION_PERMISSIONS.map(action => (
                                                        <label key={action.id} className="flex items-center gap-3 cursor-pointer">
                                                            <input type="checkbox" checked={localSettings.permissions.TECH[action.id]} onChange={() => updatePermission('TECH', action.id)} className="rounded bg-glr-950 border-glr-600 text-glr-accent"/>
                                                            <span className={`text-xs ${localSettings.permissions.TECH[action.id] ? 'text-gray-200' : 'text-gray-500'}`}>{action.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : <p className="text-gray-500 italic">Caricamento permessi...</p>}
                        </div>
                   </div>
               )}

               {/* TAB: SYSTEM */}
               {activeTab === 'SYSTEM' && (
                   <div className="max-w-2xl space-y-6">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Gestione Dati</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-glr-900 p-4 rounded border border-glr-700">
                               <h4 className="font-bold text-white mb-2">Esporta Database</h4>
                               <p className="text-xs text-gray-400 mb-4">Scarica un file JSON completo con tutti i lavori, crew, inventario e location.</p>
                               <button className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded text-sm w-full font-bold transition-colors">
                                   Scarica Backup (.json)
                               </button>
                           </div>
                            <div className="bg-glr-900 p-4 rounded border border-glr-700">
                               <h4 className="font-bold text-white mb-2">Importa Dati</h4>
                               <p className="text-xs text-gray-400 mb-4">Ripristina il database da un file di backup precedente.</p>
                               <button className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded text-sm w-full font-bold transition-colors">
                                   Carica Backup
                               </button>
                           </div>
                       </div>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
};
