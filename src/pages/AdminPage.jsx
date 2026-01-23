import React from 'react';
import { useQueue } from '../hooks/useQueue';
import { Trash2, SkipForward, Play } from 'lucide-react';

export default function AdminPage() {
    const { queue, nowPlaying, removeSong, playNext, updateStatus } = useQueue();

    const handlePlayNow = async (song) => {
        // Logic: Remove from queue, set status to playing?
        // Actually our hook assumes 'playNext' grabs the first "waiting".
        // To "Play Now" cleanly: 
        // 1. Set current playing to played.
        // 2. Set this song to playing (idk if playNext handles this, playNext logic is "find next waiting").
        // Let's implement a manual jump:
        if (nowPlaying) {
            await updateStatus(nowPlaying.id, 'played');
        }
        await updateStatus(song.id, 'playing');
        // If we rely on subscription, the PlayerPage will update automatically.
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neon-purple">Painel de Controle</h2>
                <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded">ADMIN MODE</div>
            </div>

            {/* Now Playing Control */}
            {nowPlaying && (
                <section className="bg-white/5 border border-neon-green/30 p-4 rounded-xl">
                    <h3 className="text-xs uppercase tracking-widest text-neon-green mb-3">Tocando Agora</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={nowPlaying.thumbnail_url} className="w-12 h-12 rounded bg-black" />
                            <div>
                                <p className="font-bold">{nowPlaying.title}</p>
                                <p className="text-sm text-gray-400">{nowPlaying.channel_title}</p>
                            </div>
                        </div>
                        <button
                            onClick={playNext}
                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
                        >
                            <SkipForward size={16} /> Pular
                        </button>
                    </div>
                </section>
            )}

            {/* Queue Management */}
            <section className="space-y-4">
                <h3 className="text-xl font-bold">Na Fila ({queue.length})</h3>

                <div className="space-y-2">
                    {queue.map((item) => (
                        <div key={item.id} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg flex items-center gap-4 transition-all group">
                            <img src={item.thumbnail_url} className="w-12 h-10 object-cover rounded opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.channel_title}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePlayNow(item)}
                                    title="Tocar Agora"
                                    className="p-2 hover:bg-neon-green/20 text-gray-400 hover:text-neon-green rounded transition-colors"
                                >
                                    <Play size={18} />
                                </button>
                                <button
                                    onClick={() => removeSong(item.id)}
                                    title="Remover"
                                    className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {queue.length === 0 && (
                        <p className="text-gray-500 italic">Nenhuma música na fila.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
