var command = {
  command: "migrate",
  description: "Run migrations to deploy contracts",
  builder: {
    reset: {
      type: "boolean",
      default: false
    },
    "compile-all": {
      describe: "recompile all contracts",
      type: "boolean",
      default: false
    },
    // "dry-run": {
    //   describe: "Run migrations against an in-memory fork, for testing",
    //   type: "boolean",
    //   default: false
    // },
    f: {
      describe: "Specify a migration number to run from",
      type: "number"
    }
  },
  run: function(options, done) {
    process.env.CURRENT = "migrate";
    var OS = require("os");
    var Config = require("../../components/Config");
    var Contracts = require("../../components/WorkflowCompile");
    var Resolver = require("../../components/Resolver");
    var Artifactor = require("../../components/Artifactor");
    var Migrate = require("../../components/Migrate");
    var Environment = require("../environment");
    var temp = require("temp");
    var copy = require("../copy");
    var EarthWrap = require("../../components/EarthWrap");
    var { dlog } = require("../../components/EarthWrap");
    const logErrorAndExit = require("../../components/EarthWrap")
      .logErrorAndExit;

    var config = Config.detect(options);

    // if "development" exists, default to using that
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

    function runMigrations(callback) {
      if (options.f) {
        Migrate.runFrom(options.f, config, done);
      } else {
        Migrate.needsMigrating(config, function(err, needsMigrating) {
          if (err) return callback(err);

          if (needsMigrating) {
            dlog("Starting migration");
            Migrate.run(config, done);
          } else {
            config.logger.log("Network up to date.");
            callback();
          }
        });
      }
    }

    Contracts.compile(config, function(err) {
      if (err) return done(err);
      Environment.detect(config, function(err) {
        if (err) return done(err);
        var dryRun = options.dryRun === true;

        var networkMessage = "Using network '" + config.network + "'";

        if (dryRun) {
          networkMessage += " (dry run)";
        }

        config.logger.log(networkMessage + "." + OS.EOL);

        console.log("HHHHHEEEEERRRREEEEE");
        runMigrations(done);
      });
    });
  }
};

module.exports = command;
