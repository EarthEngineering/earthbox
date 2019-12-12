# EarthCli

Development framework for [EARTH](https://www.earth.engineering). Everything needed to write, compile and deploy smart contracts and tokens. Also includes network management, a full testing framework, configurable build & asset pipeline and more.

## Installation

`npm install earthcli -g`

## OS requirement

- NodeJS 8.0+
- Windows, Linux, or Mac OS X

## Features

Initialize a Customer EarthCli Project
`earthcli init`

Download a dApp, ex: coin-box
`earthcli unbox coin-box`

Contract Compiler
`earthcli compile`

To compile for all contracts, select --compile-all.

Optionally, you can select:
--compile-all: Force compile all contracts.
--network save results to a specific host network

## Configuration

To use EarthCli, your dApp has to have a file `earthcli.js` in the source root. This special files, tells EarthCli how to connect to nodes and event server, and passes some special parameters, like the default private key. This is an example of `earthcli.js`:

```
module.exports = {
  networks: {
    development: {
// For earthengineering/quickstart docker image
      privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      userFeePercentage: 30, // or consume_user_resource_percent
      feeLimit: 100000000, // or fee_limit
      originEnergyLimit: 1e8, // or origin_energy_limit
      callValue: 0, // or call_value
      fullNode: "http://127.0.0.1:8090",
      solidityNode: "http://127.0.0.1:8091",
      eventServer: "http://127.0.0.1:8092",
      network_id: "*"
    },
    mainnet: {
// Don't put your private key here, pass it using an env variable, like:
// PK=da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0 EARTHBox migrate --network mainnet
      privateKey: process.env.PK,
      userFeePercentage: 30,
      feeLimit: 100000000,
      fullNode: "https://www.earth.engineering",
      solidityNode: "https://www.earth.engineering",
      eventServer: "https://www.earth.engineering",
      network_id: "*"
    }
  }
};
```

Starting from EarthCli 2.1.9, if you are connecting to the same host for full and solidity nodes, and event server, you can set just `fullHost`:

```
module.exports = {
  networks: {
    development: {
// For earthtools/quickstart docker image
      privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      userFeePercentage: 30,
      feeLimit: 100000000,
      fullHost: "http://127.0.0.1:9090",
      network_id: "*"
    },
    mainnet: {
// Don't put your private key here, pass it using an env variable, like:
// PK=da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0 EARTHBox migrate --network mainnet
      privateKey: process.env.PK,
      userFeePercentage: 30,
      feeLimit: 100000000,
      fullHost: "https://www.earth.engineering",
      network_id: "*"
    }
  }
};
```

Notice that the example above uses Earth Quickstart >= 1.1.16, which exposes a mononode on port 9090.

**IMPORTANT**

Make sure to copy `soljson_v0.5.4.js` to `~/.earthcli/solc`

```bash
cd ~/.earthcli/solc
wget https://raw.githubusercontent.com/EarthEngineering/earth-solc-bin/master/bin/soljson_v0.5.4.js
```

## Contract Migration

`earthcli migrate`

This command will invoke all migration scripts within the migrations directory. If your previous migration was successful, `earthcli migrate` will invoke a newly created migration. If there is no new migration script, this command will have no operational effect. Instead, you can use the option `--reset` to restart the migration script.

`earthcli migrate --reset`

## Parameters by contract

It is very important to set the deploying parameters for any contract.

```
migrations/2_deploy_contracts.js
```

and specifying the parameters you need like in the following example:

```
var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin, 10000, {
    fee_limit: 1.1e8,
    userFeePercentage: 31,
    originEnergyLimit: 1.1e8
  });
};
```

## Start Console

This will use the default network to start a console. It will automatically connect to a TVM client. You can use `--network` to change this.

`earthcli console`

The console supports the `earthcli` command. For example, you can invoke `migrate --reset` in the console. The result is the same as invoking `earthcli migrate --reset` in the command.

## Extra Features in EarthCli console:

1. All the compiled contracts can be used, just like in development & test, front-end code, or during script migration.

2. After each command, your contract will be re-loaded. After invoking the `migrate --reset` command, you can immediately use the new address and binary.

3. Every returned command's promise will automatically be logged. There is no need to use `then()`, which simplifies the command.

## Testing

To carry out the test, run the following command:

`earthcli test`

You can also run the test for a specific file：

`earthcli test ./path/to/test/file.js`

Testing in EarthCli is a bit different than in Truffle.
Let's say we want to test the contract Metacoin (from the Metacoin Box that you can download with `earthcli unbox coin-box`):

```
contract MetaCoin {
	mapping (address => uint) balances;

	event Transfer(address _from, address _to, uint256 _value);
	event Log(string s);

	constructor() public {
		balances[tx.origin] = 10000;
	}

	function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
		if (balances[msg.sender] < amount) return false;
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		emit Transfer(msg.sender, receiver, amount);
		return true;
	}

	function getBalanceInEth(address addr) public view returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
	}

	function getBalance(address addr) public view returns(uint) {
		return balances[addr];
	}
}
```

Now, take a look at the first test in `test/coin-box.js`:

```
var MetaCoin = artifacts.require("./MetaCoin.sol");
contract('MetaCoin', function(accounts) {
  it("should put 10000 MetaCoin in the first account", function() {

    return MetaCoin.deployed().then(function(instance) {
      return instance.call('getBalance',[accounts[0]]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10000, "10000 wasn't in the first account");
    });
  });
  // ...
```

The following commands are equivalent:

```
instance.call('getBalance', accounts[0]);
instance.getBalance(accounts[0]);
instance.getBalance.call(accounts[0]);
```

and you can pass the `address` and `amount` for the method in both the following ways:

```
instance.sendCoin(address, amount, {from: account[1]});
```

and

```
instance.sendCoin([address, amount], {from: account[1]});
```

## How to contribute

1. Fork this repo.

2. Clone your forked repo recursively, to include submodules, for example:

```
git clone --recurse-submodules -j8 git@github.com:earthengineering/earthcli.git
```

3. If you use nvm for Node, please install Node 8, and install lerna globally:

```
nvm install v8.16.0
nvm use v8.16.0
npm i -g lerna
```

4. Bootstrap the project:

```
lerna bootstrap
```

5. During the development, for better debugging, you can run the unbuilt version of EarthCli, for example

```
./earthcli.dev migrate --reset
```

## Solc versions

EarthCli does not supports all the Solidity compilers.  
Supported versions:

```
0.4.24
0.4.25
0.5.4
0.5.8
0.5.9
```
