import { useId, useState, type ChangeEvent } from "react";
import { InteractivePreview } from "../../../src/components/InteractivePreview/index.js";

export default function MessagePreview() {
  const id = useId();
  const [message, setMessage] = useState("Hello, workspace.");
  function updateMessage(event: ChangeEvent<HTMLInputElement>) {
    setMessage(event.currentTarget.value);
  }
  return (
    <InteractivePreview
      title="Configure a message"
      description="Controls and metadata share a resizable row. The rendered message stays below."
      files={{ "message.json": JSON.stringify({ message }, null, 2) }}
      controls={
        <label htmlFor={id}>
          Message
          <input id={id} value={message} onChange={updateMessage} />
        </label>
      }
      metadata={<p>{message.length} characters</p>}
    >
      <p>{message || "Enter a message above."}</p>
    </InteractivePreview>
  );
}
