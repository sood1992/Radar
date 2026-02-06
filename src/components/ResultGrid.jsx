import ResultCard from './ResultCard';

export default function ResultGrid({ results, onSave, onHide }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500">No results found</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
      {results.map((result) => (
        <div key={result.id} className="break-inside-avoid mb-4">
          <ResultCard result={result} onSave={onSave} onHide={onHide} />
        </div>
      ))}
    </div>
  );
}
