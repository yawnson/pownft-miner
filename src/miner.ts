import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { spawn, Pool, Worker } from "threads";
import { getAtomPrice } from "./pownft/utils";

// interval, in millis, to update the latest atom from the on-chain data
const ATOM_UPDATE_INTERVAL = 10000;

export interface Atom {
    tokenId: number;
    hash: string;
}

export interface MiningOptions {
    numThreads: number;
    provider: JsonRpcProvider;
    instance: Contract;
    signerAddress: string;
    chunkSize: number;
}


export interface TargetAtom {
    tokenId: number;
    nonce: BigNumber;
    cost: BigNumber;    //wei
}


async function getLatestAtom(provider: JsonRpcProvider, instance: Contract) : Promise<Atom> {

    // maybe a smarter way to do this, but avoid going back too far
    const latestBlock = await provider.getBlockNumber();
    const startBlock = latestBlock - 10000;

    const filter = instance.filters.Mined()
    const events = await instance.queryFilter(filter, startBlock, 'latest')

    let lastEvent = null;
    for (let event of events) {
        lastEvent = event;
    }

    return {
        tokenId: lastEvent!.args!._tokenId.toNumber(),
        hash: lastEvent!.args!.hash
    }
}

/**
 * Attempts to mine the next atom, checking the on-chain state and moving
 * to the next atom if someone else mined it.  On success, this will
 * return the nonce to call the `mine()` function with.
 **/
export async function mineNextAtom({numThreads, provider, instance, signerAddress, chunkSize} : MiningOptions): Promise<TargetAtom> {

    // we defer all mining to this thread pool, keep the main event
    // loop clear
    const pool = Pool(() => spawn(new Worker("./workers/miner")), numThreads);    

    // seed the initial atom
    console.log("Loading latest atom mined...");
    let latestAtom = await getLatestAtom(provider, instance);
    console.log(`Latest atom mined was ${latestAtom.tokenId}`);

    let found = false;

    // update the latest atom periodically
    const intervalHandle = setInterval(async () => {
        try {
            latestAtom = await getLatestAtom(provider, instance);
        } catch (e) {
            console.log('Error updating latest atom -- bad if this keeps happening!');
        }
    }, ATOM_UPDATE_INTERVAL);
    
    let nonce = BigNumber.from(0);

    const noncePerLoop = numThreads * chunkSize;

    while (!found) {
        const loopAtom = latestAtom;

        const before = new Date();
        const tasks = [];
        for (let i = 0; i < numThreads; i++) {
            const task = pool.queue(miner => miner(loopAtom.tokenId, loopAtom.hash, signerAddress, nonce.add(i*chunkSize).toString(), chunkSize));
            tasks.push(task);
        }
        
        // now wait for each of them.  they should roughly finish at the same time.
        const results = []
        for (let task of tasks) {
            results.push(await task);
        }

        const duration = (new Date().getTime() - before.getTime()) / 1000
        console.log(`Hash rate: ${Math.round(noncePerLoop / duration)}  Loop duration: ${Math.round(duration)}s  Nonce: ${nonce.toString()}`);

        if (latestAtom.tokenId !== loopAtom.tokenId) {
            console.log(`New atom detected! ${loopAtom.tokenId} -> ${latestAtom.tokenId}`);
            nonce = BigNumber.from(0);
        } else {
            // see if we found one
            for (let result of results) {
                const resultNonce = BigNumber.from(result.nonce);
                if (result.found) {
                    clearInterval(intervalHandle);
                    return {
                        tokenId: latestAtom.tokenId + 1,
                        nonce: resultNonce,
                        cost: getAtomPrice(latestAtom.tokenId + 1)
                    }
                } else if (resultNonce.gt(nonce)) {
                    nonce = resultNonce;
                }
            }
        }
    }

    // not valid, keep ts compiler happy
    throw Error('Should not happen');
}