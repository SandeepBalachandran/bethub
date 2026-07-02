export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
