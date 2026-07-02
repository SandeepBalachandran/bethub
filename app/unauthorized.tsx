import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">401 — Unauthorized</h1>
      <p className="text-sm text-gray-500">
        You don&apos;t have permission to view this page.
      </p>
      <Link href="/fixtures" className="text-sm underline">
        Back to fixtures
      </Link>
    </main>
  );
}
