import React, { useState } from 'react';
import { Search, Plus, Check, Loader2, Music2 } from 'lucide-react';
import { searchVideos } from '../services/youtubeService';
import { useQueue } from '../hooks/useQueue';

export default function RequestPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [justAdded, setJustAdded] = useState(null);

    const { addToQueue, queue } = useQueue();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        const videos = await searchVideos(query);
        setResults(videos);
        setSearching(false);
    };

    const handleAdd = async (video) => {
        try {
            await addToQueue(video);
            setJustAdded(video.video_id);
            setTimeout(() => setJustAdded(null), 2000);
            setQuery('');
            setResults([]);
        } catch (error) {
            alert('Erro ao adicionar música.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Pedir Música</h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquise no YouTube..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-purple transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="bg-neon-purple hover:bg-neon-purple/80 text-white p-3 rounded-lg transition-colors flex items-center justify-center min-w-[3rem]"
                    >
                        {searching ? <Loader2 className="animate-spin" /> : <Search />}
                    </button>
                </form>

                {/* Results */}
                <div className="space-y-2">
                    {results.map((video) => (
                        <div key={video.video_id} className="bg-white/5 p-3 rounded-lg flex items-center gap-3 border border-transparent hover:border-white/10 transition-all">
                            <img src={video.thumbnail_url} alt={video.title} className="w-16 h-12 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{video.title}</h3>
                                <p className="text-xs text-gray-400 truncate">{video.channel_title}</p>
                            </div>
                            <button
                                onClick={() => handleAdd(video)}
                                disabled={justAdded === video.video_id}
                                className={`p-2 rounded-full transition-colors ${justAdded === video.video_id ? 'bg-neon-green text-black' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                {justAdded === video.video_id ? <Check size={18} /> : <Plus size={18} />}
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
                        <p className="text-gray-500 text-center py-4">A fila está vazia. Adicione algo!</p>
                    ) : (
                        queue.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 border-b border-white/5 last:border-0">
                                <span className="text-gray-500 font-mono text-sm w-4 text-center">{index + 1}</span>
                                <img src={item.thumbnail_url} alt={item.title} className="w-10 h-8 object-cover rounded grayscale opacity-70" />
                                <div className="truncate">
                                    <p className="truncate text-sm">{item.title}</p>
                                    <p className="text-xs text-gray-400">{item.channel_title}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
