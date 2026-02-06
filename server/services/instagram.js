import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_TOKEN;

/**
 * Search Instagram by hashtag using the Apify Instagram scraper.
 *
 * @param {string[]} queries - Array of hashtags (with or without leading #).
 * @param {object}   [options]
 * @param {number}   [options.resultsPerPage=15] - Number of results per hashtag.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!APIFY_TOKEN) {
    console.warn('[instagram] APIFY_TOKEN is not set – skipping Instagram search.');
    return [];
  }

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const resultsPerPage = options.resultsPerPage ?? 15;
  const allResults = [];

  // Build hashtag list – strip leading # if present
  const hashtags = queries.map((q) => q.replace(/^#/, ''));

  try {
    const run = await client.actor('apidojo/instagram-scraper').call({
      hashtags,
      searchType: 'hashtag',
      resultsPerPage,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    for (const item of items) {
      allResults.push({
        platform: 'instagram',
        content_type: item.type ?? (item.videoUrl ? 'video' : 'image'),
        external_id: item.id ?? item.shortCode ?? '',
        url: item.url ?? (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : ''),
        thumbnail_url: item.displayUrl ?? item.thumbnailUrl ?? '',
        media_url: item.videoUrl ?? item.displayUrl ?? '',
        title: '',
        description: item.caption ?? '',
        author: item.ownerUsername ? `@${item.ownerUsername}` : '',
        author_url: item.ownerUsername ? `https://www.instagram.com/${item.ownerUsername}/` : '',
        engagement: {
          views: Number(item.videoViewCount ?? item.viewCount ?? 0),
          likes: Number(item.likesCount ?? item.likes ?? 0),
          comments: Number(item.commentsCount ?? item.comments ?? 0),
        },
        raw_data: item,
      });
    }
  } catch (err) {
    console.warn('[instagram] Search failed:', err.message ?? err);
  }

  return allResults;
}
