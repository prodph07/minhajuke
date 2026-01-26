
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper to parse ISO 8601 duration (PT4M13S) to seconds
const parseDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
};

export const searchVideos = async (query) => {
    if (!query) return [];
    if (!API_KEY) {
        console.error('YouTube API Key is missing');
        throw new Error('CONFIG_ERROR: Chave da API não configurada.');
    }

    try {
        const response = await fetch(
            `${BASE_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);

            if (response.status === 403) {
                throw new Error('QUOTA_EXCEEDED: Limite da API do YouTube excedido ou chave inválida.');
            }
            throw new Error('API_ERROR: Falha ao buscar vídeos.');
        }

        const data = await response.json();

        return data.items.map((item) => ({
            video_id: item.id.videoId,
            title: item.snippet.title,
            channel_title: item.snippet.channelTitle,
            thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        }));
    } catch (error) {
        console.error('Search error:', error);
        throw error; // Re-throw to be caught by UI
    }
};

export const getVideoDetails = async (videoId) => {
    try {
        const response = await fetch(
            `${BASE_URL}/videos?part=contentDetails,snippet&id=${videoId}&key=${API_KEY}`
        );

        if (!response.ok) throw new Error('Failed to fetch video details');

        const data = await response.json();
        if (!data.items || data.items.length === 0) return null;

        const item = data.items[0];
        return {
            video_id: item.id,
            title: item.snippet.title,
            channel_title: item.snippet.channelTitle,
            thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration_sec: parseDuration(item.contentDetails.duration)
        };
    } catch (error) {
        console.error('Get Video Details error:', error);
        return null;
    }
};
