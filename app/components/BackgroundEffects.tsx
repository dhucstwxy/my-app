export function BackgroundEffects() {
  return (
    <>
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(156,146,172,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-blue-600 opacity-10 blur-xl mix-blend-multiply animate-pulse" />
        <div
          className="absolute top-40 right-20 h-72 w-72 rounded-full bg-cyan-500 opacity-10 blur-xl mix-blend-multiply animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-20 left-1/2 h-72 w-72 rounded-full bg-indigo-500 opacity-10 blur-xl mix-blend-multiply animate-pulse"
          style={{ animationDelay: '4s' }}
        />
      </div>
    </>
  );
}
