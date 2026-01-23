import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useQueue() {
    const [queue, setQueue] = useState([]);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch initial queue
    const fetchQueue = async () => {
        setLoading(true);
        // Get everything that is waiting OR playing
        const { data, error } = await supabase
            .from('queue')
            .select('*')
            .in('status', ['waiting', 'playing'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching queue:', error);
        } else {
            const playing = data.find(item => item.status === 'playing');
            const waiting = data.filter(item => item.status === 'waiting');

            setNowPlaying(playing || null);
            setQueue(waiting || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQueue();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('public:queue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, (payload) => {
                console.log('Realtime change received:', payload);
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Auto-play trigger: If nothing is playing but we have a queue, start the first one
    useEffect(() => {
        if (!loading && !nowPlaying && queue.length > 0) {
            console.log('Auto-starting first song in queue...');
            const next = queue[0];
            updateStatus(next.id, 'playing').then(() => fetchQueue());
        }
    }, [loading, nowPlaying, queue]);

    const addToQueue = async (video) => {
        // Check if video is already in queue (optional duplicate check)
        // For now, let's allow duplicates or maybe check client side? 
        // Let's just insert.
        const { error } = await supabase.from('queue').insert([
            {
                video_id: video.video_id,
                title: video.title,
                channel_title: video.channel_title,
                thumbnail_url: video.thumbnail_url,
                status: 'waiting',
            },
        ]);

        if (error) {
            console.error('Error adding to queue:', error);
            throw error;
        }
    };

    const updateStatus = async (id, status) => {
        const { error } = await supabase
            .from('queue')
            .update({ status })
            .eq('id', id);

        if (error) console.error('Error updating status:', error);
    };

    const playNext = async () => {
        // 1. Mark current playing as 'played'
        if (nowPlaying) {
            await updateStatus(nowPlaying.id, 'played');
        }

        // 2. Find next waiting
        if (queue.length > 0) {
            const next = queue[0];
            await updateStatus(next.id, 'playing');
        } else {
            // No more songs
            setNowPlaying(null);
        }
    };

    const removeSong = async (id) => {
        await updateStatus(id, 'removed');
    }

    return {
        queue,
        nowPlaying,
        loading,
        addToQueue,
        playNext,
        updateStatus,
        removeSong
    };
}
