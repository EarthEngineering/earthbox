let command = {
  command: "create",
  description: "Helper to create new contracts, migrations and tests",
  builder: {
    all: {
      type: "boolean",
      default: false
    },
    force: {
      type: "boolean",
      default: false
    }
  },
  run: function(options, done) {
    process.env.CURRENT = "create";
    let Config = require("../../components/Config");
    let ConfigurationError = require("../errors/configurationerror");
    let create = require("../create");

    let config = Config.detect(options);

    let type = config.type;

    if (type == null && config._.length > 0) {
      type = config._[0];
    }

    let name = config.name;

    if (name == null && config._.length > 1) {
      name = config._[1];
    }

    if (type == null) {
      return done(
        new ConfigurationError(
          "Please specify the type of item to create. Example: earthbox create contract MyContract"
        )
      );
    }

    if (name == null) {
      return done(
        new ConfigurationError(
          "Please specify the name of item to create. Example: earthbox create contract MyContract"
        )
      );
    }

    if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name)) {
      return done(
        new ConfigurationError(
          "The name " +
            name +
            " is invalid. Please enter a valid name using alpha-numeric characters."
        )
      );
    }

    let fn = create[type];

    if (fn == null)
      return done(new ConfigurationError("Cannot find creation type: " + type));

    let destinations = {
      contract: config.contracts_directory,
      migration: config.migrations_directory,
      test: config.test_directory
    };

    create[type](destinations[type], name, options, done);
  }
};

module.exports = command;
