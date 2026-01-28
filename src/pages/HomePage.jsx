import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Search, Music, ArrowRight, Loader2, Store } from 'lucide-react';

export default function HomePage() {
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEstablishments = async () => {
            try {
                const { data, error } = await supabase
                    .from('establishments')
                    .select('id, name, slug, settings');

                if (error) throw error;
                setEstablishments(data || []);
            } catch (error) {
                console.error('Error fetching establishments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEstablishments();
    }, []);

    const filteredEstablishments = establishments.filter(est =>
        est.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="z-10 w-full max-w-3xl space-y-12 text-center">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-neon-green animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
                            Jukebox 2.0
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            Encontre a <span className="text-neon-purple">Música</span>
                            <br /> do Seu Lugar.
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Pesquise seu bar, restaurante ou festa favorita e comece a pedir suas músicas agora mesmo.
                        </p>
                    </div>

                    {/* Search Box */}
                    <div className="relative max-w-xl mx-auto group animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-green rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-[#111] border border-white/10 rounded-xl flex items-center p-2 shadow-2xl">
                            <Search className="text-gray-400 ml-3 w-6 h-6" />
                            <input
                                type="text"
                                placeholder="Buscar estabelecimento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none focus:outline-none flex-1 px-4 py-3 text-lg placeholder-gray-500 text-white"
                            />
                        </div>
                    </div>

                    {/* Establishments Grid */}
                    <div className="w-full text-left space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 pl-2">
                            {searchTerm ? 'Resultados' : 'Locais Disponíveis'}
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
                            </div>
                        ) : filteredEstablishments.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Store className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500">Nenhum estabelecimento encontrado.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredEstablishments.map((est) => (
                                    <button
                                        key={est.id}
                                        onClick={() => navigate(`/e/${est.slug}/request`)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-purple/50 p-6 rounded-xl text-left transition-all group flex flex-col gap-4 relative overflow-hidden"
                                    >
                                        <div className="p-3 bg-neon-purple/10 rounded-lg w-fit text-neon-purple group-hover:scale-110 transition-transform">
                                            <Music size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-neon-purple transition-colors">
                                                {est.name}
                                            </h3>
                                            <p className="text-sm text-gray-400">@{est.slug}</p>
                                        </div>
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className="text-neon-purple" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center text-gray-600 text-sm border-t border-white/5">
                <p>&copy; {new Date().getFullYear()} JukeBox App. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
