let command = {
  command: "compile",
  description: "Compile contract source files",
  builder: {
    all: {
      type: "boolean",
      default: false
    }
  },
  run: function(options, done) {
    process.env.CURRENT = "compile";
    let Config = require("../../components/Config");
    let Contracts = require("../../components/WorkflowCompile");

    let config = Config.detect(options);
    Contracts.compile(config, done);
  }
};

module.exports = command;
