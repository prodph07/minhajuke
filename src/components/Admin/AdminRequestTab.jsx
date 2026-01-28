import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2, Music2 } from 'lucide-react';
import { searchVideos } from '../../services/youtubeService';
import { useQueue } from '../../hooks/useQueue';

export default function AdminRequestTab() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [justAdded, setJustAdded] = useState(null);
    const [error, setError] = useState(null);

    const { addToQueue } = useQueue();

    // AUTO-SEARCH (DEBOUNCE)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setSearching(true);
                setError(null);
                try {
                    // Admin always uses standard YouTube search for reliability
                    // Can implement unlimited/provider switching here too needed
                    const videos = await searchVideos(query);
                    setResults(videos);
                } catch (err) {
                    setResults([]);
                    setError(err.message || 'Erro ao buscar vídeos.');
                } finally {
                    setSearching(false);
                }
            } else {
                setResults([]);
                setError(null);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleAdd = async (video) => {
        try {
            // CALL WITH skipRestrictions: true
            await addToQueue(video, { skipRestrictions: true });

            setJustAdded(video.video_id);
            setTimeout(() => setJustAdded(null), 2000);
            setQuery(''); // Clear search on success? Or keep it? Usually clearing is better for "remote control" feel
        } catch (error) {
            alert('Erro ao adicionar música: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
                    <Music2 className="text-neon-green" />
                    Pedir Música (Modo Admin)
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    Músicas pedidas por aqui não possuem limite de tempo, limite por usuário ou restrições de palavras-chave.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nome da música ou URL..."
                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-green transition-colors text-white"
                        autoFocus
                    />
                    <div className="bg-neon-green/20 text-neon-green p-3 rounded-lg flex items-center justify-center min-w-[3rem]">
                        {searching ? <Loader2 className="animate-spin" /> : <Search />}
                    </div>
                </form>

                {/* Results */}
                <div className="space-y-3">
                    {results.map((video) => {
                        const isAdded = justAdded === video.video_id;

                        return (
                            <div key={video.video_id} className="bg-white/5 p-3 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                                <img src={video.thumbnail_url} alt={video.title} className="w-20 h-14 object-cover rounded shadow-md" />

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate text-white text-sm">{video.title}</h3>
                                    <p className="text-xs text-gray-400 truncate">{video.channel_title}</p>
                                </div>

                                <button
                                    onClick={() => handleAdd(video)}
                                    disabled={isAdded}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2 ${isAdded
                                        ? 'bg-neon-green text-black'
                                        : 'bg-white text-black hover:bg-gray-200'
                                        }`}
                                >
                                    {isAdded ? (
                                        <>
                                            <Check size={16} />
                                            Feito
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Adicionar
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    })}

                    {query && results.length === 0 && !searching && !error && (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum resultado encontrado.
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center py-4">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
