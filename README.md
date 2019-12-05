# EARTHBox

Simple development framework for tronweb  
**EARTHBox is a fork of [Truffle](https://www.trufflesuite.com/truffle) [code](https://github.com/trufflesuite/truffle)**

[EARTHBox Documentation](https://www.earth.engineering)

## Installation

`npm install -g EARTHBox`

## OS requirement

- NodeJS 8.0+
- Windows, Linux, or Mac OS X

## Features

Initialize a Customer Tron-Box Project<br>
`EARTHBox init`
<br>

Download a dApp, ex: metacoin-box<br>
`EARTHBox unbox metacoin`
<br>

Contract Compiler<br>
`EARTHBox compile`

<br>
To compile for all contracts, select --compile-all.

Optionally, you can select: <br>
--compile-all: Force compile all contracts. <br>
--network save results to a specific host network<br>
<br>

## Configuration

To use EARTHBox, your dApp has to have a file `EARTHBox.js` in the source root. This special files, tells EARTHBox how to connect to nodes and event server, and passes some special parameters, like the default private key. This is an example of `EARTHBox.js`:

```
module.exports = {
  networks: {
    development: {
// For trontools/quickstart docker image
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
      fullNode: "https://api.trongrid.io",
      solidityNode: "https://api.trongrid.io",
      eventServer: "https://api.trongrid.io",
      network_id: "*"
    }
  }
};
```

Starting from EARTHBox 2.1.9, if you are connecting to the same host for full and solidity nodes, and event server, you can set just `fullHost`:

```
module.exports = {
  networks: {
    development: {
// For trontools/quickstart docker image
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
      fullHost: "https://api.trongrid.io",
      network_id: "*"
    }
  }
};
```

Notice that the example above uses Tron Quickstart >= 1.1.16, which exposes a mononode on port 9090.

## Contract Migration<br>

`EARTHBox migrate`
<br>

This command will invoke all migration scripts within the migrations directory. If your previous migration was successful, `EARTHBox migrate` will invoke a newly created migration. If there is no new migration script, this command will have no operational effect. Instead, you can use the option `--reset` to restart the migration script.<br>

`EARTHBox migrate --reset`
<br>

## Parameters by contract (introduced in v2.2.2)

It is very important to set the deploying parameters for any contract. In EARTHBox 2.2.2+ you can do it modifying the file

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

## Start Console<br>

This will use the default network to start a console. It will automatically connect to a TVM client. You can use `--network` to change this. <br>

`EARTHBox console`<br>

The console supports the `EARTHBox` command. For example, you can invoke `migrate --reset` in the console. The result is the same as invoking `EARTHBox migrate --reset` in the command.
<br>

## Extra Features in EARTHBox console:<br>

1. All the compiled contracts can be used, just like in development & test, front-end code, or during script migration. <br>

2. After each command, your contract will be re-loaded. After invoking the `migrate --reset` command, you can immediately use the new address and binary.<br>

3. Every returned command's promise will automatically be logged. There is no need to use `then()`, which simplifies the command.<br>

## Testing<br>

To carry out the test, run the following command:<br>

`EARTHBox test`<br>

You can also run the test for a specific file：<br>

`EARTHBox test ./path/to/test/file.js`<br>

Testing in EARTHBox is a bit different than in Truffle.
Let's say we want to test the contract Metacoin (from the Metacoin Box that you can download with `EARTHBox unbox metacoin`):

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

Now, take a look at the first test in `test/metacoin.js`:

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

Starting from version 2.0.5, in EARTHBox artifacts () the following commands are equivalent:

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
git clone --recurse-submodules -j8 git@github.com:sullof/EARTHBox.git
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

5. During the development, for better debugging, you can run the unbuilt version of EARTHBox, for example

```
./EARTHBox.dev migrate --reset
```

## Solc versions

EARTHBox does not supports all the Solidity compilers.  
Supported versions:

```
0.4.24
0.4.25
0.5.4
0.5.8
0.5.9
```

## Latest version is 2.3.16

## Recent history (selected)

**3.0.0**

- Full refactoring
- Add support for Solidity compiler 0.5.9

**2.5.2**

- Fix bug in compiler wrapper calls

**2.5.0**

- Add support for JavaTron 3.6 and Solidity compiler for `^0.5.4`
- Fix vulnerability with (unused) `web3` and `diff` packages

**2.3.16**

- Updates TronWeb to version 2.3.2

**2.3.16**

- Updates TronWeb to version 2.3.2

**2.3.15**

- Updates TronWeb to latest version which fixes issues with watch

**2.3.1**

- Adds temporary logo.
- Fix contract name during deployment

**2.3.0**

- When a smart contract deploy fails, the error shows the url to get info about the failed transaction.

**2.2.3**

- Resolve appended process after migrating.
- Add better error messaging.
- Fix issue with invalid origin_energy_limit.

**2.2.2**

- Add parameter configuration by smart contract.

**2.2.1**

- Add compatibility with JavaTron 3.2.

---

For more historic data, check the original repo at
[https://github.com/tronprotocol/tron-box](https://github.com/tronprotocol/tron-box)
