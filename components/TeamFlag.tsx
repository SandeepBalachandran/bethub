export function TeamFlag({
  flag,
  name,
  size = 20,
}: {
  readonly flag: string | null;
  readonly name: string;
  readonly size?: number;
}) {
  if (!flag) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flag}
      alt={`${name} flag`}
      width={size}
      height={size}
      className="inline-block rounded-sm object-contain"
      style={{ width: size, height: size }}
    />
  );
}
