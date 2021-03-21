# pownft-miner

This is a typescript miner for the POWNFT smart contract.  It uses multiple cores (configurable),
and has more efficient hashing code than the website (at time of writing).  On a mid-grade laptop running ubuntu, I'm able to
get > 200k hashes/sec using 4 cores.

_DISCLAIMER: This miner will automatically submit an ethereum transaction when an atom is found, which requires access to a private key (seed phrase) stored in plain text.  This is bad, you should never do this.  You will loose all your funds and atoms if you are not careful.  Please delete the config file or clear the seed phrase from it when you are done using this.  USE THIS AT YOUR OWN RISK!_

## Requirements
- Node 12

## Config

The miner will automatically search for atoms and submit a transaction.  To do this, you need a few things:
1. A mainnet json rpc url.  Infura or Alchemy provide free ones.
2. A fresh eth account to use this on.  DO NOT USE an account with substantial funds, setup a new one with just enough to
test this out.

The miner expects a file named `config.json` in the root directory.  You must create this, it should look like:

```json
{
    "provider": "https://eth-mainnet.alchemyapi.io/v2/<your-key>",
    "mnemonic": "some seed phrase",
    "index": 0,
    "numCores": 4,
    "gasLimit": 200,
    "chunkSize": 400000,
    "dryRun": false
}
```

Where:
- `povider`: your json rpc url
- `mnemonic`: the 12 word seed phrase of the new account (if you created with metamask)
- `index`: the index in the account (0 is the first account, 1 the second, ...).  Leave as 0 unless you know what you're doing.
- `numCores`: is the number of worker threads to use to mine hashes.  Use 50-80% of the cores on your machine (4-6 on an 8 core machine).
- `gasLimit`: the max gas price you're willing to pay.  Above this, even if you find an atom, the transaction will not be sumitted.
- `chunkSize`: number of nonces per "chunk" -- 400000 is a good value on my machine.  Tweak this if your loops are too slow (> 10s) or too fast (< 5s), it will likely vary by machine.
- `dryRun`: true/false, whether or not to actually issue transactions.  Set this to `true` while testing this out.

## Usage

```sh
$ git clone <this repo>
$ yarn install
$ cp config.sample.json config.json
$ # edit config.json with your desired config
$ yarn miner
```

