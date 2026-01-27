
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

        console.log(`Scraping YouTube for: ${query}`);

        // Fetch YouTube Search Page
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch YouTube: ${response.status}`);
        }

        const html = await response.text();

        // Parse ytInitialData
        // We look for the JSON blob found in `var ytInitialData = {...};`
        const startStr = 'var ytInitialData =';
        const startIdx = html.indexOf(startStr);

        if (startIdx === -1) {
            throw new Error('Could not find ytInitialData');
        }

        const endIdx = html.indexOf(';</script>', startIdx);
        const jsonStr = html.substring(startIdx + startStr.length, endIdx);

        const data = JSON.parse(jsonStr);

        // Navigate JSON to find video results
        // Path: contents -> twoColumnSearchResultsRenderer -> primaryContents -> sectionListRenderer -> contents[0] -> itemSectionRenderer -> contents
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

        if (!contents) {
            throw new Error('Invalid YouTube Data structure');
        }

        // Find the section with items
        const itemSection = contents.find((section: any) => section.itemSectionRenderer)?.itemSectionRenderer;
        let videos = itemSection?.contents || [];

        // Map to clean format
        const results = videos
            .filter((item: any) => item.videoRenderer)
            .map((item: any) => {
                const v = item.videoRenderer;
                return {
                    video_id: v.videoId,
                    title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown Title',
                    thumbnail_url: v.thumbnail?.thumbnails?.pop()?.url, // High res is usually last
                    channel_title: v.ownerText?.runs?.[0]?.text || 'Youtube',
                    is_unlimited: true // Flag for client
                };
            })
            .slice(0, 10); // Limit to 10 results

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
