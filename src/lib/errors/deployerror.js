let colors = require("colors");
let TruffleError = require("@truffle/error");
let inherits = require("util").inherits;

inherits(DeployError, TruffleError);

function DeployError(message, contract_name) {
  message =
    "Error deploying " +
    contract_name +
    ":\n\n" +
    message +
    "\n\n" +
    colors.red("Deploy failed. See above.");
  DeployError.super_.call(this, message);
}

module.exports = DeployError;
