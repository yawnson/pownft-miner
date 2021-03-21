import { BigNumber } from "@ethersproject/bignumber";
import { arrayify, solidityKeccak256, zeroPad } from "ethers/lib/utils";
import { expose } from "threads/worker";
import { getDifficultyForGeneration, getGenerationForTokenId } from "../pownft/utils";
import { keccak } from 'hash-wasm';


export async function attempt(lastHash: string, address: string, nonce: BigNumber, difficulty: BigNumber, addressHashArray: Uint8Array){

    // can we do this smarter, don't like allocating a new array
    addressHashArray.set(zeroPad(nonce.toTwos(256) as any, 32), addressHashArray.length - 32);

    const hashFast = "0x" + await keccak(addressHashArray, 256);

    // sanity check, uncomment this to use the original hash, verify they are equal.  this is about 4-5x slower
    // in my test setup.
    // const hashSlow = solidityKeccak256(["address","bytes32","uint256"], [address, lastHash, nonce]);
    // if (hashSlow !== hashFast) {
    //     console.log(`Hashes do not match ${hashSlow}  ${hashFast}`);
    //     throw Error('oh no!');
    // }

    return BigNumber.from(hashFast).lt(difficulty);
}


expose(async function mineChunk(lastTokenId: number, lastHash: string, address: string, startingNonce: string, attempts: number) {

    let nonce = BigNumber.from(startingNonce);
    const endingNonce = nonce.add(attempts);

    const generation = getGenerationForTokenId(lastTokenId + 1);
    const difficulty = getDifficultyForGeneration(generation);

    let found = false;

    // we pre-allocate one array that will be used for all attempts, avoid excessive memory allocations
    const addressArray = arrayify(address);
    const hashArray = arrayify(lastHash);
    const addressHash = new Uint8Array(addressArray.length + hashArray.length + 32);
    addressHash.set(addressArray, 0);
    addressHash.set(hashArray, addressArray.length);

    while(nonce.lt(endingNonce)) {
        found = await attempt(lastHash, address, nonce, difficulty, addressHash);
        if (found) {

            return {
                found,
                nonce: nonce.toString()
            }
        }
        nonce = nonce.add(1);
    }

    // if not found, return the last nonce we tried
    return {
        found,
        nonce: nonce.sub(1).toString()
    }

});