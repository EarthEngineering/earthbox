let TruffleError = require("@truffle/error");
let expect = require("@truffle/expect");
let Resolver = require("../components/Resolver");
let Artifactor = require("../components/Artifactor");
// let TestRPC = require("ganache-cli");
let spawn = require("child_process").spawn;
let path = require("path");
let EarthWrap = require("../components/EarthWrap");

let Environment = {
  // It's important config is a Config object and not a vanilla object
  detect: function(config, callback) {
    expect.options(config, ["networks"]);

    if (!config.resolver) {
      config.resolver = new Resolver(config);
    }

    if (!config.artifactor) {
      config.artifactor = new Artifactor(config.contracts_build_directory);
    }

    if (!config.network && config.networks["development"]) {
      config.network = "development";
    }

    if (!config.network) {
      return callback(
        new Error("No network specified. Cannot determine current network.")
      );
    }
    let network_config = config.networks[config.network];

    if (!network_config) {
      return callback(
        new TruffleError(
          'Unknown network "' +
            config.network +
            '". See your earthcli configuration file for available networks.'
        )
      );
    }

    let network_id = config.networks[config.network].network_id;

    if (network_id == null) {
      return callback(
        new Error(
          "You must specify a network_id in your '" +
            config.network +
            "' configuration in order to use this network."
        )
      );
    }

    let earthWrap = EarthWrap();

    function detectNetworkId(done) {
      if (network_id != "*") {
        return done(null, network_id);
      }
      network_id = "*";
      config.networks[config.network].network_id = network_id;
      done(null, network_id);
    }

    function detectFromAddress(done) {
      if (config.from) {
        return done();
      }

      earthWrap._getAccounts(function(err, accounts) {
        if (err) return done(err);
        config.networks[config.network].from = accounts[0];
        config.networks[config.network].privateKey =
          earthWrap._privateKeyByAccount[accounts[0]];
        done();
      });
    }

    detectNetworkId(function(err) {
      if (err) return callback(err);
      detectFromAddress(callback);
    });
  },

  // Ensure you call Environment.detect() first.
  fork: function(config, callback) {
    expect.options(config, ["from"]);

    let upstreamNetwork = config.network;
    let upstreamConfig = config.networks[upstreamNetwork];
    let forkedNetwork = config.network + "-fork";

    config.networks[forkedNetwork] = {
      network_id: config.network_id,
      provider: undefined,
      //   TestRPC.provider({
      //   fork: config.provider,
      //   unlocked_accounts: [config.networks[config.network].from]
      // }),
      from: config.from
    };
    config.network = forkedNetwork;

    callback();
  },

  develop: function(config, testrpcOptions, callback) {
    let self = this;

    expect.options(config, ["networks"]);

    let network = config.network || "develop";
    let url = `http://${testrpcOptions.host}:${testrpcOptions.port}/`;

    config.networks[network] = {
      network_id: testrpcOptions.network_id,
      provider: ""
    };

    config.network = network;

    Environment.detect(config, callback);
  }
};

module.exports = Environment;
