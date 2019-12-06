#!/usr/bin/env node
let path = require("path");
let spawn = require("child_process").spawn;

let cli_path = path.resolve(path.join(__dirname, "./index.js"));

let args = [cli_path, "exec"];

Array.prototype.push.apply(args, process.argv.slice(2));

let cmd = spawn("node", args);

cmd.stdout.on("data", data => {
  console.log(data.toString());
});

cmd.stderr.on("data", data => {
  console.error(data.toString());
});

cmd.on("close", code => {
  process.exit(code);
});

cmd.on("error", function(err) {
  throw err;
});
