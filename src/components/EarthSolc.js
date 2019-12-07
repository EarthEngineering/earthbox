const wrapper = require("solc/wrapper");
let { name } = require("../../package");
const path = require("path");
const fs = require("fs-extra");
const homedir = require("homedir");
const { execSync } = require("child_process");

const supportedVersions = ["0.4.24", "0.4.25", "0.5.4", "0.5.8"];

function getWrapper(options = {}) {
  try {
    const params = options.networkInfo.parameters;
    for (const p of params) {
      if (p.key === "getAllowTvmSolidity059") {
        if (p.value) {
          supportedVersions.push("0.5.9");
          break;
        }
      }
    }
  } catch (e) {}

  let compilerVersion = "0.5.4";
  const solcDir = path.join(homedir(), ".earthcli", "solc");

  if (options.networks) {
    if (options.networks.useZeroFourCompiler) {
      compilerVersion = "0.4.25";
    } else if (options.networks.useZeroFiveCompiler) {
      compilerVersion = "0.5.4";
    }

    try {
      const version = options.networks.compilers.solc.version;
      if (supportedVersions.includes(version)) {
        compilerVersion = version;
      } else {
        console.error(`Error:
EarthCli supports only the following versions:
${supportedVersions.join(" - ")}
`);
        // process.exit();
      }
    } catch (e) {}
  }

  const soljsonPath = path.join(solcDir, `soljson_v${compilerVersion}.js`);

  console.log(soljsonPath);
  if (!fs.existsSync(soljsonPath)) {
    console.log("FOOOOO", process.env);
    if (process.env.EARTHCLI_NAME) {
      console.log("FOOOOO");
      name = process.env.EARTHCLI_NAME;
    }
    execSync(`${name} --download-compiler ${compilerVersion}`).toString();
  }
  const soljson = eval("require")(soljsonPath);
  return wrapper(soljson);
}

module.exports.getWrapper = getWrapper;
module.exports.supportedVersions = supportedVersions;
