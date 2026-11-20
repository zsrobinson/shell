import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
const repository = "https://github.com/zsrobinson/shell.git"
const sha = execFileSync("git", ["ls-remote", repository, "refs/heads/main"], {
  encoding: "utf8",
}).split(/\s/)[0]
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Could not resolve shell main")
// Preserve HTTPS so public Docker builds need no SSH credentials.
const file = new URL("../package.json", import.meta.url)
const manifest = JSON.parse(readFileSync(file, "utf8"))
manifest.dependencies["@zsrobinson/shell"] = `git+${repository}#${sha}`
writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n")
execFileSync("npm", ["install"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
})
