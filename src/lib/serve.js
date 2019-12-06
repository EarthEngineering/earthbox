let http = require("http");
let finalhandler = require("finalhandler");
let serveStatic = require("serve-static");
let path = require("path");

let Serve = {
  start: function(options, done) {
    let serve = serveStatic(options.build_directory);

    let server = http.createServer(function(req, res) {
      let done = finalhandler(req, res);
      serve(req, res, done);
    });

    let port = options.port || options.p || 8080;

    server.listen(port);

    let display_directory =
      "." +
      path.sep +
      path.relative(options.working_directory, options.build_directory);

    options.logger.log(
      "Serving static assets in " +
        display_directory +
        " on port " +
        port +
        "..."
    );
    done();
  }
};

module.exports = Serve;
