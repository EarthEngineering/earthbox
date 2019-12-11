var command = {
  command: "init",
  description: "Initialize new and empty earthcli project",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "init";
    var Config = require("../../components/Config");
    var OS = require("os");
    var UnboxCommand = require("./unbox");

    var config = Config.default().with({
      logger: console
    });

    if (options._ && options._.length > 0) {
      config.logger.log(
        "Error: `earthcli init` no longer accepts a project template name as an argument."
      );
      config.logger.log();
      config.logger.log(
        " - For an empty project, use `earthcli init` with no arguments" +
          OS.EOL +
          " - Or, browse the earthcli Boxes at <https://www.earth.engineering>!"
      );
      process.exit(1);
    }

    // defer to `earth unbox` command with "bare" box as arg
    var url = "https://github.com/earthengineering/bare-box.git";
    options._ = [url];

    UnboxCommand.run(options, done);
  }
};

module.exports = command;
