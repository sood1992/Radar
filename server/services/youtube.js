import { google } from 'googleapis';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search YouTube for videos matching the given queries.
 *
 * @param {string[]} queries - Array of search strings.
 * @param {object}   [options]
 * @param {number}   [options.maxResults=10] - Results per query (max 50).
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!YOUTUBE_API_KEY) {
    console.warn('[youtube] YOUTUBE_API_KEY is not set – skipping YouTube search.');
    return [];
  }

  const youtube = google.youtube({ version: 'v3', auth: YOUTUBE_API_KEY });
  const maxResults = options.maxResults ?? 10;
  const allResults = [];

  for (const query of queries) {
    try {
      // Step 1 – search for videos
      const searchResponse = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
      });

      const items = searchResponse.data.items ?? [];
      if (items.length === 0) continue;

      // Step 2 – fetch statistics for the returned video IDs
      const videoIds = items.map((i) => i.id.videoId).join(',');
      const statsResponse = await youtube.videos.list({
        part: 'statistics,contentDetails',
        id: videoIds,
      });

      const statsMap = {};
      for (const v of statsResponse.data.items ?? []) {
        statsMap[v.id] = v.statistics;
      }

      // Step 3 – normalise
      for (const item of items) {
        const videoId = item.id.videoId;
        const snippet = item.snippet;
        const stats = statsMap[videoId] ?? {};

        allResults.push({
          platform: 'youtube',
          content_type: 'video',
          external_id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? '',
          media_url: `https://www.youtube.com/watch?v=${videoId}`,
          title: snippet.title ?? '',
          description: snippet.description ?? '',
          author: snippet.channelTitle ?? '',
          author_url: `https://www.youtube.com/channel/${snippet.channelId}`,
          engagement: {
            views: Number(stats.viewCount ?? 0),
            likes: Number(stats.likeCount ?? 0),
            comments: Number(stats.commentCount ?? 0),
          },
          raw_data: { ...item, statistics: stats },
        });
      }
    } catch (err) {
      console.warn(`[youtube] Query "${query}" failed:`, err.message ?? err);
    }
  }

  return allResults;
}
