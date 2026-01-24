import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getVideoDetails } from '../services/youtubeService';

export function useQueue() {
    const [queue, setQueue] = useState([]);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [loading, setLoading] = useState(true);

    // RATE LIMIT UTILS
    const getUserId = () => {
        let id = localStorage.getItem('jukebox_user_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('jukebox_user_id', id);
        }
        return id;
    };

    const isVip = () => {
        return localStorage.getItem('jukebox_vip') === 'true';
    };

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

            // SELF-HEALING: If playing but no started_at, fix it
            if (playing && !playing.started_at) {
                console.log('Fixing missing started_at timestamp...');
                const now = new Date().toISOString();
                // Optimistic update
                playing.started_at = now;
                // DB update
                supabase.from('queue').update({ started_at: now }).eq('id', playing.id).then();
            }

            setNowPlaying(playing || null);
            setQueue(waiting || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQueue();

        // ADMIN/VIP ACTIVATION VIA URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('vip') === 'true') {
            localStorage.setItem('jukebox_vip', 'true');
            console.log('VIP Mode Activated');
        }

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

    // HEARTBEAT SYNC: Check every 5s if current song has expired
    useEffect(() => {
        const interval = setInterval(() => {
            if (nowPlaying && nowPlaying.started_at && nowPlaying.duration_sec) {
                const startTime = new Date(nowPlaying.started_at).getTime();
                const now = Date.now();
                const elapsedSec = (now - startTime) / 1000;

                // If song ended more than 5 seconds ago
                if (elapsedSec > nowPlaying.duration_sec + 5) {
                    console.log('Heartbeat: Song expired, playing next...');
                    playNext();
                }
            } else if (!nowPlaying && queue.length > 0) {
                // Auto-start if nothing is playing
                console.log('Heartbeat: Queue has items but nothing playing. Starting...');
                playNext();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [nowPlaying, queue]);

    const checkRateLimit = async (userId) => {
        if (isVip()) return true; // VIP bypass

        // Time window: 10 minutes ago
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('queue')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', tenMinutesAgo);

        if (error) {
            console.error('Rate limit check error:', error);
            return true;
        }

        if (count >= 3) {
            throw new Error('Você atingiu o limite de 3 músicas a cada 10 minutos! Dê uma chance aos outros.');
        }

        return true;
    };

    const addToQueue = async (video) => {
        const userId = getUserId();

        // 1. Check Limits
        await checkRateLimit(userId);

        // 2. Fetch Duration from YouTube API
        const details = await getVideoDetails(video.video_id);
        const duration = details ? details.duration_sec : 180; // Default 3 min if fails

        // 3. Insert with user_id & duration
        const { error } = await supabase.from('queue').insert([
            {
                video_id: video.video_id,
                title: video.title,
                channel_title: video.channel_title,
                thumbnail_url: video.thumbnail_url,
                status: 'waiting',
                user_id: userId,
                duration_sec: duration
            },
        ]);

        if (error) {
            console.error('Error adding to queue:', error);
            throw error;
        }
    };

    const updateStatus = async (id, status, extraFields = {}) => {
        const { error } = await supabase
            .from('queue')
            .update({ status, ...extraFields })
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
            // Update status AND set started_at to NOW
            await updateStatus(next.id, 'playing', { started_at: new Date().toISOString() });
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
