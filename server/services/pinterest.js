import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

/**
 * Search Pinterest for pins matching the given queries.
 *
 * @param {string[]} queries - Array of search strings.
 * @param {object}   [options]
 * @param {number}   [options.maxItems=15] - Maximum items per query.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!APIFY_TOKEN) {
    console.warn('[pinterest] APIFY_TOKEN is not set – skipping Pinterest search.');
    return [];
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const maxItems = options.maxItems ?? 15;
  const allResults = [];

  for (const query of queries) {
    try {
      const run = await client.actor('epctex/pinterest-scraper').call({
        search: query,
        maxItems,
      });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      for (const item of items) {
        allResults.push({
          platform: 'pinterest',
          content_type: 'pin',
          external_id: item.id ?? '',
          url: item.link ?? item.url ?? '',
          thumbnail_url: item.imageLargeUrl ?? item.imageUrl ?? item.thumbnailUrl ?? '',
          media_url: item.imageLargeUrl ?? item.imageUrl ?? item.videoUrl ?? '',
          title: item.title ?? item.gridTitle ?? '',
          description: item.description ?? item.richSummary ?? '',
          author: item.pinner?.username ? `@${item.pinner.username}` : (item.author ?? ''),
          author_url: item.pinner?.profileUrl
            ?? (item.pinner?.username ? `https://www.pinterest.com/${item.pinner.username}/` : ''),
          engagement: {
            views: Number(item.viewCount ?? item.views ?? 0),
            likes: Number(item.saveCount ?? item.saves ?? item.likes ?? 0),
            comments: Number(item.commentCount ?? item.comments ?? 0),
          },
          raw_data: item,
        });
      }
    } catch (err) {
      console.warn(`[pinterest] Query "${query}" failed:`, err.message ?? err);
    }
  }

  return allResults;
}
