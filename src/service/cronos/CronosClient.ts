import { EVMClient } from "../rpc/clients/EVMClient";
import { ICronosChainIndexAPI } from "../rpc/interface/cronos.chainIndex";
import { TxListAPIResponse } from "../rpc/models/cronos.models";

/**
 * name: CronosClient
 * purpose: This client can be used to handle `Cronos` related operations.
 */

class CronosClient extends EVMClient implements ICronosChainIndexAPI {

    async getTxsByAddress(_address: string): Promise<TxListAPIResponse> {
        // todo: implement the logic using `axios` client
        throw new Error("Method not implemented.");
    }
    
    async getPendingTxsByAddress(_address: string): Promise<TxListAPIResponse> {
        // todo: implement the logic using `axios` client
        throw new Error("Method not implemented.");
    }
}

export { CronosClient };