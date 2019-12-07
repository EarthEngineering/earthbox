const command = {
  command: "init",
  description: "Initialize new and empty tronBox project",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "init";
    const Config = require("../../components/Config");
    const OS = require("os");
    const UnboxCommand = require("./unbox");

    const config = Config.default().with({
      logger: console
    });

    if (options._ && options._.length > 0) {
      config.logger.log(
        "Error: `earthbox init` no longer accepts a project template name as an argument."
      );
      config.logger.log();
      config.logger.log(
        " - For an empty project, use `earthbox init` with no arguments" +
          OS.EOL +
          " - Or, browse the earthbox Boxes at <http://www.earth.engineering>!"
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    const url = "https://github.com/earthengineering/bare-box.git";
    options._ = [url];

    UnboxCommand.run(options, done);
  }
};

module.exports = command;
