export function DevelopmentBanner() {
  const isDev = process.env.ENVIRONMENT === "development";

  if (!isDev) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-yellow-500 text-black py-2 px-4 text-center font-semibold">
      🔧 DEVELOPMENT MODE - Using Dev Database (fifu-dev)
    </div>
  );
}
