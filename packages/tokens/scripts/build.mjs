import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

function flatten(source, path = [], tokens = new Map()) {
  for (const [key, value] of Object.entries(source)) {
    const nextPath = [...path, key]
    if (value && typeof value === "object" && "$value" in value && "$type" in value) {
      const name = nextPath.join(".")
      if (tokens.has(name)) throw new Error(`Duplicate token name: ${name}`)
      tokens.set(name, value)
    } else if (value && typeof value === "object") {
      flatten(value, nextPath, tokens)
    } else {
      throw new Error(`Invalid token: ${nextPath.join(".")}`)
    }
  }
  return tokens
}

export function buildTokens(source) {
  const tokens = flatten(source)
  const resolve = (name, stack = []) => {
    const token = tokens.get(name)
    if (!token) throw new Error(`Unknown token reference: ${name}`)
    if (stack.includes(name)) throw new Error(`Circular token reference: ${name}`)
    return typeof token.$value === "string"
      ? token.$value.replace(/\{([^}]+)\}/g, (_, reference) => resolve(reference, [...stack, name]))
      : token.$value
  }
  const values = Object.fromEntries([...tokens.keys()].map((name) => [name, resolve(name)]))
  const css = `:root {\n${Object.entries(values).map(([name, value]) => `  --jdsb-${name.replaceAll(".", "-")}: ${value};`).join("\n")}\n}\n`
  const declarations = `export type TokenName = ${[...tokens.keys()].map((name) => JSON.stringify(name)).join(" | ")}\nexport declare const tokens: Record<TokenName, string>\n`
  return { css, source: `export const tokens = ${JSON.stringify(values, null, 2)}\n`, declarations }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(await readFile(new URL("../src/jdsb.tokens.json", import.meta.url), "utf8"))
  const output = buildTokens(source)
  await mkdir(new URL("../dist/", import.meta.url), { recursive: true })
  await Promise.all([
    writeFile(new URL("../dist/tokens.css", import.meta.url), output.css),
    writeFile(new URL("../dist/index.js", import.meta.url), output.source),
    writeFile(new URL("../dist/index.d.ts", import.meta.url), output.declarations)
  ])
}
