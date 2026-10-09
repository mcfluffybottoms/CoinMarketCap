// import axios, { AxiosInstance } from 'axios';
// import { ClientError } from '../errors/errors';
// import { time } from 'node:console';
// import { CoinMarketCapResponse } from '../types/coinmarketcap';
// import { logger } from '../utils/logger';

// export class CoinMarketCapClient {
//     private readonly client: AxiosInstance;

//     constructor(
//         apiKey: string,
//         private readonly currency: string,
//         timeoutMs = 5000,
//     ) {
//         let baseUrl = 'https://pro-api.coinmarketcap.com'
//         const headers: Record<string, string> = {
//             Accept: 'application/json',
//         };

//         if (!apiKey.trim()) {
//             throw new ClientError("No api key present");
//         }

//         headers['X-CMC_PRO_API_KEY'] = apiKey.trim();

//         this.client = axios.create({
//             baseURL: baseUrl,
//             timeout: timeoutMs,
//             headers,
//         });
//     }

//     async getPrice(symbol: string): Promise<number> {
//         const normalizedSymbol = symbol.trim().toUpperCase();
//         if (!normalizedSymbol) {
//             throw new ClientError('Cryptocurrency symbol is required');
//         }

//         try {
//             const response = await this.client.get<CoinMarketCapResponse>(

//             )
//         } catch() {

//         }
//     }

//     async getCoin(symbol: string): Promise<number> {
//         const normalizedSymbol = symbol.trim().toUpperCase();
//         if (!normalizedSymbol) {
//             throw new ClientError('Cryptocurrency symbol is required');
//         }

//         try {
//             const response = await this.client.get<CoinMarketCapResponse>(

//             )
//         } catch() {

//         }
//     }
// }
