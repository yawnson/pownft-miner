# pownft-miner

This is a typescript miner for the POWNFT smart contract.  This uses multiple cores (number of cores is configurable),
and more efficient hashing code than the website (at time of writing).  On a linux laption running ubuntu, I'm able to
get > 200k hashes/sec.

_USE THIS AT YOUR OWN RISK!_

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
    "chunkSize": 400000
}
```

Where:
- `povider`: your json rpc url
- `mnemonic`: the 12 word seed phrase of the new account (if you created with metamask)
- `index`: the index in the account (0 is the first account, 1 the second, ...).  Leave as 0 unless you know what you're doing.
- `numCores`: is the number of worker threads to use to mine hashes.  Use 50-80% of the cores on your machine (4-6 on an 8 core machine).
- `gasLimit`: the max gas price you're willing to pay.  Above this, even if you find an atom, the transaction will not be sumitted.
- `chunkSize`: number of nonces per "chunk" -- 400000 is a good value on my machine.  Tweak this if your loops are too slow (> 10s) or too fast (< 5s), it will likely vary by machine.

## Usage

```sh
$ git clone <this repo>
$ yarn install
$ # create a config.json
$ yarn miner
```

