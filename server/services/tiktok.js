import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

/**
 * Search TikTok for videos matching the given keyword queries.
 *
 * @param {string[]} queries - Array of keyword strings.
 * @param {object}   [options]
 * @param {number}   [options.maxItems=15] - Maximum items per search run.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!APIFY_TOKEN) {
    console.warn('[tiktok] APIFY_TOKEN is not set – skipping TikTok search.');
    return [];
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const maxItems = options.maxItems ?? 15;
  const allResults = [];

  try {
    const run = await client.actor('apidojo/tiktok-scraper').call({
      searchQueries: queries,
      searchType: 'search',
      maxItems,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    for (const item of items) {
      allResults.push({
        platform: 'tiktok',
        content_type: 'video',
        external_id: item.id ?? '',
        url: item.webVideoUrl ?? item.url ?? '',
        thumbnail_url: item.coverUrl ?? item.thumbnailUrl ?? '',
        media_url: item.videoUrl ?? item.downloadUrl ?? '',
        title: item.text ?? item.title ?? '',
        description: item.text ?? item.description ?? '',
        author: item.authorMeta?.name ? `@${item.authorMeta.name}` : (item.author ?? ''),
        author_url: item.authorMeta?.profileUrl
          ?? (item.authorMeta?.name ? `https://www.tiktok.com/@${item.authorMeta.name}` : ''),
        engagement: {
          views: Number(item.playCount ?? item.videoMeta?.playCount ?? 0),
          likes: Number(item.diggCount ?? item.likes ?? 0),
          comments: Number(item.commentCount ?? item.comments ?? 0),
        },
        raw_data: item,
      });
    }
  } catch (err) {
    console.warn('[tiktok] Search failed:', err.message ?? err);
  }

  return allResults;
}
