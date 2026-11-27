/** Declarative attribute values, never evaluated as JavaScript. */
export type DirectiveValue = string | number | boolean | null | DirectiveValue[] | { [key: string]: DirectiveValue };
export type DirectiveProps = Record<string, DirectiveValue>;

const forbidden = new Set(["__proto__", "constructor", "prototype", "dangerouslySetInnerHTML", "children", "ref"]);

function safeName(name: string): string {
  const prop = name === "class" ? "className" : name;
  if (forbidden.has(prop) || /^on[A-Z]/.test(prop))
    throw new Error("Unsupported directive prop: " + prop + ". Use trusted MDX JSX for executable or structural props.");
  return prop;
}

function literal(value: string, quoted: boolean): DirectiveValue {
  if (value.startsWith("json:")) {
    const parsed = JSON.parse(value.slice(5)) as DirectiveValue;
    return parsed;
  }
  if (quoted) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value) && Number.isFinite(Number(value)))
    return Number(value);
  return value;
}

/** Read the authored tokens, retaining quoted strings and bare flags. */
export function readDirectiveAttributes(source: string) {
  const props: DirectiveProps = Object.create(null);
  const flags: string[] = [];
  let index = 0;
  const space = () => { while (/\s/.test(source[index] ?? "") && index < source.length) index++; };
  const put = (name: string, value: DirectiveValue) => {
    const key = safeName(name);
    if (Object.hasOwn(props, key)) throw new Error("Duplicate directive prop: " + key);
    props[key] = value;
  };
  while (index < source.length) {
    space();
    if (index === source.length) break;
    const shorthand = /^[.#]([\w-]+)/.exec(source.slice(index));
    if (shorthand) {
      index += shorthand[0].length;
      if (shorthand[0][0] === ".") {
        props.className = [props.className, shorthand[1]].filter(Boolean).join(" ");
      } else put("id", shorthand[1]);
      continue;
    }
    const name = /^[A-Za-z_$][\w$-]*/.exec(source.slice(index))?.[0];
    if (!name) throw new Error("Invalid directive attribute near: " + source.slice(index));
    index += name.length;
    space();
    if (source[index] !== "=") {
      put(name, true);
      flags.push(name);
      continue;
    }
    index++;
    space();
    const quote = source[index];
    if (quote === '"' || quote === "'") {
      index++;
      const start = index;
      while (index < source.length && source[index] !== quote) index++;
      if (index === source.length) throw new Error("Unclosed directive attribute: " + name);
      put(name, literal(source.slice(start, index), true));
      index++;
    } else {
      const value = /^[^\s]+/.exec(source.slice(index))?.[0] ?? "";
      index += value.length;
      put(name, literal(value, false));
    }
  }
  return { props, flags };
}

/** Serialize values into literal ESTree, not executable source expressions. */
function expression(value: DirectiveValue): object {
  if (Array.isArray(value)) return { type: "ArrayExpression", elements: value.map(expression) };
  if (value !== null && typeof value === "object")
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, child]) => ({
        type: "Property", kind: "init", method: false, shorthand: false,
        computed: true, key: { type: "Literal", value: key }, value: expression(child),
      })),
    };
  if (typeof value === "number" && value < 0)
    return { type: "UnaryExpression", operator: "-", prefix: true, argument: { type: "Literal", value: -value } };
  return { type: "Literal", value };
}

export function directivePropAttribute(name: string, value: DirectiveValue) {
  return {
    type: "mdxJsxAttribute" as const,
    name,
    value: typeof value === "string" ? value : value === true ? null : {
      type: "mdxJsxAttributeValueExpression" as const,
      value: JSON.stringify(value),
      data: { estree: { type: "Program" as const, sourceType: "module" as const,
        body: [{ type: "ExpressionStatement" as const, expression: expression(value) }] } },
    },
  };
}

export function authoredAttributeText(line: string): string | undefined {
  // The opening line's final brace group is attributes, not the label.
  return /^(?: {0,3}):{2,}\s*[\w-]+(?:\[[^\]]*\]|[^{}]*?)?\s*\{(.*)\}\s*$/.exec(line)?.[1];
}
