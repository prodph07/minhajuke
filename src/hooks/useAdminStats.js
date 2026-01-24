import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useEstablishment } from '../contexts/EstablishmentContext';

export function useAdminStats() {
    const { establishment } = useEstablishment();
    const [stats, setStats] = useState({
        totalRequests: 0,
        uniqueUsers: 0,
        avgWaitTime: 0,
        popularSongs: [],
        requestsOverTime: [],
        hourlyTraffic: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!establishment) return;

        const processStats = (data) => {
            if (!data || data.length === 0) return;

            // 1. Basic Counts
            const totalRequests = data.length;
            const uniqueUsers = new Set(data.map(item => item.user_id)).size;

            // 2. Popular Songs
            const songCounts = {};
            data.forEach(item => {
                // Key by video_id
                if (!songCounts[item.video_id]) {
                    songCounts[item.video_id] = {
                        title: item.title,
                        thumbnail: item.thumbnail_url,
                        count: 0
                    };
                }
                songCounts[item.video_id].count++;
            });

            const popularSongs = Object.values(songCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5

            // 3. Requests Over Time (Daily)
            const dailyCounts = {};
            data.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            });

            const requestsOverTime = Object.entries(dailyCounts).map(([date, count]) => ({
                date,
                pedidos: count
            }));

            // 4. Hourly Traffic (Heatmap data)
            const hourlyCounts = new Array(24).fill(0);
            data.forEach(item => {
                const hour = new Date(item.created_at).getHours();
                hourlyCounts[hour]++;
            });

            const hourlyTraffic = hourlyCounts.map((count, hour) => ({
                hour: `${hour}h`,
                pedidos: count
            }));

            // 5. Avg Wait Time (Mock logic: time between created_at and started_at)
            // Only for played items
            const playedItems = data.filter(item => item.status === 'played' && item.started_at);
            let totalWait = 0;
            playedItems.forEach(item => {
                const created = new Date(item.created_at);
                const started = new Date(item.started_at);
                totalWait += (started - created);
            });
            const avgWaitTimeMinutes = playedItems.length > 0
                ? Math.round((totalWait / playedItems.length) / 1000 / 60)
                : 0;

            setStats({
                totalRequests,
                uniqueUsers,
                avgWaitTime: avgWaitTimeMinutes,
                popularSongs,
                requestsOverTime,
                hourlyTraffic
            });
        };

        const fetchStats = async () => {
            setLoading(true);

            // 1. Fetch ALL history for this establishment (Limit to last 30 days for performance if needed)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('establishment_id', establishment.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
                return;
            }

            processStats(data);
            setLoading(false);
        };

        fetchStats();
    }, [establishment]);

    return { stats, loading };
}
