import "./greeting-card.css";
import { greeting } from "./greeting-message.js";

export default function GreetingCard() {
  return (
    <div className="mf-preview-greeting">
      <p>{greeting}</p>
    </div>
  );
}
