
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

export const searchVideos = async (query) => {
    if (!query) return [];
    if (!API_KEY) {
        console.error('YouTube API Key is missing');
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            throw new Error('Failed to fetch videos');
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
        return [];
    }
};
