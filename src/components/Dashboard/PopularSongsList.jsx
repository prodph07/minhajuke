import React from 'react';
import { Music2 } from 'lucide-react';

export default function PopularSongsList({ songs }) {
    if (!songs || songs.length === 0) {
        return <div className="p-4 text-center text-gray-500">Sem dados de músicas.</div>;
    }

    return (
        <div className="space-y-3">
            {songs.map((song, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 transition-all">
                    <span className="text-neon-green font-bold text-lg min-w-[20px] text-center">
                        #{index + 1}
                    </span>
                    <img
                        src={song.thumbnail}
                        alt="Art"
                        className="w-12 h-12 object-cover rounded shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{song.title}</p>
                        <p className="text-xs text-gray-400">{song.count} pedidos</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
