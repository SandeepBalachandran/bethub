export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
