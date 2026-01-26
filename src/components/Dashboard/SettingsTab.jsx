import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, AlertTriangle, Clock, Hash, Tag, CheckCircle } from 'lucide-react';

export default function SettingsTab({ establishment }) {
    // Parse settings or use defaults
    const defaultSettings = {
        max_requests_per_user: 3,
        limit_window_minutes: 10,
        max_duration_seconds: 600,
        forbidden_keywords: [],
        auto_approve: true,
        welcome_message: "Peça sua música favorita!"
    };

    const [settings, setSettings] = useState({ ...defaultSettings, ...(establishment.settings || {}) });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleArrayChange = (e) => {
        const val = e.target.value;
        const array = val.split(',').map(s => s.trim()).filter(Boolean);
        setSettings(prev => ({
            ...prev,
            forbidden_keywords: array
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            // Validate numbers
            const finalSettings = {
                ...settings,
                max_requests_per_user: parseInt(settings.max_requests_per_user),
                limit_window_minutes: parseInt(settings.limit_window_minutes),
                max_duration_seconds: parseInt(settings.max_duration_seconds)
            };

            const { error } = await supabase
                .from('establishments')
                .update({ settings: finalSettings })
                .eq('id', establishment.id);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <form onSubmit={handleSave} className="space-y-8">

                {/* 1. LIMITES */}
                <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-neon-purple mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Limites e Restrições
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Hash size={14} /> Máx. Pedidos por Pessoa
                            </label>
                            <input
                                type="number"
                                name="max_requests_per_user"
                                value={settings.max_requests_per_user}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-neon-purple outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Quantas músicas um cliente pode pedir...</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Clock size={14} /> ...a cada X minutos
                            </label>
                            <input
                                type="number"
                                name="limit_window_minutes"
                                value={settings.limit_window_minutes}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-neon-purple outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Intervalo de tempo para renovar o limite.</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Clock size={14} /> Duração Máxima da Música (segundos)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    name="max_duration_seconds"
                                    value={settings.max_duration_seconds}
                                    onChange={handleChange}
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-neon-purple outline-none transition-colors"
                                />
                                <span className="text-gray-500 font-mono">
                                    = {(settings.max_duration_seconds / 60).toFixed(1)} minutos
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. MODERAÇÃO */}
                <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-neon-green mb-4 flex items-center gap-2">
                        <Tag size={20} />
                        Moderação
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Palavras Proibidas (Blacklist)</label>
                            <textarea
                                value={settings.forbidden_keywords?.join(', ')}
                                onChange={handleArrayChange}
                                placeholder="ex: funk, proibidão, remix"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-neon-green outline-none h-24 resize-none"
                            />
                            <p className="text-xs text-gray-500">Separe as palavras por vírgula. Músicas com essas palavras no título serão bloqueadas.</p>
                        </div>

                        <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                            <div>
                                <span className="block text-white font-bold">Aprovação Automática</span>
                                <span className="text-xs text-gray-500">Se desligado, você precisará aprovar cada pedido manualmente (EM BREVE).</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="auto_approve"
                                    checked={settings.auto_approve}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* 3. PERSONALIZAÇÃO */}
                <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Personalização</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Cor Primária (Neon)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        name="theme_primary_color"
                                        value={settings.theme_primary_color || '#b026ff'}
                                        onChange={handleChange}
                                        className="h-10 w-20 bg-transparent border border-white/10 rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">{settings.theme_primary_color || '#b026ff'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Cor Secundária (Destaque)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        name="theme_secondary_color"
                                        value={settings.theme_secondary_color || '#00ff41'}
                                        onChange={handleChange}
                                        className="h-10 w-20 bg-transparent border border-white/10 rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">{settings.theme_secondary_color || '#00ff41'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Imagem de Fundo (URL)</label>
                            <input
                                type="url"
                                name="background_image_url"
                                value={settings.background_image_url || ''}
                                onChange={handleChange}
                                placeholder="https://exemplo.com/imagem.jpg"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-white outline-none"
                            />
                            <p className="text-xs text-gray-500">Cole o link direto de uma imagem.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Mensagem de Boas-Vindas</label>
                            <input
                                type="text"
                                name="welcome_message"
                                value={settings.welcome_message || ''}
                                onChange={handleChange}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-white outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* SAVE BUTTON */}
                <div className="border-t border-white/10 pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${success
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-white text-black hover:bg-gray-200'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            'Salvando...'
                        ) : success ? (
                            <>
                                <CheckCircle size={20} />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
