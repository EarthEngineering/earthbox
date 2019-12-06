require("source-map-support/register");

// let Config = require("./components/Config");
let Command = require("./lib/command");
let TaskError = require("./lib/errors/taskerror");
let TruffleError = require("@truffle/error");
let version = require("./lib/version");
let OS = require("os");
let downloader = require("./downloader");

let command = new Command(require("./lib/commands"));

let options = {
  logger: console
};

let commands = process.argv.slice(2);

if (commands[0] === "--download-compiler" && commands[1]) {
  downloader(commands[1]);
} else {
  let command = new Command(require("./lib/commands"));

  let options = {
    logger: console
  };

  command.run(process.argv.slice(2), options, function(err) {
    if (err) {
      if (err instanceof TaskError) {
        command.args
          .usage(
            "Earthbox v" +
              (version.bundle || version.core) +
              " - a development framework for earthweb" +
              OS.EOL +
              OS.EOL +
              "Usage: earthbox <command> [options]"
          )
          .epilog("See more at https://www.earth.engineering")
          .showHelp();
      } else {
        if (err instanceof TruffleError) {
          console.log(err.message);
        } else if (typeof err == "number") {
          // If a number is returned, exit with that number.
          process.exit(err);
        } else {
          // Bubble up all other unexpected errors.
          console.log(err.stack || err.toString());
        }
      }
      process.exit(1);
    }

    // Don't exit if no error; if something is keeping the process open,
    // like `earthbox console`, then let it.

    // Clear any polling or open sockets - `provider-engine` in HDWallet
    // and `web3 1.0 confirmations` both leave interval timers etc wide open.
    const handles = process._getActiveHandles();
    handles.forEach(handle => {
      if (typeof handle.close === "function") {
        handle.close();
      }
    });
  });
}
