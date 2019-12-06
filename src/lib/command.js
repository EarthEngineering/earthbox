let TaskError = require("./errors/taskerror");
let yargs = require("yargs/yargs");
let _ = require("lodash");

function Command(commands) {
  this.commands = commands;

  let args = yargs();

  Object.keys(this.commands).forEach(function(command) {
    args = args.command(commands[command]);
  });

  this.args = args;
}

Command.prototype.getCommand = function(str, noAliases) {
  let argv = this.args.parse(str);

  if (argv._.length == 0) {
    return null;
  }

  let input = argv._[0];
  let chosenCommand = null;

  // If the command wasn't specified directly, go through a process
  // for inferring the command.
  if (this.commands[input]) {
    chosenCommand = input;
  } else if (noAliases !== true) {
    let currentLength = 1;
    let availableCommandNames = Object.keys(this.commands);

    // Loop through each letter of the input until we find a command
    // that uniquely matches.
    while (currentLength <= input.length) {
      // Gather all possible commands that match with the current length
      let possibleCommands = availableCommandNames.filter(function(
        possibleCommand
      ) {
        return (
          possibleCommand.substring(0, currentLength) ==
          input.substring(0, currentLength)
        );
      });

      // Did we find only one command that matches? If so, use that one.
      if (possibleCommands.length == 1) {
        chosenCommand = possibleCommands[0];
        break;
      }

      currentLength += 1;
    }
  }

  if (chosenCommand == null) {
    return null;
  }

  let command = this.commands[chosenCommand];

  return {
    name: chosenCommand,
    argv: argv,
    command: command
  };
};

Command.prototype.run = function(command, options, callback) {
  if (typeof options == "function") {
    callback = options;
    options = {};
  }

  let result = this.getCommand(
    command,
    typeof options.noAliases === "boolean" ? options.noAliases : true
  );

  if (result == null) {
    return callback(new TaskError("Cannot find command: " + command));
  }

  let argv = result.argv;

  // Remove the task name itself.
  if (argv._) {
    argv._.shift();
  }

  // We don't need this.
  delete argv["$0"];

  // Some options might throw if options is a Config object. If so, let's ignore those options.
  let clone = {};
  Object.keys(options).forEach(function(key) {
    try {
      clone[key] = options[key];
    } catch (e) {
      // Do nothing with values that throw.
    }
  });

  options = _.extend(clone, argv);

  try {
    result.command.run(options, callback);
  } catch (err) {
    callback(err);
  }
};

module.exports = Command;
