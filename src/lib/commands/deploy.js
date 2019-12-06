let migrate = require("./migrate");

let command = {
  command: "deploy",
  description: "(alias for migrate)",
  builder: migrate.builder,
  run: migrate.run
};

module.exports = command;
