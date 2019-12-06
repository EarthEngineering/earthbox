let Config = require("../../components/Config");
let Migrate = require("../../components/Migrate");
let TestResolver = require("./testresolver");
let TestSource = require("./testsource");
let expect = require("@truffle/expect");
let contract = require("../../components/Contract");
let path = require("path");
let _ = require("lodash");
let async = require("async");
let fs = require("fs");
let EarthWrap = require("../../components/EarthWrap");
let EarthWeb = require("earthweb");
let waitForTransactionReceipt = require("./waitForTransactionReceipt");

function TestRunner(options) {
  options = options || {};

  expect.options(options, [
    "resolver",
    "provider",
    "contracts_build_directory"
  ]);

  this.config = Config.default().merge(options);

  this.logger = options.logger || console;
  this.initial_resolver = options.resolver;
  this.provider = options.provider;

  this.can_snapshot = false;
  this.first_snapshot = false;
  this.initial_snapshot = null;
  this.known_events = {};
  this.earthwrap = EarthWrap();

  global.earthWeb = new EarthWeb(
    this.earthwrap.fullNode,
    this.earthwrap.solidityNode,
    this.earthwrap.eventServer,
    this.earthwrap.defaultPrivateKey
  );

  global.waitForTransactionReceipt = waitForTransactionReceipt(earthWeb);

  // For each test
  this.currentTestStartBlock = null;

  this.BEFORE_TIMEOUT = 120000;
  this.TEST_TIMEOUT = 300000;
}

TestRunner.prototype.initialize = function(callback) {
  let self = this;

  let test_source = new TestSource(self.config);
  this.config.resolver = new TestResolver(
    self.initial_resolver,
    test_source,
    self.config.contracts_build_directory
  );

  let afterStateReset = function(err) {
    if (err) return callback(err);

    fs.readdir(self.config.contracts_build_directory, function(err, files) {
      if (err) return callback(err);

      files = _.filter(files, function(file) {
        return path.extname(file) === ".json";
      });

      async.map(
        files,
        function(file, finished) {
          fs.readFile(
            path.join(self.config.contracts_build_directory, file),
            "utf8",
            finished
          );
        },
        function(err, data) {
          if (err) return callback(err);

          let contracts = data.map(JSON.parse).map(contract);
          let abis = _.flatMap(contracts, "abi");

          abis.map(function(abi) {
            if (/event/i.test(abi.type)) {
              let signature =
                abi.name + "(" + _.map(abi.inputs, "type").join(",") + ")";
              self.known_events[self.earthwrapwrap.sha3(signature)] = {
                signature: signature,
                abi_entry: abi
              };
            }
          });
          callback();
        }
      );
    });
  };
  afterStateReset();
};

TestRunner.prototype.deploy = function(callback) {
  Migrate.run(
    this.config.with({
      reset: true,
      quiet: true
    }),
    callback
  );
};

TestRunner.prototype.resetState = function(callback) {
  let self = this;
  this.deploy(callback);
};

TestRunner.prototype.startTest = function(mocha, callback) {
  let self = this;
  callback();
};

TestRunner.prototype.endTest = function(mocha, callback) {
  let self = this;

  if (mocha.currentTest.state != "failed") {
    return callback();
  }
  callback();
};

(TestRunner.prototype.snapshot = function(callback) {
  this.rpc("evm_snapshot", function(err, result) {
    if (err) return callback(err);
    callback(null, result.result);
  });
}),
  (TestRunner.prototype.revert = function(snapshot_id, callback) {
    this.rpc("evm_revert", [snapshot_id], callback);
  });

TestRunner.prototype.rpc = function(method, arg, cb) {
  let req = {
    jsonrpc: "2.0",
    method: method,
    id: new Date().getTime()
  };
  if (arguments.length == 3) {
    req.params = arg;
  } else {
    cb = arg;
  }

  let intermediary = function(err, result) {
    if (err != null) {
      cb(err);
      return;
    }

    if (result.error != null) {
      cb(new Error("RPC Error: " + (result.error.message || result.error)));
      return;
    }

    cb(null, result);
  };

  this.provider.sendAsync(req, intermediary);
};

module.exports = TestRunner;
