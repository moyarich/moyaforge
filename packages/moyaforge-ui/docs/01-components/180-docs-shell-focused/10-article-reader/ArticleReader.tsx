import "./ArticleReader.css";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { DocsShellFocused } from "../../../../src/components/DocsShellFocused/DocsShellFocused.js";

const chapters = [
  {
    title: "Write for the next reader",
    subtitle: "A practical guide to useful documentation · 3 min read",
    heading: "Begin with a real task",
    body: "Good documentation starts with something a reader needs to do. Give the page a clear purpose, introduce the smallest working example, and explain what the reader should see when it succeeds.",
    takeaway:
      "A useful page answers one question well and makes the next step easy to find.",
  },
  {
    title: "Make examples worth copying",
    subtitle: "A practical guide to useful documentation · 4 min read",
    heading: "Show the complete path",
    body: "Include the imports, configuration, and styles an example needs. Use meaningful file names, keep the source close to the result, and explain which values readers should change for their own project.",
    takeaway:
      "Test the example as a reader would: copy it into a fresh project and follow every step.",
  },
];

export default function ArticleReader() {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const chapter = chapters[chapterIndex];

  function toggleSaved() {
    setSaved((previous) => !previous);
  }
  function previousChapter() {
    setChapterIndex((previous) => previous - 1);
  }
  function nextChapter() {
    setChapterIndex((previous) => previous + 1);
  }

  return (
    <div className="article-reader-example">
      <DocsShellFocused
        title={chapter.title}
        subtitle={chapter.subtitle}
        navigation={null}
        articleActions={
          <button
            className="article-reader-save"
            type="button"
            onClick={toggleSaved}
            aria-pressed={saved}
          >
            <Bookmark aria-hidden="true" />
            {saved ? "Saved" : "Save guide"}
          </button>
        }
        footer={
          <div className="article-reader-pagination">
            <button
              type="button"
              onClick={previousChapter}
              disabled={chapterIndex === 0}
            >
              ← Previous
            </button>
            <span>
              Chapter {chapterIndex + 1} of {chapters.length}
            </span>
            <button
              type="button"
              onClick={nextChapter}
              disabled={chapterIndex === chapters.length - 1}
            >
              Next →
            </button>
          </div>
        }
      >
        <p className="article-reader-eyebrow">Writing better guides</p>
        <h2>{chapter.heading}</h2>
        <p>{chapter.body}</p>
        <blockquote>{chapter.takeaway}</blockquote>
        <p className="article-reader-hint">
          Use the chapter controls below. The reading layout stays in place
          while the content changes.
        </p>
      </DocsShellFocused>
    </div>
  );
}
