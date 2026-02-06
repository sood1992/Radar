import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-5-20250929';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// Fallback: naive keyword extraction when API is unavailable
// ---------------------------------------------------------------------------
function fallbackParseBrief(briefText) {
  const words = briefText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const unique = [...new Set(words)].slice(0, 10);
  const queries = unique.slice(0, 3);
  const hashtags = unique.slice(0, 3).map((w) => `#${w}`);

  return {
    search_queries: {
      youtube: queries,
      instagram: hashtags,
      tiktok: queries,
      pinterest: queries.slice(0, 2),
      behance: queries.slice(0, 2),
      vimeo: queries,
      meta_ads: [queries[0] || 'creative'],
    },
    content_types: ['reel', 'short', 'video', 'image'],
    visual_keywords: unique.slice(0, 5),
    reference_brands: [],
    scoring_criteria: briefText,
  };
}

// ---------------------------------------------------------------------------
// 1. parseBrief
// ---------------------------------------------------------------------------
export async function parseBrief(briefText) {
  const client = getClient();
  if (!client) {
    console.warn('ANTHROPIC_API_KEY not set — using fallback keyword extraction.');
    return fallbackParseBrief(briefText);
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are a creative research assistant for a production agency.
Parse this creative brief into structured search parameters.

Return JSON only, no explanation:
{
  "search_queries": {
    "youtube": ["query1", "query2", "query3"],
    "instagram": ["hashtag1", "hashtag2", "hashtag3"],
    "tiktok": ["query1", "query2", "query3"],
    "pinterest": ["query1", "query2"],
    "behance": ["query1", "query2"],
    "vimeo": ["query1", "query2", "query3"],
    "meta_ads": ["query1"]
  },
  "content_types": ["reel", "short", "video", "image"],
  "visual_keywords": ["keyword1", "keyword2"],
  "reference_brands": ["brand1", "brand2"],
  "scoring_criteria": "Description of what makes a result highly relevant..."
}`,
      messages: [{ role: 'user', content: briefText }],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Extract JSON from the response (handles possible markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Claude response did not contain valid JSON — falling back.');
      return fallbackParseBrief(briefText);
    }

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Claude parseBrief error:', err.message);
    return fallbackParseBrief(briefText);
  }
}

// ---------------------------------------------------------------------------
// 2. scoreResults
// ---------------------------------------------------------------------------
export async function scoreResults(results, scoringCriteria) {
  if (!results || results.length === 0) {
    return [];
  }

  const client = getClient();
  if (!client) {
    console.warn('ANTHROPIC_API_KEY not set — returning default scores.');
    return results.map((_, index) => ({
      index,
      relevance_score: 0.5,
      analysis: 'Scored by default — API key not configured.',
      tags: [],
    }));
  }

  const BATCH_SIZE = 30;
  const batches = [];
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    batches.push(results.slice(i, i + BATCH_SIZE));
  }

  const allScored = [];

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const globalOffset = batchIdx * BATCH_SIZE;

    const simplified = batch.map((r, i) => ({
      index: globalOffset + i,
      platform: r.platform || 'unknown',
      title: r.title || '',
      description: (r.description || '').slice(0, 300),
      author: r.author || '',
      engagement: summarizeEngagement(r.engagement),
      content_type: r.content_type || 'unknown',
    }));

    const userMessage = `Scoring criteria:\n${scoringCriteria}\n\nResults to score:\n${JSON.stringify(simplified, null, 2)}`;

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: `You are a creative research assistant. Score each result for relevance to the creative brief.
Return a JSON array only, no explanation. Each element: { "index": 0, "relevance_score": 0.85, "analysis": "1-2 sentence analysis", "tags": ["tag1", "tag2"] }
Only include results scoring above 0.3.`,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scored = JSON.parse(jsonMatch[0]);
        allScored.push(...scored);
      } else {
        // If parsing fails for this batch, fall back to default scores
        allScored.push(
          ...batch.map((_, i) => ({
            index: globalOffset + i,
            relevance_score: 0.5,
            analysis: 'Could not parse AI scoring response.',
            tags: [],
          }))
        );
      }
    } catch (err) {
      console.error(`Claude scoreResults batch ${batchIdx} error:`, err.message);
      // Fall back to default scores for this batch
      allScored.push(
        ...batch.map((_, i) => ({
          index: globalOffset + i,
          relevance_score: 0.5,
          analysis: 'Scored by default — API call failed.',
          tags: [],
        }))
      );
    }
  }

  return allScored;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function summarizeEngagement(engagement) {
  if (!engagement) return 'N/A';
  if (typeof engagement === 'string') return engagement;
  if (typeof engagement === 'number') return String(engagement);

  const parts = [];
  if (engagement.views != null) parts.push(`${engagement.views} views`);
  if (engagement.likes != null) parts.push(`${engagement.likes} likes`);
  if (engagement.comments != null) parts.push(`${engagement.comments} comments`);
  if (engagement.shares != null) parts.push(`${engagement.shares} shares`);

  return parts.length > 0 ? parts.join(', ') : 'N/A';
}
