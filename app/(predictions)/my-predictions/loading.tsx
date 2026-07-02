export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded border bg-gray-100" />
      ))}
    </main>
  );
}
