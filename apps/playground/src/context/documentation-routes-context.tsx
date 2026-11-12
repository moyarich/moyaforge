import { NormalizedPage } from "@moyarich/moyaforge-mdx";
import { createContext } from "react";

export type DocumentationRoute = Pick<NormalizedPage, "path" | "navigation">;

export const DocumentationRoutesContext = createContext<
  readonly DocumentationRoute[]
>([]);
