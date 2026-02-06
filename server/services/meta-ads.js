const SEARCHAPI_KEY = process.env.SEARCHAPI_KEY;
const BASE_URL = 'https://www.searchapi.io/api/v1/search';

/**
 * Search the Meta Ad Library via SearchAPI.io.
 *
 * @param {string[]} queries - Array of search strings.
 * @param {object}   [options] - Reserved for future use.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!SEARCHAPI_KEY) {
    console.warn('[meta-ads] SEARCHAPI_KEY is not set – skipping Meta Ads search.');
    return [];
  }

  const allResults = [];

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        engine: 'meta_ad_library',
        q: query,
        country: 'ALL',
        media_type: 'video',
        active_status: 'active',
        api_key: SEARCHAPI_KEY,
      });

      const response = await fetch(`${BASE_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`SearchAPI responded with status ${response.status}`);
      }

      const data = await response.json();
      const ads = data.ads ?? data.results ?? data.organic_results ?? [];

      for (const ad of ads) {
        allResults.push({
          platform: 'meta-ads',
          content_type: 'ad',
          external_id: ad.id ?? ad.ad_id ?? '',
          url: ad.link ?? ad.url ?? ad.ad_snapshot_url ?? '',
          thumbnail_url: ad.thumbnail ?? ad.image ?? '',
          media_url: ad.video_url ?? ad.media_url ?? ad.link ?? '',
          title: ad.title ?? ad.page_name ?? '',
          description: ad.body ?? ad.description ?? ad.ad_creative_body ?? '',
          author: ad.page_name ?? ad.advertiser ?? '',
          author_url: ad.page_url ?? ad.byline_url ?? '',
          engagement: {
            views: Number(ad.impressions ?? ad.views ?? 0),
            likes: Number(ad.likes ?? 0),
            comments: Number(ad.comments ?? 0),
          },
          raw_data: ad,
        });
      }
    } catch (err) {
      console.warn(`[meta-ads] Query "${query}" failed:`, err.message ?? err);
    }
  }

  return allResults;
}
