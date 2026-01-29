import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2, Library, Trash2 } from 'lucide-react';
import { searchVideos } from '../../services/youtubeService';
import { supabase } from '../../lib/supabaseClient';
import { useEstablishment } from '../../contexts/EstablishmentContext';

export default function AdminPlaylistTab() {
    const { establishment } = useEstablishment();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Playlists State
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [playlistItems, setPlaylistItems] = useState([]);
    const [loadingList, setLoadingList] = useState(true);

    // Create State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    // Initial Fetch: Get Playlists
    useEffect(() => {
        if (!establishment) return;
        fetchPlaylists();
    }, [establishment]);

    // Fetch Playlists List
    const fetchPlaylists = async () => {
        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('establishment_id', establishment.id)
            .order('created_at', { ascending: true });

        if (!error) {
            setPlaylists(data || []);
            // Select first playlist or active one if available, else null (General)
            // Ideally we need a "General" or active logic. Let's default to the active one or first.
            const active = data?.find(p => p.is_active);
            if (active) setSelectedPlaylistId(active.id);
            else if (data && data.length > 0) setSelectedPlaylistId(data[0].id);
        }
    };

    // Fetch Items when Playlist Changes
    useEffect(() => {
        fetchPlaylistItems();
    }, [establishment, selectedPlaylistId]);

    const fetchPlaylistItems = async () => {
        if (!establishment) return;
        setLoadingList(true);

        let query = supabase
            .from('background_playlists')
            .select('*')
            .eq('establishment_id', establishment.id)
            .order('created_at', { ascending: false });

        if (selectedPlaylistId) {
            query = query.eq('playlist_id', selectedPlaylistId);
        } else {
            // General (NULL playlist_id)
            query = query.is('playlist_id', null);
        }

        const { data, error } = await query;

        if (error) console.error('Error fetching playlist items:', error);
        else setPlaylistItems(data || []);
        setLoadingList(false);
    };

    // AUTO-SEARCH (DEBOUNCE)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setSearching(true);
                try {
                    const videos = await searchVideos(query);
                    setResults(videos);
                } catch (err) {
                    setResults([]);
                } finally {
                    setSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = (e) => e.preventDefault();

    const handleAdd = async (video) => {
        if (!establishment) return;

        try {
            const { error } = await supabase
                .from('background_playlists')
                .insert([{
                    establishment_id: establishment.id,
                    playlist_id: selectedPlaylistId, // Link to current playlist
                    video_id: video.video_id,
                    title: video.title,
                    channel_title: video.channel_title,
                    thumbnail_url: video.thumbnail_url,
                    duration_sec: video.duration_sec || 180
                }]);

            if (error) throw error;

            // Optimistic update or refresh
            // Optimistic update or refresh
            fetchPlaylistItems();
            setQuery('');
            setResults([]);
        } catch (error) {
            alert('Erro ao adicionar à playlist: ' + error.message);
        }
    };

    const handleRemove = async (id) => {
        if (!id) {
            console.error("Erro: Tentativa de remover item sem ID.");
            return;
        }

        try {
            console.log("Tentando remover item da playlist:", id);
            const { error } = await supabase
                .from('background_playlists')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Erro Supabase ao deletar:", error);
                throw error;
            }

            console.log("Item removido com sucesso.");
            fetchPlaylistItems();
        } catch (error) {
            console.error("Erro no handleRemove:", error);
            alert('Erro ao remover: ' + (error.message || 'Erro desconhecido'));
        }
    };

    const updateSettings = async (newSettings) => {
        if (!establishment) return;
        const updatedSettings = { ...establishment.settings, ...newSettings };

        // Optimistic Update (requires parent reload to persist visually if coming from props, but let's try direct update if possible, or just API call)
        // Ideally we should use a context method, but direct DB update works if we rely on realtime or refresh.
        // For now, let's just update DB and rely on Context reload or valid local state if we had it.
        // Actually, let's assume EstablishmentContext will pick it up via Realtime or we manually trigger something.

        try {
            const { error } = await supabase
                .from('establishments')
                .update({ settings: updatedSettings })
                .eq('id', establishment.id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating settings:', err);
            alert('Erro ao salvar modo.');
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        try {
            const { error } = await supabase.from('playlists').insert([{
                establishment_id: establishment.id,
                name: newPlaylistName,
                is_active: playlists.length === 0 // Make active if it's the first one
            }]);

            if (error) throw error;
            await fetchPlaylists();
            setNewPlaylistName('');
            setShowCreateModal(false);
        } catch (error) {
            alert('Erro ao criar playlist: ' + error.message);
        }
    };



    const handleActivatePlaylist = async (id) => {
        try {
            // Deactivate all
            await supabase
                .from('playlists')
                .update({ is_active: false })
                .eq('establishment_id', establishment.id);

            // Activate target
            await supabase
                .from('playlists')
                .update({ is_active: true })
                .eq('id', id);

            fetchPlaylists();
        } catch (error) {
            alert('Erro ao ativar playlist.');
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Library className="text-neon-purple" />
                            Gestão de Playlists
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Crie playlists diferentes para cada momento (ex: "Rock", "Lounge").
                        </p>
                    </div>
                </div>

                {/* PLAYLIST SELECTOR TABS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/10 no-scrollbar">
                    <button
                        onClick={() => setSelectedPlaylistId(null)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-bold transition-all ${selectedPlaylistId === null
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        Geral (Salvas Anteriormente)
                    </button>
                    {playlists.map(p => (
                        <div key={p.id} className="relative group">
                            <button
                                onClick={() => setSelectedPlaylistId(p.id)}
                                className={`px-4 py-2 pr-8 rounded-lg whitespace-nowrap text-sm font-bold transition-all ${selectedPlaylistId === p.id
                                    ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20'
                                    : 'bg-black/30 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {p.name}
                                {p.is_active && <span className="ml-2 text-[10px] bg-green-500 text-black px-1.5 rounded-full">ATIVO</span>}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleActivatePlaylist(p.id); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Ativar esta playlist"
                            >
                                <Check size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3 py-2 rounded-lg whitespace-nowrap text-sm font-bold border border-dashed border-white/30 text-gray-400 hover:text-white hover:border-white transition-all flex items-center gap-1"
                    >
                        <Plus size={16} /> Nova Playlist
                    </button>
                </div>

                {/* CREATE MODAL */}
                {showCreateModal && (
                    <div className="bg-black/50 p-4 rounded-lg mb-6 border border-white/10 flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={e => setNewPlaylistName(e.target.value)}
                            placeholder="Nome da Playlist (ex: Sexta Rock)"
                            className="flex-1 bg-black/30 border border-white/20 rounded-md px-3 py-2 text-white focus:border-neon-purple outline-none"
                            autoFocus
                        />
                        <button onClick={handleCreatePlaylist} className="bg-neon-purple text-white px-4 py-2 rounded-md font-bold text-sm">Criar</button>
                        <button onClick={() => setShowCreateModal(false)} className="text-gray-400 px-3 hover:text-white">Cancelar</button>
                    </div>
                )}



                {/* PLAYBACK MODE SELECTOR */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/5 mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-white text-sm">Modo de Reprodução</h4>
                        <p className="text-xs text-gray-500">Como as músicas serão escolhidas.</p>
                    </div>
                    <div className="flex bg-black/50 p-1 rounded-lg">
                        <button
                            onClick={() => updateSettings({ background_playlist_mode: 'shuffle' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${(!establishment.settings?.background_playlist_mode || establishment.settings?.background_playlist_mode === 'shuffle')
                                ? 'bg-neon-purple text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Aleatório (Sem Repetição)
                        </button>
                        <button
                            onClick={() => updateSettings({ background_playlist_mode: 'sequential' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${(establishment.settings?.background_playlist_mode === 'sequential')
                                ? 'bg-neon-purple text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Sequencial
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquisar música para a playlist..."
                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors text-white"
                    />
                    <div className="bg-neon-purple/20 text-neon-purple p-3 rounded-lg flex items-center justify-center min-w-[3rem]">
                        {searching ? <Loader2 className="animate-spin" /> : <Search />}
                    </div>
                </form>

                {/* Search Results */}
                {results.length > 0 && (
                    <div className="mb-8 space-y-2 border-b border-white/10 pb-6">
                        <h4 className="text-sm font-bold uppercase text-neon-green mb-2">Resultados da Busca</h4>
                        {results.map((video) => (
                            <div key={video.video_id} className="bg-white/10 p-3 rounded-xl flex items-center gap-4 hover:bg-white/20 transition-colors">
                                <img src={video.thumbnail_url} alt={video.title} className="w-16 h-12 object-cover rounded shadow-md" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate text-white text-sm">{video.title}</h3>
                                    <p className="text-xs text-gray-400 truncate">{video.channel_title}</p>
                                </div>
                                <button
                                    onClick={() => handleAdd(video)}
                                    className="p-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 transition-colors"
                                    title="Adicionar à Playlist"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Saved Playlist */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase text-gray-500 mb-2 flex justify-between">
                        Músicas na Playlist: {selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.name : 'Geral'} <span>{playlistItems.length}</span>
                    </h4>

                    {loadingList ? (
                        <div className="text-center py-4 text-gray-500">Carregando playlist...</div>
                    ) : playlistItems.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-gray-500">
                            Playlist vazia. Adicione músicas buscando ou importando.
                        </div>
                    ) : (
                        playlistItems.map((item) => (
                            <div key={item.id} className="bg-white/5 p-3 rounded-xl flex items-center gap-4 hover:border-white/20 border border-transparent transition-all">
                                <img src={item.thumbnail_url} alt={item.title} className="w-16 h-12 object-cover rounded shadow-md opacity-70" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate text-white text-sm">{item.title}</h3>
                                    <p className="text-xs text-gray-400 truncate">{item.channel_title}</p>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remover"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
