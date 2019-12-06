let TruffleError = require("@truffle/error");
let inherits = require("util").inherits;

inherits(TaskError, TruffleError);

function TaskError(message) {
  TaskError.super_.call(this, message);
}

module.exports = TaskError;
