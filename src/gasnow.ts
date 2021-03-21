import axios from "axios";

interface GasPrices {
    rapid: number;
    fast: number;
    normal: number;
    slow: number;
}

export async function getGasPrices() : Promise<GasPrices> {
    const result = await axios.get('https://www.gasnow.org/api/v3/gas/data?utm_source=web', {timeout: 3000});
    return result.data.data.gasPrices as GasPrices;
}