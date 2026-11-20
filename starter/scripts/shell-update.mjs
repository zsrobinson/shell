import { execFileSync } from "node:child_process"
const repository = "https://github.com/zsrobinson/shell.git"
const sha = execFileSync("git", ["ls-remote", repository, "refs/heads/main"], {
  encoding: "utf8",
}).split(/\s/)[0]
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Could not resolve shell main")
execFileSync(
  "npm",
  ["install", "--save-exact", `@zsrobinson/shell=git+${repository}#${sha}`],
  { stdio: "inherit" }
)
