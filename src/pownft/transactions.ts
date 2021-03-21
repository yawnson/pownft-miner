import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/providers";
import { formatEther, formatUnits } from "@ethersproject/units";
import { TargetAtom } from "../miner";



export async function mineAtom(instance: Contract, targetAtom: TargetAtom, gasPrice: BigNumber, dryRun: boolean) : Promise<TransactionResponse | false> {
    
    const value = targetAtom.cost;

    const prefix = dryRun ? '[DRY RUN] ' : '';

    console.log(`${prefix}Issuing tx to mine atom ${targetAtom.tokenId} for ${formatEther(value)} eth using gas ${formatUnits(gasPrice, 'gwei')} using nonce ${targetAtom.nonce.toString()}`);

    // this will simulate the tx on chain, if anyone has mined a block it will fail with a "revert: difficulty" message
    const gasLimit = await instance.estimateGas.mine(targetAtom.nonce, {value, gasPrice});

    if (dryRun) {
        return false;
    } else {
        return instance.mine(targetAtom.nonce, {value, gasPrice, gasLimit});
    }
    
}