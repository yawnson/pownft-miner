import { Signer, VoidSigner } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, TransactionResponse } from "@ethersproject/providers";
import { powNftContract } from "./contract/pownftv3";

import { mineNextAtom } from "./miner";
import { getGasPrices } from "./gasnow";
import { mineAtom } from "./pownft/transactions";
import { BigNumber } from "@ethersproject/bignumber";
import { Wallet } from "@ethersproject/wallet";
import { readFileSync } from "fs";
import { join } from "path";
import { formatUnits, parseUnits } from "@ethersproject/units";


interface Config {
    provider: JsonRpcProvider;
    signer: Signer;
    numCores: number;
    gasLimit: BigNumber;
    chunkSize: number;
    dryRun: boolean;
}

function loadConfig() : Config {

    const targetFile = join(__dirname, '..', 'config.json');
    const config = JSON.parse(readFileSync(targetFile) as any);
    const accountPath = `m/44'/60'/0'/0/${config.index}`;

    const provider = new JsonRpcProvider(config.provider);
    const wallet = Wallet.fromMnemonic(config.mnemonic, accountPath).connect(provider);

    const gasLimit = parseUnits(BigNumber.from(config.gasLimit).toString(), 'gwei');

    return {
        provider,
        signer: wallet,
        numCores: config.numCores,
        gasLimit,
        chunkSize: config.chunkSize,
        dryRun: config.dryRun,
    }    
}

async function main() {

    const { provider, signer, numCores, chunkSize, gasLimit, dryRun } = loadConfig();
    
    const address = await signer.getAddress();
    console.log(`Miner configured with address ${address} using ${numCores} cores`);

    if (dryRun) {
        console.log("Running in dry run mode, no transactions will be submitted")
    }

    // guard, use a read-only signer while mining
    const voidSigner = new VoidSigner(address, provider);
    const instance = powNftContract(voidSigner);

    const targetAtom = await mineNextAtom({
        numThreads: numCores,
        provider,
        instance,
        signerAddress: address,
        chunkSize,
    });

    console.log('Found atom!! Trying to submit tx...');

    const gasPrices = await getGasPrices();
    if (BigNumber.from(gasPrices.rapid).gt(gasLimit)) {
        throw Error(`Gas too expensive, the max is ${formatUnits(gasLimit, 'gwei')}! Not going to mine`);
    }
    console.log(`Gas price ${formatUnits(gasPrices.rapid, 'gwei')} is below the max of ${formatUnits(gasLimit, 'gwei')}`);

    if (dryRun) {
        console.log('Dry run mode, estimating gas but will not issue tx');
        const tx = await mineAtom(instance, targetAtom, BigNumber.from(gasPrices.rapid), dryRun);
    } else {
        // use the real signer
        const liveInstance = powNftContract(signer);
        const tx = (await mineAtom(liveInstance, targetAtom, BigNumber.from(gasPrices.rapid), dryRun)) as TransactionResponse;
        console.log(`Submitted transaction ${tx.hash}`);
        const txReceipt = await tx.wait();
        console.log('Transaction mined!');
    }
    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    });