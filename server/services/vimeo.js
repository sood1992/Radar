const VIMEO_CLIENT_ID = process.env.VIMEO_CLIENT_ID;
const VIMEO_CLIENT_SECRET = process.env.VIMEO_CLIENT_SECRET;
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;

/**
 * Wrap the callback-based Vimeo client request in a Promise.
 */
function vimeoRequest(client, options) {
  return new Promise((resolve, reject) => {
    client.request(options, (error, body, statusCode) => {
      if (error) return reject(error);
      if (statusCode >= 400) {
        return reject(new Error(`Vimeo API responded with status ${statusCode}`));
      }
      resolve(body);
    });
  });
}

/**
 * Search Vimeo for videos matching the given queries.
 *
 * @param {string[]} queries - Array of search strings.
 * @param {object}   [options]
 * @param {number}   [options.per_page=10] - Results per query.
 * @returns {Promise<object[]>} Normalized result objects.
 */
export default async function search(queries = [], options = {}) {
  if (!VIMEO_CLIENT_ID || !VIMEO_CLIENT_SECRET || !VIMEO_ACCESS_TOKEN) {
    console.warn(
      '[vimeo] One or more Vimeo credentials (VIMEO_CLIENT_ID, VIMEO_CLIENT_SECRET, VIMEO_ACCESS_TOKEN) are not set – skipping Vimeo search.',
    );
    return [];
  }

  // Dynamic import so the module still loads even if the `vimeo` package
  // is not installed (the missing-key guard above would have already returned).
  const { Vimeo } = await import('vimeo');
  const client = new Vimeo(VIMEO_CLIENT_ID, VIMEO_CLIENT_SECRET, VIMEO_ACCESS_TOKEN);

  const perPage = options.per_page ?? 10;
  const allResults = [];

  for (const query of queries) {
    try {
      const body = await vimeoRequest(client, {
        method: 'GET',
        path: '/videos',
        query: {
          query,
          per_page: perPage,
          sort: 'relevant',
        },
      });

      const items = body.data ?? [];

      for (const item of items) {
        const uri = item.uri ?? '';
        const videoId = uri.split('/').pop();
        const bestPicture =
          item.pictures?.sizes?.slice(-1)[0]?.link ?? item.pictures?.base_link ?? '';

        allResults.push({
          platform: 'vimeo',
          content_type: 'video',
          external_id: videoId,
          url: item.link ?? `https://vimeo.com/${videoId}`,
          thumbnail_url: bestPicture,
          media_url: item.link ?? `https://vimeo.com/${videoId}`,
          title: item.name ?? '',
          description: item.description ?? '',
          author: item.user?.name ?? '',
          author_url: item.user?.link ?? '',
          engagement: {
            views: Number(item.stats?.plays ?? 0),
            likes: Number(item.metadata?.connections?.likes?.total ?? 0),
            comments: Number(item.metadata?.connections?.comments?.total ?? 0),
          },
          raw_data: item,
        });
      }
    } catch (err) {
      console.warn(`[vimeo] Query "${query}" failed:`, err.message ?? err);
    }
  }

  return allResults;
}
