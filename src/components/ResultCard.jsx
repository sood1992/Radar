import { useState } from 'react';
import ScoreBadge from './ScoreBadge';
import PlatformBadge from './PlatformBadge';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function ResultCard({ result, onSave, onHide }) {
  const [expanded, setExpanded] = useState(false);
  const eng = result.engagement || {};

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors group"
    >
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {result.thumbnail_url ? (
          <img
            src={result.thumbnail_url}
            alt={result.title || ''}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 bg-zinc-800 flex items-center justify-center text-zinc-600">
            No preview
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <PlatformBadge platform={result.platform} />
          {result.content_type && (
            <span className="bg-zinc-900/80 text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded uppercase">
              {result.content_type}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-zinc-200 leading-snug line-clamp-2">
            {result.title || 'Untitled'}
          </h3>
          <ScoreBadge score={result.ai_relevance_score} />
        </div>
        {result.author && (
          <p className="text-xs text-zinc-500 truncate">{result.author}</p>
        )}

        {/* Engagement stats */}
        {(eng.views || eng.likes) && (
          <div className="flex gap-3 mt-2 text-xs text-zinc-500">
            {eng.views != null && <span>{formatCount(eng.views)} views</span>}
            {eng.likes != null && <span>{formatCount(eng.likes)} likes</span>}
            {eng.comments != null && <span>{formatCount(eng.comments)} comments</span>}
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
            {result.ai_analysis && (
              <p className="text-xs text-zinc-400 leading-relaxed">{result.ai_analysis}</p>
            )}
            {result.description && (
              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">
                {result.description}
              </p>
            )}
            {result.ai_tags && result.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.ai_tags.map((tag, i) => (
                  <span key={i} className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 rounded-lg transition-colors"
          >
            Open &#8599;
          </a>
          {onSave && (
            <button
              onClick={() => onSave(result)}
              className="flex-1 text-xs font-medium bg-zinc-800 hover:bg-orange-500/20 hover:text-orange-400 text-zinc-300 py-1.5 rounded-lg transition-colors"
            >
              Save
            </button>
          )}
          {onHide && (
            <button
              onClick={() => onHide(result.id)}
              className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 transition-colors"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
