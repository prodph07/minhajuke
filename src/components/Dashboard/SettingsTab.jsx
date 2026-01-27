import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Save, AlertTriangle, Clock, Hash, Tag, CheckCircle, Monitor, RotateCw, Search } from 'lucide-react';

export default function SettingsTab({ establishment }) {
    // Parse settings or use defaults
    const defaultSettings = {
        max_requests_per_user: 3,
        limit_window_minutes: 10,
        max_duration_seconds: 600,
        forbidden_keywords: [],
        auto_approve: true,
        welcome_message: "Peça sua música favorita!",
        ultra_performance_mode: false,
        force_reload_interval: 0,
        optimize_scale_hack: true,
        optimize_no_logs: true,
        theme_primary_color: '#b026ff',
        theme_secondary_color: '#00ff41',
        background_image_url: '',
        search_provider: 'youtube',
        lastfm_api_key: ''
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
                max_duration_seconds: parseInt(settings.max_duration_seconds),
                force_reload_interval: parseInt(settings.force_reload_interval || 0)
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

                {/* 2.5 PERFORMANCE (TV) */}
                <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <Monitor size={20} />
                        Performance (TV)
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                            <div>
                                <span className="block text-white font-bold">Modo Ultra Performance</span>
                                <span className="text-xs text-gray-500">Oculta TODA a interface (QR Code, nomes) após 10s de música.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="ultra_performance_mode"
                                    checked={settings.ultra_performance_mode || false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                            <div>
                                <span className="block text-white font-bold">Forçar Baixa Resolução (Zoom Hack)</span>
                                <span className="text-xs text-gray-500">Renderiza pequeno (240p) e dá zoom. Essencial para TVs antigas.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="optimize_scale_hack"
                                    checked={settings.optimize_scale_hack !== false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5">
                            <div>
                                <span className="block text-white font-bold">Desativar Logs (Console)</span>
                                <span className="text-xs text-gray-500">Evita que logs de erro encham a memória do navegador.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="optimize_no_logs"
                                    checked={settings.optimize_no_logs !== false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <RotateCw size={14} /> Recarregamento Forçado (Auto-Refresh)
                            </label>
                            <input
                                type="number"
                                name="force_reload_interval"
                                value={settings.force_reload_interval || 0}
                                onChange={handleChange}
                                placeholder="0 = Desativado"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Reinicia a página a cada X músicas para limpar a memória RAM da TV. (Recomendado: 30)</p>
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

                {/* 4. INTEGRAÇÕES (BUSCA) */}
                <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-pink-500 mb-4 flex items-center gap-2">
                        <Search size={20} />
                        Provedor de Busca
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Motor de Busca Principal</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className={`border border-white/10 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${settings.search_provider === 'youtube' ? 'bg-red-500/20 border-red-500' : 'bg-black/30 hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="search_provider"
                                        value="youtube"
                                        checked={settings.search_provider === 'youtube'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="font-bold text-lg">YouTube</span>
                                    <span className="text-xs text-center text-gray-400">Padrão. Pesquisa direta, gasta muita cota.</span>
                                </label>

                                <label className={`border border-white/10 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${settings.search_provider === 'lastfm' ? 'bg-pink-500/20 border-pink-500' : 'bg-black/30 hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="search_provider"
                                        value="lastfm"
                                        checked={settings.search_provider === 'lastfm'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="font-bold text-lg">Last.fm + Cache</span>
                                    <span className="text-xs text-center text-gray-400">Economiza 99% da cota. Requer chave API.</span>
                                </label>

                                <label className={`border border-white/10 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${settings.search_provider === 'unlimited' ? 'bg-purple-500/20 border-purple-500' : 'bg-black/30 hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="search_provider"
                                        value="unlimited"
                                        checked={settings.search_provider === 'unlimited'}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <span className="font-bold text-lg">Ilimitado</span>
                                    <span className="text-xs text-center text-gray-400">Zero Cota. Requer Edge Function.</span>
                                </label>
                            </div>
                        </div>

                        {settings.search_provider === 'lastfm' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm text-gray-400">API Key da Last.fm</label>
                                <input
                                    type="text"
                                    name="lastfm_api_key"
                                    value={settings.lastfm_api_key || ''}
                                    onChange={handleChange}
                                    placeholder="Cole sua chave aqui (32 caracteres)"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-pink-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-500">
                                    Crie uma conta em <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">last.fm/api</a> para obter a chave gratuita.
                                </p>
                            </div>
                        )}
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
