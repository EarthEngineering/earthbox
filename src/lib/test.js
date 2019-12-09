let Mocha = require("mocha");
let chai = require("chai");
let path = require("path");
// let fs = require("fs");
let Config = require("../components/Config");
let Contracts = require("../components/WorkflowCompile");
let Resolver = require("../components/Resolver");
let TestRunner = require("./testing/testrunner");
let TestResolver = require("./testing/testresolver");
let TestSource = require("./testing/testsource");
// let SolidityTest = require("./testing/soliditytest");
let expect = require("@truffle/expect");
// let find_contracts = require("@truffle/contract-sources");
let Migrate = require("../components/Migrate");
let Profiler = require("../components/Compile/profiler");
// let async = require("async");
let originalrequire = require("original-require");
let EarthWrap = require("../components/EarthWrap");

chai.use(require("./assertions"));

let Test = {
  run: function(options, callback) {
    let self = this;

    expect.options(options, [
      "contracts_directory",
      "contracts_build_directory",
      "migrations_directory",
      "test_files",
      "network",
      "network_id",
      "provider"
    ]);

    let config = Config.default().merge(options);

    config.test_files = config.test_files.map(function(test_file) {
      return path.resolve(test_file);
    });

    // Output looks like this during tests: https://gist.github.com/tcoulter/1988349d1ec65ce6b958
    let warn = config.logger.warn;
    config.logger.warn = function(message) {
      if (message !== "cannot find event for log" && warn) {
        warn.apply(console, arguments);
      }
    };

    let mocha = this.createMocha(config);

    let js_tests = config.test_files.filter(function(file) {
      return path.extname(file) !== ".sol";
    });

    let sol_tests = config.test_files.filter(function(file) {
      return path.extname(file) === ".sol";
    });

    // Add Javascript tests because there's nothing we need to do with them.
    // Solidity tests will be handled later.
    js_tests.forEach(function(file) {
      // There's an idiosyncracy in Mocha where the same file can't be run twice
      // unless we delete the `require` cache.
      // https://github.com/mochajs/mocha/issues/995
      delete originalrequire.cache[file];

      mocha.addFile(file);
    });

    let dependency_paths = [];
    let testContracts = [];
    let accounts = [];
    let runner;
    let test_resolver;

    let earthWrap = EarthWrap();

    earthWrap
      ._getAccounts()
      .then(accs => {
        accounts = accs;

        if (!config.from) {
          config.from = accounts[0];
        }

        if (!config.resolver) {
          config.resolver = new Resolver(config);
        }

        let test_source = new TestSource(config);
        test_resolver = new TestResolver(
          config.resolver,
          test_source,
          config.contracts_build_directory
        );
        test_resolver.cache_on = false;

        return self.compileContractsWithTestFilesIfNeeded(
          sol_tests,
          config,
          test_resolver
        );
      })
      .then(function(paths) {
        dependency_paths = paths;

        testContracts = sol_tests.map(function(test_file_path) {
          let built_name = "./" + path.basename(test_file_path);
          return test_resolver.require(built_name);
        });

        runner = new TestRunner(config);

        console.log("Deploying contracts to development network...");
        return self.performInitialDeploy(config, test_resolver);
        // }).then(function () {
        //   return self.defineSolidityTests(mocha, testContracts, dependency_paths, runner);
        //   return Promise.resolve();
      })
      .then(function() {
        console.log("Preparing Javascript tests (if any)...");
        return self.setJSTestGlobals(accounts, test_resolver, runner);
      })
      .then(function() {
        // Finally, run mocha.
        process.on("unhandledRejection", function(reason, p) {
          throw reason;
        });

        mocha.run(function(failures) {
          config.logger.warn = warn;
          callback(failures);
        });
      })
      .catch(callback);
  },

  createMocha: function(config) {
    // Allow people to specify config.mocha in their config.
    let mochaConfig = config.mocha || {};

    // If the command line overrides color usage, use that.
    if (config.colors != null) {
      mochaConfig.useColors = config.colors;
    }

    // Default to true if configuration isn't set anywhere.
    if (mochaConfig.useColors == null) {
      mochaConfig.useColors = true;
    }

    let mocha = new Mocha(mochaConfig);

    return mocha;
  },
  compileContractsWithTestFilesIfNeeded: function(
    solidity_test_files,
    config,
    test_resolver
  ) {
    return new Promise(function(accept, reject) {
      Profiler.updated(
        config.with({
          resolver: test_resolver
        }),
        function(err, updated) {
          if (err) return reject(err);

          updated = updated || [];

          // Compile project contracts and test contracts
          Contracts.compile(
            config.with({
              all: config.compileAll === true,
              files: updated.concat(solidity_test_files),
              resolver: test_resolver,
              quiet: false,
              quietWrite: true
            }),
            function(err, abstractions, paths) {
              if (err) return reject(err);
              accept(paths);
            }
          );
        }
      );
    });
  },

  performInitialDeploy: function(config, resolver) {
    return new Promise(function(accept, reject) {
      Migrate.run(
        config.with({
          reset: true,
          resolver: resolver,
          quiet: true
        }),
        function(err) {
          if (err) return reject(err);
          accept();
        }
      );
    });
  },

  // defineSolidityTests: function (mocha, contracts, dependency_paths, runner) {
  //   return new Promise(function (accept) {
  //     contracts.forEach(function (contract) {
  //       SolidityTest.define(contract, dependency_paths, runner, mocha);
  //     });
  //
  //     accept();
  //   });
  // },

  setJSTestGlobals: function(accounts, test_resolver, runner) {
    return new Promise(function(accept, reject) {
      global.assert = chai.assert;
      global.expect = chai.expect;
      global.artifacts = {
        require: function(import_path) {
          return test_resolver.require(import_path);
        }
      };

      let template = function(tests) {
        this.timeout(runner.TEST_TIMEOUT);

        before("prepare suite", function(done) {
          this.timeout(runner.BEFORE_TIMEOUT);
          runner.initialize(done);
        });

        beforeEach("before test", function(done) {
          runner.startTest(this, done);
        });

        afterEach("after test", function(done) {
          runner.endTest(this, done);
        });

        tests(accounts);
      };

      global.contract = function(name, tests) {
        Mocha.describe("Contract: " + name, function() {
          template.bind(this, tests)();
        });
      };

      global.contract.only = function(name, tests) {
        Mocha.describe.only("Contract: " + name, function() {
          template.bind(this, tests)();
        });
      };

      global.contract.skip = function(name, tests) {
        Mocha.describe.skip("Contract: " + name, function() {
          template.bind(this, tests)();
        });
      };

      accept();
    });
  }
};

module.exports = Test;
