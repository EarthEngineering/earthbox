var path = require("path");
var fs = require("fs-extra");
var homedir = require("homedir");
var req = require("superagent");

async function downloader(compilerVersion) {
  let dir = path.join(homedir(), ".earthbox", "solc");
  let soljsonPath = path.join(dir, `soljson_v${compilerVersion}.js`);

  await fs.ensureDir(path.join(dir));

  let res = await req
    .get(
      `https://github.com/EarthEngineering/earth-solc-bin/blob/master/bin/${compilerVersion}.js`
    )
    .responseType("blob");

  if (res && res.body) {
    await fs.writeFile(soljsonPath, res.body);
  } else {
    console.log("Error. Wrong Solidity compiler version.");
  }
  process.exit();
}

module.exports = downloader;
