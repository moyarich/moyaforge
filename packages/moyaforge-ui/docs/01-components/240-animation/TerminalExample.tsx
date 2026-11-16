import "./TerminalExample.css";
import { RotateCcw, Terminal } from "lucide-react";
import { useState } from "react";
import {
  Animation,
  AnimationGroup,
} from "../../../src/components/Animation/index.js";

const checks = [
  "Preflight checks passed",
  "Framework detected: Next.js",
  "Tailwind CSS validated",
  "Import alias validated (@/*)",
];
const changes = [
  ["Created", "components.json"],
  ["Updated", "tailwind.config.ts"],
  ["Updated", "app/globals.css"],
  ["Created", "lib/utils.ts"],
  ["Installed", "dependencies"],
];

export function TerminalExample() {
  const [run, setRun] = useState(0);
  return (
    <section
      className="mf-animation-terminal"
      aria-label="shadcn initialization transcript"
    >
      <header className="mf-animation-terminal-header">
        <span>
          <Terminal size={15} aria-hidden="true" /> Terminal
        </span>
        <button type="button" onClick={() => setRun((current) => current + 1)}>
          <RotateCcw size={14} aria-hidden="true" /> Replay
        </button>
      </header>
      <div className="mf-animation-terminal-output">
        <AnimationGroup key={run} sequence expand stagger={0.04}>
          <Animation effect="typewriter" duration={0.7}>
            <strong className="mf-animation-terminal-command mf-animation-terminal-prompt">
              &gt; npx shadcn@latest init
            </strong>
          </Animation>
          {checks.map((check) => (
            <Animation
              key={check}
              effect="fade-slide"
              distance={4}
              duration={0.22}
            >
              <span className="mf-animation-terminal-check">✔</span> {check}
            </Animation>
          ))}
          {changes.map(([action, file], index) => (
            <Animation
              key={file}
              effect="fade-slide"
              distance={4}
              duration={0.22}
            >
              <div
                className={
                  index === 0 ? "mf-animation-terminal-section" : undefined
                }
              >
                <span className="mf-animation-terminal-check">✔</span>{" "}
                {action.padEnd(10)} {file}
              </div>
            </Animation>
          ))}
          <Animation effect="typewriter" duration={0.2}>
            <div className="mf-animation-terminal-section mf-animation-terminal-success">
              Success! Project initialized.
            </div>
          </Animation>
          <Animation effect="typewriter" duration={0.2}>
            <div className="mf-animation-terminal-section">
              Next step: add your first component
              <div className="mf-animation-terminal-command">
                npx shadcn@latest add button
              </div>
            </div>
          </Animation>
        </AnimationGroup>
      </div>
    </section>
  );
}
