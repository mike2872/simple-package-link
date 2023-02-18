const { readdirSync: readDirectory } = require("fs");

const DEFAULT_SCOPES = ["root"];

function getScopes(paths = []) {
  return paths
    .map((path) =>
      readDirectory(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((dir) => dir.name)
    )
    .flat();
}

const packageDirNames = getScopes(["./packages", "./apps"]);
const scopes = DEFAULT_SCOPES.concat(packageDirNames);

module.exports = {
  extends: ["@commitlint/config-conventional", "monorepo"],
  rules: {
    "scope-enum": [2, "always", scopes],
  },
};
