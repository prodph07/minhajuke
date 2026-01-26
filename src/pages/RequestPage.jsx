import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2, Music2 } from 'lucide-react';
import { searchVideos } from '../services/youtubeService';
import { useQueue } from '../hooks/useQueue';

export default function RequestPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [justAdded, setJustAdded] = useState(null);

    const { addToQueue, queue, establishment } = useQueue();
    // Assuming useQueue returns establishment, or we can use useEstablishment context directly. 
    // Wait, useQueue calls useEstablishment inside, but doesn't return it.
    // Let's import useEstablishment here for cleaner code.

    // Let's rely on useEstablishment hook directly.

    // AUTO-SEARCH (DEBOUNCE)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setSearching(true);
                const videos = await searchVideos(query);
                setResults(videos);
                setSearching(false);
            } else {
                setResults([]);
            }
        }, 800); // 800ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Manual search (optional now, but good for immediate feedback)
    const handleSearch = (e) => {
        e.preventDefault();
        // Logic handled by useEffect, form submit just prevents refresh
    };

    const handleAdd = async (video) => {
        try {
            await addToQueue(video);
            setJustAdded(video.video_id);
            setTimeout(() => setJustAdded(null), 2000);
            setQuery(''); // Clear search to reset state
            // setResults([]); // Optional: keep results or clear? Clearing feels cleaner after add.
        } catch (error) {
            alert('Erro ao adicionar música.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">{establishment?.settings?.welcome_message || 'Pedir Música'}</h2>
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

                {/* Results */}
                <div className="space-y-3">
                    {results.map((video) => (
                        <div key={video.video_id} className="bg-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 border border-transparent hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <img src={video.thumbnail_url} alt={video.title} className="w-24 h-18 object-cover rounded-lg shadow-md" />
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
                                disabled={justAdded === video.video_id}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${justAdded === video.video_id
                                    ? 'bg-neon-green text-black'
                                    : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {justAdded === video.video_id ? (
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
                    ))}
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
                        queue.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-transparent">
                                <span className="text-gray-500 font-mono text-sm w-6 text-center">{index + 1}</span>
                                <img src={item.thumbnail_url} alt={item.title} className="w-12 h-9 object-cover rounded opacity-70" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{item.channel_title}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
