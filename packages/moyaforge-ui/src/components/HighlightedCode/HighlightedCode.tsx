import { Fragment, type CSSProperties } from "react";
import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import javascript from "shiki/langs/javascript.mjs";
import jsx from "shiki/langs/jsx.mjs";
import css from "shiki/langs/css.mjs";
import json from "shiki/langs/json.mjs";
import html from "shiki/langs/html.mjs";
import bash from "shiki/langs/bash.mjs";
import markdown from "shiki/langs/markdown.mjs";
import yaml from "shiki/langs/yaml.mjs";
import lightTheme from "shiki/themes/github-light.mjs";
import darkTheme from "shiki/themes/github-dark.mjs";

import "./HighlightedCode.css";

const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
  md: "markdown",
  yml: "yaml",
  htm: "html",
};

const THEMES = { light: "github-light", dark: "github-dark" } as const;
const DEFAULT_LANGUAGE = "tsx";

const DEFAULT_HIGHLIGHTER = /* @__PURE__ */ createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [
    tsx,
    typescript,
    javascript,
    jsx,
    css,
    json,
    html,
    bash,
    markdown,
    yaml,
  ],
  themes: [lightTheme, darkTheme],
});

function resolveLanguage(language: string): string {
  const requested = language.toLowerCase();
  return LANGUAGE_ALIASES[requested] ?? requested;
}

export interface HighlightedCodeProps {
  code: string;
  language?: string;
  /** Optional pre-built highlighter; defaults to a shared lazy instance. */
  highlighter?: HighlighterCore;
}

/** Highlight source strings supplied at runtime, preserving their exact text. */
export function HighlightedCode({
  code,
  language = DEFAULT_LANGUAGE,
  highlighter = DEFAULT_HIGHLIGHTER,
}: HighlightedCodeProps) {
  const lang = resolveLanguage(language);

  if (!highlighter.getLoadedLanguages().includes(lang)) {
    return <code>{code}</code>;
  }

  const { tokens } = highlighter.codeToTokens(code, { lang, themes: THEMES });

  // Shiki splits on line breaks; re-insert the original separators so the
  // rendered text matches `code` exactly (including \r\n).
  const lineEndings = code.match(/\r\n|\r|\n/g) ?? [];

  return (
    <code data-moyaforge-highlighted-code="">
      {tokens.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && lineEndings[lineIndex - 1]}
          {line.map((token, tokenIndex) => (
            <span
              key={tokenIndex}
              style={
                {
                  "--shiki-light": token.htmlStyle?.color,
                  "--shiki-dark": token.htmlStyle?.["--shiki-dark"],
                } as CSSProperties
              }
            >
              {token.content}
            </span>
          ))}
        </Fragment>
      ))}
    </code>
  );
}

/** Infer a supported grammar from a source tab's filename. */
export function previewLanguage(label: string): string {
  const dot = label.lastIndexOf(".");
  return dot === -1 ? "text" : label.slice(dot + 1).toLowerCase();
}
