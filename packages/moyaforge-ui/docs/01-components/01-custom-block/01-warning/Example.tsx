import "./example.css";
import { CustomBlock } from "../../../../src/components/CustomBlock/index.js";

export default function Example() {
  return (
    <div className="warning-example">
      <CustomBlock type="warning" title="Before you continue">
        Save a backup before changing your settings.
      </CustomBlock>
    </div>
  );
}
