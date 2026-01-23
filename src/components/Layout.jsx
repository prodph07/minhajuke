import React from 'react';
import { Music } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-neon-dark text-white font-sans selection:bg-neon-purple selection:text-white">
            <header className="p-4 border-b border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Music className="w-6 h-6 text-neon-green animate-pulse" />
                    <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-neon-green to-neon-purple bg-clip-text text-transparent">
                        NEON JUKEBOX
                    </h1>
                </div>
            </header>
            <main className="container mx-auto p-4 max-w-2xl">
                {children}
            </main>
        </div>
    );
}
