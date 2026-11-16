import "./styles.css";
import { greeting } from "./config.js";

export default function Greeting() {
  return (
    <div className="mf-preview-greeting">
      <p>{greeting}</p>
    </div>
  );
}
