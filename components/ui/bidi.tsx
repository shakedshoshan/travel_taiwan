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
