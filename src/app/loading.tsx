export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gradient">
      <div className="text-center">
        <div className="text-6xl animate-bounce mb-4">📚</div>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
