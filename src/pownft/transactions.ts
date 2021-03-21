import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";
import { formatEther, formatUnits } from "@ethersproject/units";
import { TargetAtom } from "../miner";



export async function mineAtom(instance: Contract, targetAtom: TargetAtom, gasPrice: BigNumber) : Promise<TransactionResponse> {
    
    const value = targetAtom.cost;

    console.log(`Issuing tx to mine atom ${targetAtom.tokenId} for ${formatEther(value)} eth using gas ${formatUnits(gasPrice, 'gwei')} using nonce ${targetAtom.nonce.toString()}`);

    // this will simulate the tx on chain, if anyone has mined a block it will fail with a "revert: difficulty" message
    const gasLimit = await instance.estimateGas.mine(targetAtom.nonce, {value, gasPrice});
    return instance.mine(targetAtom.nonce, {value, gasPrice, gasLimit});
}