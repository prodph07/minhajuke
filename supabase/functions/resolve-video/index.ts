
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();

        if (!query) {
            throw new Error('Query param is required');
        }

        // Check if it's a playlist URL or ID
        const playlistIdMatch = query.match(/[?&]list=([^#\&\?]+)/);
        const isPlaylist = !!playlistIdMatch;

        let videos = [];

        if (isPlaylist) {
            const playlistId = playlistIdMatch[1];
            console.log(`Scraping Playlist: ${playlistId}`);
            const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
            const response = await fetch(playlistUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9"
                }
            });

            if (!response.ok) throw new Error(`Failed to fetch Playlist: ${response.status}`);
            const html = await response.text();

            const startStr = 'var ytInitialData =';
            const startIdx = html.indexOf(startStr);
            if (startIdx === -1) throw new Error('Could not find ytInitialData in Playlist');

            const endIdx = html.indexOf(';</script>', startIdx);
            const jsonStr = html.substring(startIdx + startStr.length, endIdx);
            const data = JSON.parse(jsonStr);

            // Navigate existing playlist structure
            const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
            const tab = tabs?.find((t: any) => t.tabRenderer?.selected)?.tabRenderer;
            const sectionList = tab?.content?.sectionListRenderer?.contents;
            const itemSection = sectionList?.find((s: any) => s.itemSectionRenderer)?.itemSectionRenderer;
            const playlistVideoList = itemSection?.contents?.find((c: any) => c.playlistVideoListRenderer)?.playlistVideoListRenderer;
            const contents = playlistVideoList?.contents;

            if (!contents) {
                // Try alternative path for some playlists
                const alert = data.alerts?.find((a: any) => a.alertRenderer)?.alertRenderer;
                if (alert) throw new Error(`YouTube Alert: ${alert.text?.simpleText}`);
                throw new Error('Invalid Playlist Data structure');
            }

            videos = contents
                .filter((item: any) => item.playlistVideoRenderer)
                .map((item: any) => {
                    const v = item.playlistVideoRenderer;
                    return {
                        video_id: v.videoId,
                        title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown Title',
                        thumbnail_url: v.thumbnail?.thumbnails?.pop()?.url,
                        channel_title: v.shortBylineText?.runs?.[0]?.text || 'Youtube',
                        duration_sec: parseInt(v.lengthSeconds || '180'),
                        is_unlimited: true
                    };
                })
                .slice(0, 50); // Limit to 50 for safety
        } else {
            // Normal Search Logic
            console.log(`Scraping YouTube Search for: ${query}`);
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            const response = await fetch(searchUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
                }
            });

            if (!response.ok) throw new Error(`Failed to fetch YouTube: ${response.status}`);
            const html = await response.text();

            const startStr = 'var ytInitialData =';
            const startIdx = html.indexOf(startStr);
            if (startIdx === -1) throw new Error('Could not find ytInitialData');

            const endIdx = html.indexOf(';</script>', startIdx);
            const jsonStr = html.substring(startIdx + startStr.length, endIdx);
            const data = JSON.parse(jsonStr);

            const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
            if (!contents) throw new Error('Invalid YouTube Data structure');

            const itemSection = contents.find((section: any) => section.itemSectionRenderer)?.itemSectionRenderer;
            const rawVideos = itemSection?.contents || [];

            videos = rawVideos
                .filter((item: any) => item.videoRenderer)
                .map((item: any) => {
                    const v = item.videoRenderer;
                    return {
                        video_id: v.videoId,
                        title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown Title',
                        thumbnail_url: v.thumbnail?.thumbnails?.pop()?.url,
                        channel_title: v.ownerText?.runs?.[0]?.text || 'Youtube',
                        is_unlimited: true
                    };
                })
                .slice(0, 10);
        }

        const results = videos;

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Function Error:", error);
        // Fallback: Return empty array instead of crashing client
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
