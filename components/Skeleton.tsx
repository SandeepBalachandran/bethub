export function Skeleton({ className = "" }: { readonly className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}
