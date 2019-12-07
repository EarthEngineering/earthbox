let command = {
  command: "watch",
  description:
    "Watch filesystem for changes and rebuild the project automatically",
  builder: {},
  run: function(options, done) {
    process.env.CURRENT = "watch";
    let Build = require("../build");
    let Config = require("../../components/Config");
    let chokidar = require("chokidar");
    let path = require("path");
    let colors = require("colors");
    let Contracts = require("../../components/WorkflowCompile");
    let TruffleError = require("@truffle/error");

    let config = Config.detect(options);

    let printSuccess = function() {
      config.logger.log(
        colors.green("Completed without errors on " + new Date().toString())
      );
    };

    let printFailure = function(err) {
      if (err instanceof TruffleError) {
        console.log(err.message);
      } else {
        // Bubble up all other unexpected errors.
        console.log(err.stack || err.toString());
      }
    };

    let working = false;
    let needs_rebuild = true;
    let needs_recompile = true;

    let watchPaths = [
      path.join(config.working_directory, "app/**/*"),
      path.join(config.contracts_build_directory, "/**/*"),
      path.join(config.contracts_directory, "/**/*"),
      path.join(config.working_directory, "earthcli-config.js"),
      path.join(config.working_directory, "earthcli.js")
    ];

    chokidar
      .watch(watchPaths, {
        ignored: /[\/\\]\./, // Ignore files prefixed with "."
        cwd: config.working_directory,
        ignoreInitial: true
      })
      .on("all", function(event, filePath) {
        // On changed/added/deleted
        let display_path = path.join(
          "./",
          filePath.replace(config.working_directory, "")
        );
        config.logger.log(colors.cyan(">> File " + display_path + " changed."));

        needs_rebuild = true;

        if (
          path
            .join(config.working_directory, filePath)
            .indexOf(config.contracts_directory) >= 0
        ) {
          needs_recompile = true;
        }
      });

    let check_rebuild = function() {
      if (working) {
        setTimeout(check_rebuild, 200);
        return;
      }

      if (needs_rebuild == true) {
        needs_rebuild = false;

        if (config.build != null) {
          config.logger.log("Rebuilding...");
          working = true;

          Build.build(config, function(err) {
            if (err) {
              printFailure(err);
            } else {
              printSuccess();
            }
            working = false;
          });
        }
      } else if (needs_recompile == true) {
        needs_recompile = false;
        working = true;

        Contracts.compile(config, function(err) {
          if (err) {
            printFailure(err);
          }
          working = false;
        });
      }

      setTimeout(check_rebuild, 200);
    };

    check_rebuild();
  }
};

module.exports = command;
