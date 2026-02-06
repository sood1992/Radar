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
      max_tokens: 2048,
      system: `You are a senior creative director at a production agency helping a team find visual references.

Your job: parse a creative brief into search queries. The critical insight is that great creative references often come from OUTSIDE the literal subject matter.

If someone asks for "luxury hotel cinematic reel," yes — search for hotel content. But ALSO think:
- What TECHNIQUES does this brief imply? (gimbal movement, warm grading, slow motion, macro details, etc.)
- What OTHER industries use the same visual language? (automotive brands shoot with the same cinematic feel, perfume ads use similar warm tones, architecture photography has the same composition principles, fashion campaigns use similar lighting)
- What MOODS or FEELINGS does the brief evoke? (elegance, intimacy, grandeur, serenity)

For each platform, generate TWO types of queries:
1. LITERAL queries — directly about the subject (hotel cinematic, hotel brand film, etc.)
2. LATERAL queries — about the techniques, moods, and visual styles from other domains (cinematic gimbal walkthrough, warm tone color grading, luxury brand campaign, architectural photography, product film smooth camera)

Mix both types together. Aim for 60% literal, 40% lateral.

Return JSON only, no explanation:
{
  "search_queries": {
    "youtube": ["literal query 1", "lateral query from another industry", "technique-based query", "mood-based query"],
    "instagram": ["#literalhashtag", "#techniquetag", "#moodtag", "#crossindustrytag"],
    "tiktok": ["literal query", "technique or trend query", "cross-industry query"],
    "pinterest": ["literal visual query", "technique/mood/composition query"],
    "behance": ["literal portfolio query", "cross-discipline design query"],
    "vimeo": ["literal film query", "technique or cinematography style query", "cross-industry film query"],
    "meta_ads": ["literal ad query", "cross-industry ad query"]
  },
  "content_types": ["reel", "short", "video", "image"],
  "visual_keywords": ["cinematic", "warm tones", "gimbal", "slow motion"],
  "reference_brands": ["brand1", "brand2"],
  "lateral_inspiration": ["automotive campaigns for camera movement ref", "perfume ads for warm intimate lighting", "architecture photography for composition"],
  "scoring_criteria": "Describe what makes a result relevant — focus on VISUAL and CREATIVE qualities (camera movement, color grading, composition, pacing, lighting, production quality) not just subject matter. A car commercial with the perfect gimbal movement and warm grading IS relevant to a hotel brief even though it's not about hotels."
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
        system: `You are a senior creative director scoring reference material for a production team.

Score each result for CREATIVE RELEVANCE to the brief — not just topic match.

A result is highly relevant if it demonstrates the right:
- Visual techniques (camera movement, framing, transitions, pacing)
- Color and lighting (grading style, mood, tone)
- Production quality and polish
- Emotional feel or brand positioning
- Composition and art direction

A result from a completely different industry CAN score 0.9+ if its visual language matches the brief perfectly. A hotel video with bad production quality should score LOWER than a car commercial with exactly the cinematic feel the brief describes.

For each result, explain WHY it's useful as a reference — what specific creative element can the team learn from or replicate?

Return a JSON array only, no explanation. Each element:
{ "index": 0, "relevance_score": 0.85, "analysis": "What makes this useful as a creative reference — specific visual/creative elements", "tags": ["technique-tag", "mood-tag", "style-tag"] }
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
