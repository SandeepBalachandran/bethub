"use client";

import { useId } from "react";
import { InlineScript } from "@/components/InlineScript";

/**
 * Renders `date` formatted in the viewer's own locale/timezone, not the
 * server's. `toLocaleString()` in a Server Component runs on the server
 * (UTC on Vercel), which is wrong for anyone viewing from another timezone —
 * this uses the inline-script hydration technique to fix it before paint.
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 */
export function LocalDateTime({
  date,
  options,
}: {
  readonly date: string;
  readonly options?: Intl.DateTimeFormatOptions;
}) {
  const id = useId();

  return (
    <>
      <time id={id} dateTime={date} suppressHydrationWarning>
        {new Date(date).toLocaleString(undefined, options)}
      </time>
      <InlineScript
        html={`{var n=document.getElementById(${JSON.stringify(id)});if(n)n.textContent=new Date(${JSON.stringify(date)}).toLocaleString(undefined,${JSON.stringify(options)})}`}
      />
    </>
  );
}
