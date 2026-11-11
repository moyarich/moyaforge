import { useState } from "react";
import { Link } from "react-router-dom";
export function Playground() {
  const [count, setCount] = useState(0);
  return <main><h1>Interactive playground</h1><button onClick={() => setCount(value => value + 1)}>Count: {count}</button><Link to="/docs">Read the docs</Link></main>;
}
