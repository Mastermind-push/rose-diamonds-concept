import type { ComponentProps } from "react";

// Pages uses ordinary document navigation; no Next.js server is required.
export default function Link({ children, ...props }: ComponentProps<"a">) {
  return <a {...props}>{children}</a>;
}
