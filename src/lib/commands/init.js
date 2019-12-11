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
      config.logger.log("Error: `earthcli init` doesn't accept any arguments.");
      config.logger.log();
      config.logger.log(
        "To unbox browse the earthcli boxes at <https://www.earth.engineering/boxes>!"
      );
      process.exit(1);
    }

    // defer to `earthcli unbox` command with "bare" box as arg
    var url = "https://github.com/earthengineering/bare-box.git";
    options._ = [url];

    UnboxCommand.run(options, done);
  }
};

module.exports = command;
