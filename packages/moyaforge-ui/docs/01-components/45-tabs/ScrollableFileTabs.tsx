import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../src/components/Tabs/index.js";
import "./ScrollableFileTabs.css";

const files = [
  "App.tsx",
  "styles.css",
  "package.json",
  "main.tsx",
  "vite.config.ts",
  "tsconfig.json",
  "README.md",
  "index.html",
  "utils.ts",
];

export default function ScrollableFileTabs() {
  return (
    <Tabs className="tabs-overflow-example" defaultValue={files[0]}>
      <TabsList tabsScroll aria-label="Open files">
        {files.map((file) => (
          <TabsTrigger key={file} value={file}>
            {file}
          </TabsTrigger>
        ))}
      </TabsList>
      {files.map((file) => (
        <TabsContent key={file} value={file}>
          <div className="tabs-overflow-panel">Editing {file}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
