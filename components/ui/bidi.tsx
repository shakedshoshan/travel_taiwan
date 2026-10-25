import type { ReactNode } from "react";

/** Isolates an LTR run (number lists, date ranges) inside Hebrew RTL text. */
export function LtrText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={className} style={{ unicodeBidi: "isolate" }}>
      {children}
    </bdi>
  );
}

/** Date range such as 6.11–8.12, kept in start→end order. */
export function DateRange({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <LtrText className={className}>{children}</LtrText>;
}

/** Keeps digits in LTR order inside a Hebrew sentence ("טייפה: 101, הר הפיל"). */
export function BidiFragments({ text }: { text: string }) {
  const parts = text.split(/(\d[\d./:]*)/g);
  return (
    <bdi dir="rtl">
      {parts.map((part, index) =>
        /^\d/.test(part) ? (
          <bdi key={`${index}-${part}`} dir="ltr">
            {part}
          </bdi>
        ) : (
          <bdi key={`${index}-${part.slice(0, 12)}`} dir="rtl">
            {part}
          </bdi>
        )
      )}
    </bdi>
  );
}

/** Keeps parentheses attached to one RTL phrase. */
export function RtlParen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <bdi
      dir="rtl"
      className={className}
      style={{ unicodeBidi: "isolate" }}
    >
      {children}
    </bdi>
  );
}
