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
import mdx from "shiki/langs/mdx.mjs";
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
    mdx,
    yaml,
  ],
  themes: [lightTheme, darkTheme],
});

function resolveLanguage(language: string): string {
  const requested = language.toLowerCase();
  return LANGUAGE_ALIASES[requested] ?? requested;
}

type HighlightSegment = { lang: string; code: string };

/**
 * For Markdown/MDX source tabs, use CSS and JavaScript grammars inside raw
 * style/script blocks. This is presentation-only and never executes source.
 */
function sourceSegments(code: string, lang: string): HighlightSegment[] {
  if (lang !== "mdx" && lang !== "markdown") return [{ code, lang }];

  const segments: HighlightSegment[] = [];
  const lines = code.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter(Boolean) ?? [];
  let embedded: "css" | "javascript" | undefined;

  const append = (part: string, language: string) => {
    const previous = segments.at(-1);
    if (previous?.lang === language) previous.code += part;
    else segments.push({ code: part, lang: language });
  };

  for (const line of lines) {
    const withoutNewline = line.replace(/(?:\r\n|\r|\n)$/, "");
    const open = /^[ \t]*<(style|script)>[ \t]*$/i.exec(withoutNewline);
    const close = /^[ \t]*<\/(style|script)>[ \t]*$/i.exec(withoutNewline);

    if (!embedded && open) {
      append(line, lang);
      embedded = open[1].toLowerCase() === "style" ? "css" : "javascript";
    } else if (
      embedded &&
      close &&
      ((embedded === "css" && close[1].toLowerCase() === "style") ||
        (embedded === "javascript" && close[1].toLowerCase() === "script"))
    ) {
      append(line, lang);
      embedded = undefined;
    } else {
      append(line, embedded ?? lang);
    }
  }

  return segments;
}

/** Source text, grammar selection and optional reusable Shiki highlighter. */
export interface HighlightedCodeProps {
  code: string;
  language?: string;
  /** Optional pre-built highlighter; defaults to a shared lazy instance. */
  highlighter?: HighlighterCore;
}

/**
 * Highlight runtime source as escaped React text, preserving exact line endings.
 * MDX raw style/script bodies use CSS/JavaScript grammars without executing code.
 * Browser regression tests should assert computed token colors inside the body,
 * not merely the presence of highlighted tags or token spans.
 */
export function HighlightedCode({
  code,
  language = DEFAULT_LANGUAGE,
  highlighter = DEFAULT_HIGHLIGHTER,
}: HighlightedCodeProps) {
  const lang = resolveLanguage(language);

  if (!highlighter.getLoadedLanguages().includes(lang)) {
    return <code>{code}</code>;
  }

  const highlighted = sourceSegments(code, lang).map((segment) => {
    const language = highlighter.getLoadedLanguages().includes(segment.lang)
      ? segment.lang
      : lang;
    const { tokens } = highlighter.codeToTokens(segment.code, {
      lang: language,
      themes: THEMES,
    });

    // Shiki removes line endings from tokens. Restore the exact separators,
    // including CRLF and a trailing newline before the next language segment.
    const lineEndings = segment.code.match(/\r\n|\r|\n/g) ?? [];
    return { tokens, lineEndings };
  });

  return (
    <code className="mf-highlighted-code" data-moyaforge-highlighted-code="">
      {highlighted.map(({ tokens, lineEndings }, segmentIndex) => (
        <Fragment key={segmentIndex}>
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
                      // Apply token colors directly so host documentation
                      // code styles cannot override embedded CSS/JS grammar.
                      // The public CSS token still takes precedence.
                      color:
                        "var(--mf-preview-syntax-color, light-dark(var(--shiki-light, inherit), var(--shiki-dark, inherit)))",
                    } as CSSProperties
                  }
                >
                  {token.content}
                </span>
              ))}
            </Fragment>
          ))}
          {lineEndings.slice(Math.max(0, tokens.length - 1)).join("")}
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
