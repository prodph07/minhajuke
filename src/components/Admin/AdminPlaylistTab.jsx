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
    const [playlist, setPlaylist] = useState([]);
    const [loadingList, setLoadingList] = useState(true);

    const fetchPlaylist = async () => {
        if (!establishment) return;
        const { data, error } = await supabase
            .from('background_playlists')
            .select('*')
            .eq('establishment_id', establishment.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching playlist:', error);
        else setPlaylist(data || []);
        setLoadingList(false);
    };

    useEffect(() => {
        fetchPlaylist();
    }, [establishment]);

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
                    video_id: video.video_id,
                    title: video.title,
                    channel_title: video.channel_title,
                    thumbnail_url: video.thumbnail_url,
                    duration_sec: 180 // Default, ideally fetch details but keeping simple for now
                }]);

            if (error) throw error;

            // Optimistic update or refresh
            fetchPlaylist();
            setQuery('');
            setResults([]);
        } catch (error) {
            alert('Erro ao adicionar à playlist: ' + error.message);
        }
    };

    const handleRemove = async (id) => {
        try {
            const { error } = await supabase
                .from('background_playlists')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPlaylist();
        } catch (error) {
            alert('Erro ao remover: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
                    <Library className="text-neon-purple" />
                    Playlist de Fundo
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Estas músicas tocarão aleatoriamente quando a fila de pedidos estiver vazia.
                </p>

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
                        Músicas Salvas <span>{playlist.length}</span>
                    </h4>

                    {loadingList ? (
                        <div className="text-center py-4 text-gray-500">Carregando playlist...</div>
                    ) : playlist.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-gray-500">
                            Nenhuma música na playlist de fundo.
                        </div>
                    ) : (
                        playlist.map((item) => (
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
