let { supportedVersions } = require("../../components/EarthSolc");

let command = {
  command: "version",
  description: "Show version number and exit",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "version";
    let version = require("../version");

    let bundle_version;

    if (version.bundle) {
      bundle_version = "v" + version.bundle;
    } else {
      bundle_version = "(unbundled)";
    }

    options.logger.log("EarthCli " + bundle_version);
    options.logger.log(
      "Solidity v" +
        supportedVersions[supportedVersions.length - 1] +
        " (earth-solc)"
    );

    done();
  }
};

module.exports = command;
