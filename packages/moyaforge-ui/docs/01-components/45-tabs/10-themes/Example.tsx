import { useState } from "react";
import { FileCode2, FileText, Settings2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../src/components/Tabs/index.js";
import "./Example.css";

type Theme = "default" | "workspace" | "fluent";

export default function Example() {
  const [theme, setTheme] = useState<Theme>("fluent");
  return (
    <div className="tab-theme-demo">
      <label className="tab-theme-picker">
        CSS theme
        <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
          <option value="default">Default</option>
          <option value="workspace">Curved workspace</option>
          <option value="fluent">Fluent blue light</option>
        </select>
      </label>
      <Tabs defaultValue="content" className={`tab-theme-example tab-theme--${theme}`}>
        <TabsList aria-label="Editor panels">
          <TabsTrigger value="content" icon={<FileText size={16} />}>Content</TabsTrigger>
          <TabsTrigger value="source" icon={<FileCode2 size={16} />}>Source</TabsTrigger>
          <TabsTrigger value="settings" icon={<Settings2 size={16} />}>Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <section className="tab-theme-panel">
            <h3>Rich text editor</h3>
            <p>Tabs and the content panel use the same CSS theme.</p>
            <p>Change the theme to compare the tab indicator, borders, corner curves, and panel surface.</p>
          </section>
        </TabsContent>
        <TabsContent value="source">
          <section className="tab-theme-panel">
            <h3>Source</h3>
            <pre>{"<article>\\n  <h1>Hello world</h1>\\n</article>"}</pre>
          </section>
        </TabsContent>
        <TabsContent value="settings">
          <section className="tab-theme-panel">
            <h3>Settings</h3>
            <p>Override the public <code>--mf-tabs-*</code> variables to change the theme.</p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
