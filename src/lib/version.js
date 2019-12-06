// let pkg = require("../../package.json");
// let solcpkg = require("earth-solc/package.json");

let bundle = require("../../package.json");

module.exports = {
  // src: pkg.version,
  bundle: bundle.version
  // solc: solcpkg.version
};
