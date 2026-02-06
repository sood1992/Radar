import youtubeSearch from './youtube.js';
import instagramSearch from './instagram.js';
import tiktokSearch from './tiktok.js';
import pinterestSearch from './pinterest.js';
import behanceSearch from './behance.js';
import vimeoSearch from './vimeo.js';
import metaAdsSearch from './meta-ads.js';

/**
 * Map of platform name -> search function.
 */
const platformSearchers = {
  youtube: youtubeSearch,
  instagram: instagramSearch,
  tiktok: tiktokSearch,
  pinterest: pinterestSearch,
  behance: behanceSearch,
  vimeo: vimeoSearch,
  'meta-ads': metaAdsSearch,
};

/**
 * Wrap a promise with a timeout. Rejects if the promise does not settle
 * within `ms` milliseconds.
 */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Run searches across all enabled platforms in parallel.
 *
 * @param {object}   parsedBrief
 * @param {object}   parsedBrief.search_queries - Keys are platform names,
 *   values are arrays of query strings (e.g. { youtube: ['...', '...'], instagram: ['#tag'] }).
 * @param {string[]} enabledPlatforms - Platform names to run, e.g. ['youtube', 'instagram'].
 * @param {object}   [options] - Per-platform options can be passed as
 *   `options.<platform>`, e.g. `options.youtube = { maxResults: 20 }`.
 * @returns {Promise<object[]>} Array of per-platform result envelopes:
 *   { platform, results, status: 'fulfilled'|'rejected', error? }
 */
export async function searchAll(parsedBrief, enabledPlatforms = [], options = {}) {
  const TIMEOUT_MS = 60_000;
  const searchQueries = parsedBrief?.search_queries ?? {};

  // Build one promise per enabled platform
  const tasks = enabledPlatforms
    .filter((name) => {
      if (!platformSearchers[name]) {
        console.warn(`[aggregator] Unknown platform "${name}" – skipping.`);
        return false;
      }
      return true;
    })
    .map((name) => {
      // Handle key mismatch: Claude returns "meta_ads" but platform name is "meta-ads"
      const queryKey = name.replace('-', '_');
      const queries = searchQueries[name] ?? searchQueries[queryKey] ?? [];
      const platformOptions = options[name] ?? {};

      const promise = (async () => {
        try {
          return await withTimeout(
            platformSearchers[name](queries, platformOptions),
            TIMEOUT_MS,
            name,
          );
        } catch (err) {
          // Re-throw so Promise.allSettled marks it as rejected
          throw err;
        }
      })();

      return { name, promise };
    });

  // Run all in parallel
  const outcomes = await Promise.allSettled(tasks.map((t) => t.promise));

  // Combine into uniform envelopes
  return tasks.map((task, idx) => {
    const outcome = outcomes[idx];

    if (outcome.status === 'fulfilled') {
      return {
        platform: task.name,
        results: outcome.value,
        status: 'fulfilled',
      };
    }

    const errorMessage =
      outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
    console.warn(`[aggregator] Platform "${task.name}" failed: ${errorMessage}`);

    return {
      platform: task.name,
      results: [],
      status: 'rejected',
      error: errorMessage,
    };
  });
}

export default searchAll;
