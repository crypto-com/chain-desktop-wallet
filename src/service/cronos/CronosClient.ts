/* eslint-disable @typescript-eslint/no-unused-vars */
import { EVMClient } from '../rpc/clients/EVMClient';
import {
    ICronosChainIndexAPI,
    txListRequestOptions,
    txPendingListRequestOptions,
} from '../rpc/interface/cronos.chainIndex';
import {
    TxListAPIResponse,
    txListByAccountRequestParams,
    PendingTxListAPIResponse,
} from '../rpc/models/cronos.models';
import axios, { AxiosResponse } from 'axios';

const cronosExplorerAPIBaseURI = 'https://cronos-explorer.crypto.org/api';
/**
 * name: CronosClient
 * purpose: This client can be used to handle `Cronos` related operations.
 */
export class CronosClient extends EVMClient implements ICronosChainIndexAPI {

    constructor(web3ProviderURL: string) {
        super(EVMClient.create(web3ProviderURL).web3);
    }

    getTxsByAddress = async (
        address: string,
        options?: txListRequestOptions,
    ): Promise<TxListAPIResponse> => {
        const requestParams: txListByAccountRequestParams = {
            module: 'account',
            action: 'txlist',
            address: address,
            ...options,
        };

        const txListResponse: AxiosResponse<TxListAPIResponse> = await axios({
            baseURL: cronosExplorerAPIBaseURI,
            url: '/api',
            params: requestParams,
        });

        if (txListResponse.status !== 200) {
            throw new Error('Could not fetch transaction list from Cronos Chain Index API.');
        }
        return txListResponse.data;
    };

    getPendingTxsByAddress = async (
        address: string,
        options?: txPendingListRequestOptions,
    ): Promise<PendingTxListAPIResponse> => {
        const requestParams: txListByAccountRequestParams = {
            module: 'account',
            action: 'pendingtxlist',
            address: address,
            ...options,
        };

        const txListResponse: AxiosResponse<PendingTxListAPIResponse> = await axios({
            baseURL: cronosExplorerAPIBaseURI,
            url: '/api',
            params: requestParams,
        });

        if (txListResponse.status !== 200) {
            throw new Error('Could not fetch pending transaction list from Cronos Chain Index API.');
        }
        return txListResponse.data;
    };
}
