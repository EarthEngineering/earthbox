let command = {
  command: "build",
  description: "Execute build pipeline (if configuration present)",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "build";
    let Config = require("../../components/Config");
    let Build = require("../build");

    let config = Config.detect(options);
    Build.build(config, done);
  }
};

module.exports = command;
