import React, { useState } from 'react';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const data = await api.login(email, password);
            if (data.success) {
                // Save token roughly for session persistence in App.tsx
                localStorage.setItem('glr_token', data.token);
                localStorage.setItem('glr_user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            }
        } catch (err: any) {
            setError(err.message || 'Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl border border-[#334155] p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#f59e0b] rounded-xl flex items-center justify-center font-bold text-3xl text-[#0f172a] shadow-lg shadow-amber-500/20 mx-auto mb-4">
                        GLR
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">GLR HUB</h1>
                    <p className="text-gray-400 text-sm mt-2">Accedi al gestionale di produzione</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1 ml-1">Email Aziendale</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-white focus:border-[#f59e0b] outline-none transition-colors"
                            placeholder="nome@glr.it"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1 ml-1">Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-white focus:border-[#f59e0b] outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#f59e0b] hover:bg-amber-400 text-[#0f172a] font-bold py-3 rounded-lg transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading && <Loader2 size={18} className="animate-spin"/>}
                        {loading ? 'Accesso in corso...' : 'Accedi'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-[#334155] pt-4">
                    <p className="text-xs text-gray-500">GLR Productions Srl &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};