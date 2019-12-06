let command = {
  command: "serve",
  description: "Serve the build directory on localhost and watch for changes",
  builder: {
    port: {
      alias: "p",
      default: "8080"
    }
  },
  run: function(options, done) {
    process.env.CURRENT = "serve";
    let Serve = require("../serve");
    let Config = require("../../components/Config");
    let watch = require("./watch");

    let config = Config.detect(options);
    Serve.start(config, function() {
      watch.run(options, done);
    });
  }
};

module.exports = command;
