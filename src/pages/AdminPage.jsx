import React, { useState } from 'react';
import { useQueue } from '../hooks/useQueue';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { Trash2, SkipForward, Play, LayoutDashboard, ListMusic, Users, Clock, Music, Settings } from 'lucide-react';

// Dashboard Components
import { StatsCard } from '../components/Dashboard/StatsCard';
import RequestsChart from '../components/Dashboard/RequestsChart';
import PopularSongsList from '../components/Dashboard/PopularSongsList';
import SettingsTab from '../components/Dashboard/SettingsTab';

export default function AdminPage() {
    const { queue, nowPlaying, removeSong, playNext, updateStatus } = useQueue();
    const { establishment, loading } = useEstablishment();
    const { stats, loading: statsLoading } = useAdminStats();

    // Tabs state: 'queue' | 'dashboard'
    const [activeTab, setActiveTab] = useState('queue');

    // QR Logic
    const requestUrl = establishment
        ? `${window.location.origin}/e/${establishment.slug}/request`
        : '';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(requestUrl)}`;

    const handlePlayNow = async (song) => {
        if (nowPlaying) {
            await updateStatus(nowPlaying.id, 'played');
        }
        await updateStatus(song.id, 'playing');
    };

    if (loading) return <div className="p-8 text-center">Carregando admin...</div>;
    if (!establishment) return <div className="p-8 text-center">Estabelecimento não encontrado</div>;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-neon-purple tracking-tight">{establishment.name}</h2>
                    <p className="text-gray-400 text-sm">Painel Administrativo</p>
                </div>

                {/* TABS NAVIGATION */}
                <div className="flex bg-white/5 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'queue' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <ListMusic className="w-4 h-4" />
                        Fila de Músicas
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Configurações
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[500px]">
                {activeTab === 'queue' ? (
                    /* === QUEUE TAB === */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-6 rounded-xl border border-white/10">
                            <div className="bg-white p-2 rounded-lg shadow-lg">
                                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mix-blend-multiply" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">QR Code de Pedidos</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Coloque este QR Code nas mesas para que os clientes peçam músicas diretamente.
                                </p>
                                <a href={requestUrl} target="_blank" rel="noreferrer" className="text-neon-green text-sm hover:underline font-mono">
                                    {requestUrl}
                                </a>
                            </div>
                        </div>

                        {/* Now Playing */}
                        {nowPlaying && (
                            <section className="bg-gradient-to-r from-neon-purple/20 to-transparent border border-neon-purple/30 p-6 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Music className="w-32 h-32" />
                                </div>
                                <h3 className="text-xs uppercase tracking-widest text-neon-purple mb-4 font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                                    Tocando Agora
                                </h3>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <img src={nowPlaying.thumbnail_url} className="w-16 h-16 rounded-lg shadow-lg" alt="Capa" />
                                        <div>
                                            <p className="text-xl font-bold text-white">{nowPlaying.title}</p>
                                            <p className="text-sm text-gray-300">{nowPlaying.channel_title}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={playNext}
                                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-6 py-3 rounded-xl transition-all border border-red-500/20 shadow-lg hover:shadow-red-500/10"
                                    >
                                        <SkipForward size={20} /> <span className="hidden md:inline">Pular Música</span>
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* List */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Próximas na Fila <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{queue.length}</span>
                            </h3>

                            <div className="space-y-2">
                                {queue.map((item) => (
                                    <div key={item.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex items-center gap-4 transition-all group border border-transparent hover:border-white/10">
                                        <img src={item.thumbnail_url} className="w-12 h-10 object-cover rounded opacity-60 group-hover:opacity-100 transition-opacity" alt="Thumb" />

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-white">{item.title}</p>
                                            <p className="text-xs text-gray-500">{item.channel_title}</p>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handlePlayNow(item)}
                                                className="p-2 hover:bg-neon-green/20 text-gray-400 hover:text-neon-green rounded-lg transition-colors"
                                            >
                                                <Play size={18} />
                                            </button>
                                            <button
                                                onClick={() => removeSong(item.id)}
                                                className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {queue.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                                        <Music className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                                        <p className="text-gray-500 text-lg">A fila está vazia.</p>
                                        <p className="text-gray-600 text-sm">Escaneie o QR Code para começar a festa!</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                ) : activeTab === 'settings' ? (
                    /* === SETTINGS TAB === */
                    <SettingsTab establishment={establishment} />
                ) : (
                    /* === DASHBOARD TAB === */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {statsLoading ? (
                            <div className="text-center py-20 text-gray-500">
                                <div className="animate-spin w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full mx-auto mb-4"></div>
                                Carregando estatísticas...
                            </div>
                        ) : (
                            <>
                                {/* KPI CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatsCard
                                        title="Total de Pedidos"
                                        value={stats.totalRequests}
                                        icon={ListMusic}
                                        subtext="Últimos 30 dias"
                                    />
                                    <StatsCard
                                        title="Usuários Únicos"
                                        value={stats.uniqueUsers}
                                        icon={Users}
                                    />
                                    <StatsCard
                                        title="Tempo Médio de Espera"
                                        value={`${stats.avgWaitTime} min`}
                                        icon={Clock}
                                    />
                                </div>

                                {/* CHARTS ROW */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Bar Chart */}
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                        <h3 className="text-lg font-bold mb-6">Pedidos por Dia</h3>
                                        <RequestsChart data={stats.requestsOverTime} />
                                    </div>

                                    {/* Top Songs */}
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                        <h3 className="text-lg font-bold mb-6">Top 5 Mais Pedidas</h3>
                                        <PopularSongsList songs={stats.popularSongs} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
