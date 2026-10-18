import "./PublishTabsPreview.css";
import {
  Preview,
  PreviewHeader,
  PreviewTitle,
  PreviewActions,
  PreviewCodeToggle,
  PreviewContent,
  PreviewSource,
  PreviewCopyButton,
} from "../../../src/components/Preview/index.js";
import { MonacoCodeGroup } from "../../../src/components/Monaco/MonacoCodeGroup.js";

const files = [
  {
    name: "publish-npm.sh",
    language: "shell",
    value: "npm exec -- workspace-publish . --registry=npm --dry-run\n",
  },
  {
    name: "publish-github.sh",
    language: "shell",
    value: "npm exec -- workspace-publish . --registry=github --dry-run\n",
  },
];

/** Multi-file Monaco tabs are owned by Monaco, not Preview. */
export default function PublishTabsPreview() {
  return (
    <Preview
      source={files.map((file) => `# ${file.name}\n${file.value}`).join("\n")}
    >
      <PreviewHeader>
        <PreviewTitle>Publishing commands</PreviewTitle>
        <PreviewActions>
          <PreviewCodeToggle asChild>
            <button type="button">Toggle editor</button>
          </PreviewCodeToggle>
          <PreviewCopyButton />
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent asChild>
        <div className="mf-publish-preview-stage">
          <p>
            Open the editor to switch between npm and GitHub Packages commands.
          </p>
          <p>These are dry-run examples; they do not publish packages.</p>
        </div>
      </PreviewContent>
      <PreviewSource asChild>
        <div className="mf-publish-preview-editor">
          <MonacoCodeGroup
            files={files}
            editable
            height={220}
            theme="vs-dark"
          />
        </div>
      </PreviewSource>
    </Preview>
  );
}
