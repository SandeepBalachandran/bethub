export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded border bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
