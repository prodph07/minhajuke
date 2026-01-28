import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, ExternalLink, Trash2, BarChart3, Building, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminPage() {
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({}); // { establishment_id: count }
    const [newEst, setNewEst] = useState({ name: '', slug: '' });
    const [editingEst, setEditingEst] = useState(null);
    const navigate = useNavigate();

    const fetchEstablishments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('establishments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setEstablishments(data || []);

        // Fetch queue counts for stats
        const { data: queueData, error: queueError } = await supabase
            .from('queue')
            .select('establishment_id');

        if (!queueError && queueData) {
            const counts = {};
            queueData.forEach(item => {
                if (item.establishment_id) {
                    counts[item.establishment_id] = (counts[item.establishment_id] || 0) + 1;
                }
            });
            setStats(counts);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchEstablishments();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newEst.name || !newEst.slug) return;

        const { error } = await supabase.from('establishments').insert([
            { name: newEst.name, slug: newEst.slug }
        ]);

        if (error) {
            alert('Erro ao criar: ' + error.message);
        } else {
            setNewEst({ name: '', slug: '' });
            fetchEstablishments();
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEst.name || !editingEst.slug) return;

        const { error } = await supabase
            .from('establishments')
            .update({ name: editingEst.name, slug: editingEst.slug })
            .eq('id', editingEst.id);

        if (error) {
            alert('Erro ao atualizar: ' + error.message);
        } else {
            setEditingEst(null);
            fetchEstablishments();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Isso pode quebrar filas existentes.')) return;

        const { error } = await supabase.from('establishments').delete().eq('id', id);
        if (error) alert('Erro ao deletar: ' + error.message);
        else fetchEstablishments();
    };

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-neon-purple tracking-tight">Super Admin</h2>
                    <p className="text-gray-400">Gerenciamento Global de Estabelecimentos</p>
                </div>
                <div className="bg-neon-purple/10 text-neon-purple px-4 py-2 rounded-full font-mono text-sm border border-neon-purple/20">
                    {establishments.length} Locais Ativos
                </div>
            </div>

            {/* Create New */}
            <section className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-neon-green" /> Novo Estabelecimento
                </h3>
                <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs uppercase text-gray-500 mb-1">Nome do Local</label>
                        <input
                            type="text"
                            placeholder="Bar do Zé"
                            value={newEst.name}
                            onChange={e => setNewEst({ ...newEst, name: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-neon-green outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs uppercase text-gray-500 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            placeholder="bar-do-ze"
                            value={newEst.slug}
                            onChange={e => setNewEst({ ...newEst, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-neon-purple outline-none font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newEst.name || !newEst.slug}
                        className="bg-neon-green text-black font-bold px-6 py-3 rounded-lg hover:bg-neon-green/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Criar Local
                    </button>
                </form>
            </section>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {loading ? (
                    <p className="text-center col-span-2 py-8 text-gray-500 animate-pulse">Carregando estabelecimentos...</p>
                ) : establishments.length === 0 ? (
                    <p className="text-center col-span-2 py-8 text-gray-500">Nenhum estabelecimento encontrado.</p>
                ) : (
                    establishments.map(est => (
                        <div key={est.id} className="bg-black/40 border border-white/10 p-5 rounded-xl hover:border-neon-purple/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        {est.name}
                                    </h3>
                                    <p className="text-xs font-mono text-gray-500 mt-1">/e/{est.slug}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingEst(est)}
                                        className="text-gray-600 hover:text-blue-400 transition-colors p-2"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(est.id)}
                                        className="text-gray-600 hover:text-red-500 transition-colors p-2"
                                        title="Deletar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 items-center text-sm text-gray-400 mb-4 bg-white/5 p-2 rounded">
                                <BarChart3 className="w-4 h-4" />
                                <span>Total de Pedidos: <strong className="text-white">{stats[est.id] || 0}</strong></span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4">
                                <a
                                    href={`/e/${est.slug}/request`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-neon-green/20 text-xs py-2 rounded text-gray-300 hover:text-neon-green transition-colors border border-white/5"
                                >
                                    Pedir <ExternalLink className="w-3 h-3" />
                                </a>
                                <a
                                    href={`/e/${est.slug}/player`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-blue-500/20 text-xs py-2 rounded text-gray-300 hover:text-blue-400 transition-colors border border-white/5"
                                >
                                    Player <ExternalLink className="w-3 h-3" />
                                </a>
                                <a
                                    href={`/e/${est.slug}/admin`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-neon-purple/20 text-xs py-2 rounded text-gray-300 hover:text-neon-purple transition-colors border border-white/5"
                                >
                                    Admin <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingEst && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-full max-w-md space-y-6 shadow-2xl ring-1 ring-white/10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-neon-purple" />
                                Editar Estabelecimento
                            </h3>
                            <button
                                onClick={() => setEditingEst(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Nome do Local</label>
                                <input
                                    type="text"
                                    value={editingEst.name}
                                    onChange={e => setEditingEst({ ...editingEst, name: e.target.value })}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-neon-purple outline-none"
                                    placeholder="Nome do estabelecimento"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={editingEst.slug}
                                    onChange={e => setEditingEst({ ...editingEst, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-neon-purple outline-none font-mono"
                                    placeholder="slug-do-estabelecimento"
                                />
                                <p className="text-xs text-yellow-500 mt-2">
                                    ⚠️ Alterar o slug fará com que os links e QR codes antigos parem de funcionar.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingEst(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-lg transition-colors border border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-neon-purple hover:bg-neon-purple/80 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-neon-purple/20"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
