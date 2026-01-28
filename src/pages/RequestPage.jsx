import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, Check, Loader2, Music2 } from 'lucide-react';
import { searchVideos } from '../services/youtubeService';
import { searchTracksLastFm } from '../services/lastFmService';
import { useQueue } from '../hooks/useQueue';

export default function RequestPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [justAdded, setJustAdded] = useState(null);
    const [resolvingId, setResolvingId] = useState(null); // Track which item is being resolved
    const [error, setError] = useState(null);

    const { addToQueue, queue, establishment, userId } = useQueue();

    // AUTO-SEARCH (DEBOUNCE)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setSearching(true);
                setError(null);
                try {
                    let videos = [];
                    const settings = establishment?.settings || {};
                    const provider = settings.search_provider;

                    if (provider === 'unlimited') {
                        // UNLIMITED MODE: Scrape YouTube via Edge Function (Zero Quota)
                        const { data, error } = await supabase.functions.invoke('resolve-video', {
                            body: { query }
                        });

                        if (error) {
                            console.error("Unlimited Search Error:", error);
                            // Fallback to standard API if scraping fails? Or show error?
                            // Let's fallback to standard API to not break UX, but warn.
                            videos = await searchVideos(query);
                        } else {
                            videos = data || [];
                        }
                    }
                    else if (provider === 'lastfm' && settings.lastfm_api_key) {
                        // LAST.FM MODE: Metadata Search (Low Quota)
                        try {
                            videos = await searchTracksLastFm(query, settings.lastfm_api_key);
                        } catch (e) {
                            console.warn("Last.fm failed, falling back to YouTube", e);
                            videos = await searchVideos(query);
                        }
                    } else {
                        // STANDARD MODE: YouTube API (High Quota)
                        videos = await searchVideos(query);
                    }

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
    }, [query, establishment]);

    // Manual search (optional now, but good for immediate feedback)
    const handleSearch = (e) => {
        e.preventDefault();
        // Logic handled by useEffect, form submit just prevents refresh
    };

    const handleAdd = async (video) => {
        // Use title as tempororary ID for Last.fm items if video_id is missing
        const tempId = video.video_id || video.title;

        try {
            let finalVideo = video;

            // RESOLVE LOGIC: If item comes from Last.fm, we need to find a YouTube ID
            if (video.is_lastfm && !video.video_id) {
                setResolvingId(tempId);
                const searchQ = `${video.channel_title} ${video.title} official audio`;
                console.log("Resolving Last.fm track:", searchQ);

                let bestMatch = null;
                const settings = establishment?.settings || {};

                if (settings.search_provider === 'unlimited') {
                    // Method A: Edge Function (yt-search) - Unlimited Quota
                    console.log("Using Unlimited Resolve (Edge Function)...");
                    const { data, error } = await supabase.functions.invoke('resolve-video', {
                        body: { query: searchQ }
                    });

                    if (error) {
                        console.error("Edge Function Error:", error);
                        const msg = error.message || (error.context ? JSON.stringify(error.context) : 'Erro desconhecido');
                        throw new Error(`Erro na Função Ilimitada: ${msg}`);
                    }
                    if (!data || !data.video_id) {
                        throw new Error("Vídeo não encontrado (Ilimitado).");
                    }
                    bestMatch = data;
                } else {
                    // Method B: Official YouTube API - Standard Quota
                    console.log("Using YouTube API Resolve...");
                    const ytResults = await searchVideos(searchQ);
                    if (ytResults && ytResults.length > 0) {
                        bestMatch = ytResults[0];
                    }
                }

                if (bestMatch) {
                    finalVideo = {
                        ...video,
                        video_id: bestMatch.video_id,
                        // Prefer YouTube thumbnail if available (better ratio), else keep Last.fm
                        thumbnail_url: bestMatch.thumbnail_url || video.thumbnail_url,
                    };
                } else {
                    throw new Error("Música não encontrada no YouTube.");
                }
            }

            await addToQueue(finalVideo);
            setResolvingId(null);
            setJustAdded(tempId); // Use consistent ID for UI feedback
            setTimeout(() => setJustAdded(null), 2000);
            setQuery('');
        } catch (error) {
            setResolvingId(null);
            alert('Erro ao adicionar música: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">{establishment?.settings?.welcome_message || 'Pedir Música'}</h2>

                {/* CHECK IF REQUESTS ARE OPEN */}
                {establishment?.settings?.requests_enabled === false ? (
                    <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-center space-y-2 animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="text-xl font-bold text-red-400">Pedidos Encerrados</h3>
                        <p className="text-gray-400">O estabelecimento fechou os pedidos por enquanto.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Digite o nome da música..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors text-lg"
                        />
                        <div className="bg-neon-purple/20 text-neon-purple p-3 rounded-lg flex items-center justify-center min-w-[3rem]">
                            {searching ? <Loader2 className="animate-spin" /> : <Search />}
                        </div>
                    </form>
                )}

                {/* Error Message Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="min-w-[4px] h-full bg-red-500 rounded-full" />
                        <p>{error.includes('QUOTA') ? 'Sistema de busca temporariamente indisponível. Tente novamente mais tarde.' : error}</p>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-3">
                    {results.map((video) => {
                        // Unique ID for UI tracking: Match the logic in handleAdd
                        const itemKey = video.video_id || video.title;

                        const isResolving = resolvingId === itemKey;
                        const isAdded = justAdded && justAdded === itemKey;

                        return (
                            <div key={itemKey + (video.channel_title || '')} className="bg-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 border border-transparent hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {video.thumbnail_url ? (
                                        <img src={video.thumbnail_url} alt={video.title} className="w-24 h-18 object-cover rounded-lg shadow-md" />
                                    ) : (
                                        <div className="w-24 h-18 bg-white/10 rounded-lg flex items-center justify-center text-white/20">
                                            <Music2 size={32} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 sm:hidden">
                                        <h3 className="font-bold truncate text-white">{video.title}</h3>
                                        <p className="text-sm text-gray-400 truncate">{video.channel_title}</p>
                                    </div>
                                </div>

                                <div className="hidden sm:block flex-1 min-w-0">
                                    <h3 className="font-bold truncate text-lg text-white">{video.title}</h3>
                                    <p className="text-sm text-gray-400 truncate">{video.channel_title}</p>
                                </div>

                                <button
                                    onClick={() => handleAdd(video)}
                                    disabled={isAdded || isResolving}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${isAdded
                                        ? 'bg-neon-green text-black'
                                        : 'bg-white text-black hover:bg-gray-200'
                                        }`}
                                >
                                    {isResolving ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Buscando...
                                        </>
                                    ) : isAdded ? (
                                        <>
                                            <Check size={20} />
                                            Feito!
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={20} />
                                            Adicionar
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Queue Preview */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-neon-green">
                    <Music2 size={20} />
                    <h2 className="text-xl font-bold">Na Fila ({queue.length})</h2>
                </div>

                <div className="space-y-2 opacity-80">
                    {queue.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 italic">A fila está vazia. Seja o primeiro!</p>
                    ) : (
                        queue.map((item, index) => {
                            const isMine = item.user_id === userId;
                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isMine
                                        ? 'bg-neon-purple/10 border-neon-purple shadow-[0_0_15px_rgba(180,0,255,0.1)]'
                                        : 'bg-white/5 border-transparent'
                                        }`}
                                >
                                    <div className="flex flex-col items-center min-w-[1.5rem]">
                                        <span className={`font-mono text-sm ${isMine ? 'text-neon-purple font-bold' : 'text-gray-500'}`}>
                                            {index + 1}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <img src={item.thumbnail_url} alt={item.title} className="w-12 h-9 object-cover rounded opacity-90" />
                                        {isMine && (
                                            <div className="absolute -top-2 -right-2 bg-neon-purple text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                VOCÊ
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${isMine ? 'text-white' : 'text-gray-300'}`}>
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{item.channel_title}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
