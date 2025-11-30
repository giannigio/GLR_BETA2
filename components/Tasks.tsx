import React, { useState, useMemo } from 'react';
import { Task, Job, CrewMember } from '../types';
import { ClipboardCheck, Plus, CheckCircle, Clock, Trash2, X, Filter, User, Briefcase } from 'lucide-react';

interface TasksProps {
    tasks: Task[];
    jobs: Job[];
    crew: CrewMember[];
    onAddTask: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    currentUser?: { id: string, name: string };
}

export const Tasks: React.FC<TasksProps> = ({ tasks, jobs, crew, onAddTask, onUpdateTask, onDeleteTask, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');
    const [filterScope, setFilterScope] = useState<'MY' | 'ALL'>('ALL');

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [newTaskJobId, setNewTaskJobId] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');

    const handleCreateTask = () => {
        if (!newTaskTitle || !newTaskAssignee) return;
        const task: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            description: newTaskDesc,
            assignedTo: newTaskAssignee,
            jobId: newTaskJobId || undefined,
            createdBy: currentUser?.id || 'system',
            deadline: newTaskDeadline || new Date().toISOString().split('T')[0],
            status: 'PENDING'
        };
        onAddTask(task);
        setIsModalOpen(false);
        // Reset form
        setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskAssignee(''); setNewTaskJobId(''); setNewTaskDeadline('');
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
            const matchesScope = filterScope === 'ALL' || t.assignedTo === currentUser?.id;
            return matchesStatus && matchesScope;
        }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }, [tasks, filterStatus, filterScope, currentUser]);

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardCheck/> Task & Attività</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20">
                    <Plus size={20}/> Nuovo Task
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-glr-800 p-2 rounded-lg border border-glr-700 w-fit shrink-0">
                <div className="flex gap-1 border-r border-glr-700 pr-4 mr-2">
                    <button onClick={() => setFilterScope('MY')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterScope === 'MY' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>I Miei Task</button>
                    <button onClick={() => setFilterScope('ALL')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterScope === 'ALL' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Tutti</button>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setFilterStatus('PENDING')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' : 'text-gray-400 hover:text-white'}`}>In Corso</button>
                    <button onClick={() => setFilterStatus('COMPLETED')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === 'COMPLETED' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'text-gray-400 hover:text-white'}`}>Completati</button>
                    <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterStatus === 'ALL' ? 'bg-glr-700 text-white' : 'text-gray-400 hover:text-white'}`}>Tutti</button>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-lg flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredTasks.length === 0 && <p className="text-center text-gray-500 py-10 italic">Nessun task trovato.</p>}
                    {filteredTasks.map(task => {
                        const job = jobs.find(j => j.id === task.jobId);
                        const assignee = crew.find(c => c.id === task.assignedTo);
                        const isExpired = new Date(task.deadline) < new Date() && task.status === 'PENDING';

                        return (
                            <div key={task.id} className={`p-4 rounded-lg border flex items-center justify-between transition-colors group ${task.status === 'COMPLETED' ? 'bg-glr-900/50 border-glr-700 opacity-70' : 'bg-glr-900 border-glr-600 hover:border-glr-500'}`}>
                                <div className="flex items-start gap-4">
                                    <button onClick={() => onUpdateTask({...task, status: task.status === 'PENDING' ? 'COMPLETED' : 'PENDING'})} 
                                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500 text-transparent hover:border-glr-accent'}`}>
                                        <CheckCircle size={16} fill="currentColor"/>
                                    </button>
                                    <div>
                                        <h4 className={`font-bold text-lg ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</h4>
                                        <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            {assignee && (
                                                <span className="flex items-center gap-1 text-gray-300 bg-glr-800 px-2 py-1 rounded border border-glr-700">
                                                    <User size={12}/> {assignee.name}
                                                </span>
                                            )}
                                            {job && (
                                                <span className="flex items-center gap-1 text-blue-300 bg-blue-900/20 px-2 py-1 rounded border border-blue-800">
                                                    <Briefcase size={12}/> {job.title}
                                                </span>
                                            )}
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded border ${isExpired ? 'text-red-300 bg-red-900/20 border-red-800 font-bold' : 'text-gray-300 bg-glr-800 border-glr-700'}`}>
                                                <Clock size={12}/> Scadenza: {new Date(task.deadline).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-glr-800 rounded opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md shadow-2xl animate-fade-in p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Nuovo Task</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Titolo</label>
                                <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-bold" placeholder="Es. Preparare materiale..." autoFocus/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Descrizione (Opzionale)</label>
                                <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white h-20 text-sm" placeholder="Dettagli aggiuntivi..."/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Assegna a</label>
                                    <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                        <option value="">-- Seleziona --</option>
                                        {crew.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Scadenza</label>
                                    <input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1 font-bold uppercase">Collega a Lavoro (Opzionale)</label>
                                <select value={newTaskJobId} onChange={e => setNewTaskJobId(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                    <option value="">-- Nessun Lavoro --</option>
                                    {jobs.filter(j => j.status !== 'Completato' && j.status !== 'Annullato').map(j => (
                                        <option key={j.id} value={j.id}>{j.title}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">Se colleghi un lavoro, il task apparirà anche nella scheda lavoro (Tab "Task").</p>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-glr-700 hover:bg-glr-600 text-white py-2 rounded font-bold transition-colors">Annulla</button>
                                <button onClick={handleCreateTask} disabled={!newTaskTitle || !newTaskAssignee} className="flex-1 bg-glr-accent text-glr-900 hover:bg-amber-400 py-2 rounded font-bold transition-colors disabled:opacity-50">Crea Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};