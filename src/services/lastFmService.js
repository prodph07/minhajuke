
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export const searchTracksLastFm = async (query, apiKey) => {
    if (!query || !apiKey) return [];

    try {
        const url = `${BASE_URL}?method=track.search&track=${encodeURIComponent(query)}&api_key=${apiKey}&format=json&limit=10`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Last.fm API Error');
        }

        const data = await response.json();
        const tracks = data.results?.trackmatches?.track || [];

        return tracks.map(track => ({
            video_id: null, // To be resolved later
            title: track.name,
            channel_title: track.artist,
            // Try enabling higher resolution images
            thumbnail_url: track.image?.find(img => img.size === 'extralarge')?.['#text'] ||
                track.image?.find(img => img.size === 'large')?.['#text'] ||
                track.image?.find(img => img.size === 'medium')?.['#text'] ||
                '',
            is_lastfm: true,
            original_url: track.url
        }));

    } catch (error) {
        console.error('Last.fm Search error:', error);
        throw error;
    }
};
