
const RAW_KEYS = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map(k => k.trim()).filter(k => k.length > 0);
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

let currentKeyIndex = 0;

// Helper to parse ISO 8601 duration (PT4M13S) to seconds
const parseDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
};

// Smart Fetch with Rotation
const fetchWithKeyRotation = async (urlBuilderFn) => {
    if (API_KEYS.length === 0) {
        throw new Error('CONFIG_ERROR: Nenhuma chave de API configurada. Verifique o .env');
    }

    let lastError = null;

    // Try loop equal to number of keys to ensure we try everyone once
    for (let i = 0; i < API_KEYS.length; i++) {
        // Calculate index with offset from current
        const actualIndex = (currentKeyIndex + i) % API_KEYS.length;
        const apiKey = API_KEYS[actualIndex];

        try {
            const url = urlBuilderFn(apiKey);
            const response = await fetch(url);

            // If 403, it's a Quota/Permission issue -> Try Next Key
            if (response.status === 403) {
                console.warn(`[YouTube API] Key ending in ...${apiKey.slice(-4)} failed (403). Rotating...`);
                continue;
            }

            // If success, commit to this key (avoid unnecessary rotation next time)
            if (response.ok) {
                if (actualIndex !== currentKeyIndex) {
                    console.info(`[YouTube API] Switched primary key to index ${actualIndex}`);
                    currentKeyIndex = actualIndex;
                }
            }

            return response; // Return result (Success or other error like 404/500)

        } catch (e) {
            console.warn(`[YouTube API] Network error on key index ${actualIndex}`, e);
            lastError = e;
        }
    }

    // If loop finishes, all keys failed
    throw lastError || new Error('QUOTA_EXCEEDED: Todas as chaves de API falharam ou excederam o limite.');
};

export const searchVideos = async (query) => {
    if (!query) return [];

    try {
        const response = await fetchWithKeyRotation((key) =>
            `${BASE_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${key}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            throw new Error('API_ERROR: Falha ao buscar vídeos.');
        }

        const data = await response.json();

        return data.items.map((item) => ({
            video_id: item.id.videoId,
            title: item.snippet.title,
            channel_title: item.snippet.channelTitle,
            thumbnail_url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        }));
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
};

export const getVideoDetails = async (videoId) => {
    try {
        const response = await fetchWithKeyRotation((key) =>
            `${BASE_URL}/videos?part=contentDetails,snippet&id=${videoId}&key=${key}`
        );

        if (!response.ok) throw new Error('Failed to fetch video details');

        const data = await response.json();
        if (!data.items || data.items.length === 0) return null;

        const item = data.items[0];
        return {
            video_id: item.id,
            title: item.snippet.title,
            channel_title: item.snippet.channelTitle,
            thumbnail_url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            duration_sec: parseDuration(item.contentDetails.duration)
        };
    } catch (error) {
        console.error('Get Video Details error:', error);
        return null;
    }
};

export const getPlaylistItems = async (playlistId) => {
    try {
        const response = await fetchWithKeyRotation((key) =>
            `${BASE_URL}/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${key}`
        );

        if (!response.ok) throw new Error('Failed to fetch playlist items');

        const data = await response.json();

        return data.items.map((item) => ({
            video_id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channel_title: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
            thumbnail_url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        })).filter(v => v.title !== 'Private video' && v.title !== 'Deleted video');
    } catch (error) {
        console.error('Get Playlist Items error:', error);
        throw error;
    }
};
