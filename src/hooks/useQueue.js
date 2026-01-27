import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getVideoDetails } from '../services/youtubeService';
import { useEstablishment } from '../contexts/EstablishmentContext';

export function useQueue(options = { manager: false }) {
    const { establishment } = useEstablishment() || {};
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

    const establishmentRef = useRef(establishment?.id);
    const lastSkipTime = useRef(0); // Debounce ref

    useEffect(() => {
        establishmentRef.current = establishment?.id;
    }, [establishment]);

    // Fetch initial queue
    const fetchQueue = useCallback(async () => {
        const currentEstId = establishmentRef.current;
        console.log(`[useQueue] fetchQueue called. Establishment: ${establishment?.id}, Ref: ${currentEstId}`);

        if (!establishment || !currentEstId) {
            console.log('[useQueue] Missing establishment or ref, aborting.');
            return;
        }

        setLoading(true);
        // Get everything that is waiting OR playing
        const { data, error } = await supabase
            .from('queue')
            .select('*')
            .eq('establishment_id', establishment.id) // Filter by Establishment!
            .in('status', ['waiting', 'playing'])
            .order('created_at', { ascending: true });

        // STALE CHECK: If establishment changed while fetching, abort
        if (establishment.id !== establishmentRef.current) {
            console.warn(`[useQueue] Stale fetch detected. FetchID: ${establishment.id}, RefID: ${establishmentRef.current}`);
            return;
        }

        if (error) {
            console.error('[useQueue] Error fetching queue:', error);
        } else {
            console.log(`[useQueue] Data fetched: ${data?.length} items.`);
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
    }, [establishment]);

    useEffect(() => {
        if (establishment) {
            console.log(`[useQueue] Establishment changed/mounted: ${establishment.id}`);
            fetchQueue();
        } else {
            console.log('[useQueue] No establishment in effect.');
            setQueue([]); // Clear if no establishment
            setNowPlaying(null);
            setLoading(false);
        }

        // ADMIN/VIP ACTIVATION VIA URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('vip') === 'true') {
            localStorage.setItem('jukebox_vip', 'true');
            console.log('VIP Mode Activated');
        }

        if (!establishment) return;

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`public:queue:${establishment.id}`) // Unique channel per establishment
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'queue',
                filter: `establishment_id=eq.${establishment.id}` // Filter only this establishment's changes
            }, (payload) => {
                // DOUBLE SECURITY: Verify payload ID matches current ref
                if (payload && payload.new && payload.new.establishment_id) {
                    if (String(payload.new.establishment_id) !== String(establishmentRef.current)) {
                        console.warn("Ignored event from wrong establishment", payload.new.establishment_id);
                        return;
                    }
                }
                console.log('Realtime change received:', payload);
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [establishment, fetchQueue]); // Re-run when establishment changes


    const updateStatus = async (id, status, extraFields = {}) => {
        if (!establishment) return; // Guard clause

        const { error } = await supabase
            .from('queue')
            .update({ status, ...extraFields })
            .eq('id', id)
            .eq('establishment_id', establishment.id); // Safety check

        if (error) console.error('Error updating status:', error);
    };

    const playNext = async (reason = 'unknown') => {
        const now = Date.now();
        // DEBOUNCE: Prevent double skips (2 second cooldown)
        if (now - lastSkipTime.current < 2000) {
            console.warn(`[useQueue] playNext ignored (Debounce active). Reason: ${reason}`);
            return;
        }
        lastSkipTime.current = now;

        console.log(`[useQueue] playNext called. Reason: ${reason}`);
        if (!establishment) return;

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

        // Refresh immediately to update UI
        fetchQueue();
    };

    // HEARTBEAT SYNC: Check every 5s if current song has expired
    // RESTRICTED TO MANAGER ONLY (PlayerPage)
    useEffect(() => {
        if (!options.manager) return; // ONLY PLAYER MANAGES QUEUE
        console.log('[useQueue] Heartbeat Manager Active');

        const interval = setInterval(() => {
            if (nowPlaying && nowPlaying.started_at && nowPlaying.duration_sec) {
                const startTime = new Date(nowPlaying.started_at).getTime();
                const now = Date.now();
                const elapsedSec = (now - startTime) / 1000;

                // If song ended more than 30 seconds ago (Relaxed from 5s)
                if (elapsedSec > nowPlaying.duration_sec + 30) {
                    console.log('Heartbeat: Song expired (over 30s past duration), playing next...');
                    playNext('heartbeat_expired');
                }
            } else if (!nowPlaying && queue.length > 0) {
                // Auto-start if nothing is playing
                console.log('Heartbeat: Queue has items but nothing playing. Starting...');
                playNext('heartbeat_autostart');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [nowPlaying, queue, options.manager]);

    const checkRateLimit = async (userId) => {
        if (isVip()) return true; // VIP bypass

        if (!establishment) throw new Error('Establishment not found');

        const settings = establishment.settings || {};
        const maxRequests = settings.max_requests_per_user || 3;
        const windowMinutes = settings.limit_window_minutes || 10;

        // Time window: X minutes ago
        const timeWindow = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('queue')
            .select('*', { count: 'exact', head: true })
            .eq('establishment_id', establishment.id)
            .eq('user_id', userId)
            .gte('created_at', timeWindow);

        if (error) {
            console.error('Rate limit check error:', error);
            // Fail open (allow) if DB error? Or fail closed? Allowing for now.
            return true;
        }

        if (count >= maxRequests) {
            throw new Error(`Limite atingido! Você só pode pedir ${maxRequests} músicas a cada ${windowMinutes} minutos.`);
        }

        return true;
    };

    const checkRules = (video) => {
        const settings = establishment.settings || {};
        const forbidden = settings.forbidden_keywords || [];

        // Blacklist Check
        const titleLower = video.title.toLowerCase();
        for (const word of forbidden) {
            if (titleLower.includes(word.toLowerCase())) {
                throw new Error(`Música bloqueada! O termo "${word}" não é permitido neste estabelecimento.`);
            }
        }
    };

    const addToQueue = async (video) => {
        if (!establishment) {
            console.error("Cannot add to queue: No establishment context");
            return;
        }

        const userId = getUserId();

        // 1. Static Checks (Blacklist)
        checkRules(video);

        // 2. Rate Limits
        await checkRateLimit(userId);

        // 3. Fetch Duration from YouTube API
        const details = await getVideoDetails(video.video_id);
        const duration = details ? details.duration_sec : 180;

        // 4. Dynamic Checks (Duration)
        const settings = establishment.settings || {};
        const maxDuration = settings.max_duration_seconds || 600;

        if (duration > maxDuration) {
            throw new Error(`Música muito longa! O limite é de ${(maxDuration / 60).toFixed(0)} minutos.`);
        }

        // 5. Insert with user_id & duration
        const { error } = await supabase.from('queue').insert([
            {
                establishment_id: establishment.id, // Link to establishment
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

        // Refresh immediately
        fetchQueue();
    };

    const removeSong = async (id) => {
        if (!establishment) return;
        await updateStatus(id, 'removed');
        fetchQueue();
    }

    return {
        queue,
        nowPlaying,
        loading,
        addToQueue,
        playNext,
        updateStatus,
        removeSong,
        establishment
    };
}
