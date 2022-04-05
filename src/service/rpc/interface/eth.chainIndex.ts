/**
 * CDC Ethereum Indexing service API
 * @link https://cql.3ona.co/ethereum/testnet/api/docs/?apikey=anonymous
 * @dev 
 */

export interface txQueryBaseParams {
  pageSize?: number | 10000; // max: 10000 ; default: 100
  page?: number | 0; // max: 1000000 ; default: 0
}

export interface IEthChainIndexAPI {

  // List all transactions for an address
  getTxsByAddress(address: string, options?: txQueryBaseParams): Promise<any>;

  // Get transaction details  by transaction hash
  getTxByHash(txHash: string): Promise<any>;

  // Fetch Internal transaction for an address
  getInternalTxsByAddress(address: string, options?: any);
}