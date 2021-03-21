import { ethers } from "ethers";

const BN = ethers.BigNumber;


const BASE_DIFFICULTY = BN.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').div(BN.from(300));
const DIFFICULTY_RAMP = 3;
const BASE_COST = BN.from(ethers.utils.parseEther('0.000045'));


export function getAtomPrice(tokenId: number) {
    const generation = getGenerationForTokenId(tokenId);
    return (BN.from(Math.pow(2,generation) - 1)).mul(BASE_COST);
}


export function getDifficultyForGeneration(generation: number){
    if (generation > 13) {
        throw Error(`Difficulty not available for generation ${generation}`)
    }
    return BASE_DIFFICULTY.div(BN.from(Math.pow(DIFFICULTY_RAMP, generation)));
}


export function getGenerationForTokenId(tokenId: number) {    
    if (tokenId < 512) {
        // yes, this techically wont work for generations before this
        return 8;
    } else if (tokenId < 1024) {
        return 9;
    } else if (tokenId < 2048) {
        return 10;
    } else if (tokenId < 4096) {
        return 11;
    } else if (tokenId < 8192) {
        return 12;
    } else if (tokenId < 16384) {
        return 13;
    } else {
        // dont want to mine above here
        throw Error(`Cannot determine generation for token id ${tokenId}`);
    }
}

