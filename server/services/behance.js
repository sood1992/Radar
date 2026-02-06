import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

/**
 * Search Behance for images/projects matching the given keyword queries.
 *
 * @param {string[]} queries - Array of keyword strings.
 * @param {object}   [options]
 * @param {number}   [options.maxitems=15] - Maximum items per query.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!APIFY_TOKEN) {
    console.warn('[behance] APIFY_TOKEN is not set – skipping Behance search.');
    return [];
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const maxitems = options.maxitems ?? 15;
  const allResults = [];

  for (const query of queries) {
    try {
      const run = await client
        .actor('scrapestorm/behance-images-search-scraper-fast-and-cheap')
        .call({
          search: query,
          maxitems,
        });

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      for (const item of items) {
        allResults.push({
          platform: 'behance',
          content_type: 'image',
          external_id: item.id ?? '',
          url: item.url ?? item.link ?? '',
          thumbnail_url: item.coverImage ?? item.thumbnailUrl ?? item.imageUrl ?? '',
          media_url: item.coverImage ?? item.imageUrl ?? '',
          title: item.name ?? item.title ?? '',
          description: item.description ?? item.fields?.join(', ') ?? '',
          author: item.owners?.[0]?.displayName
            ?? item.creator?.displayName
            ?? item.author
            ?? '',
          author_url: item.owners?.[0]?.url
            ?? item.creator?.url
            ?? '',
          engagement: {
            views: Number(item.stats?.views ?? item.views ?? 0),
            likes: Number(item.stats?.appreciations ?? item.appreciations ?? item.likes ?? 0),
            comments: Number(item.stats?.comments ?? item.comments ?? 0),
          },
          raw_data: item,
        });
      }
    } catch (err) {
      console.warn(`[behance] Query "${query}" failed:`, err.message ?? err);
    }
  }

  return allResults;
}
