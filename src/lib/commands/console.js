let command = {
  command: "console",
  description:
    "Run a console with contract abstractions and commands available",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "console";
    let Config = require("../../components/Config");
    let Console = require("../console");
    let Environment = require("../environment");
    // let TruffleError = require("@truffle/error");

    let EarthWrap = require("../../components/EarthWrap");
    const logErrorAndExit = require("../../components/EarthWrap")
      .logErrorAndExit;

    let config = Config.detect(options);

    if (!config.network && config.networks.development) {
      config.network = "development";
    }
    // init EarthWeb
    try {
      EarthWrap(config.networks[config.network], {
        verify: true,
        log: options.log
      });
    } catch (err) {
      logErrorAndExit(console, err.message);
    }

    // This require a smell?
    let commands = require("./index");
    let excluded = ["console", "init", "watch", "serve"];

    let available_commands = Object.keys(commands).filter(function(name) {
      return excluded.indexOf(name) == -1;
    });

    let console_commands = {};
    available_commands.forEach(function(name) {
      console_commands[name] = commands[name];
    });

    Environment.detect(config, function(err) {
      if (err) return done(err);

      let c = new Console(
        console_commands,
        config.with({
          noAliases: true
        })
      );
      c.start(done);
    });
  }
};

module.exports = command;
