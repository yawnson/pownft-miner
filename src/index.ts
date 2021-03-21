import { Signer, VoidSigner } from "@ethersproject/abstract-signer";
import { JsonRpcProvider } from "@ethersproject/providers";
import { powNftContract } from "./contract/pownftv3";

import { mineNextAtom } from "./miner";
import { getGasPrices } from "./gasnow";
import { mineAtom } from "./pownft/transactions";
import { BigNumber } from "@ethersproject/bignumber";
import { Wallet } from "@ethersproject/wallet";
import { readFileSync } from "fs";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { config } from "node:process";


// // set thi to the max you are willing to pay
// const GAS_LIMIT = parseUnits('200', 'gwei');

// // number of cores you want to hammer.  somewhere between 50-80% of the cores on your machine
// // is ideal (4-6 cores on an 8 core, for example).
// const NUM_CORES = 4;

// // number of nonces per task, tweak this so your loop duration is 5-10s
// // 400000 works well for me
// const CHUNK_SIZE = 400000;


interface Config {
    provider: JsonRpcProvider;
    signer: Signer;
    numCores: number;
    gasLimit: BigNumber;
    chunkSize: number;
}

function loadConfig() : Config {

    const config = JSON.parse(readFileSync('./config.json') as any);
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
    }    
}

async function main() {

    const { provider, signer, numCores, chunkSize, gasLimit } = loadConfig();
    
    // fake signer, do not allow this to sign anything when mining an atom 
    const address = await signer.getAddress();
    console.log(`Miner configured with address ${address}`);

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

    // const liveInstance = powNftContract(signer);
    // const tx = await mineAtom(liveInstance, targetAtom, BigNumber.from(gasPrices.rapid));
    // console.log(`Submitted transaction ${tx.hash}`);
    // const txReceipt = await tx.wait();
    // console.log('Transaction mined!');
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    });