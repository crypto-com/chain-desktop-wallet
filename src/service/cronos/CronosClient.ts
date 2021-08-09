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

/**
 * name: CronosClient
 * purpose: This client can be used to handle `Cronos` related operations.
 */
export class CronosClient extends EVMClient implements ICronosChainIndexAPI {

    private cronosExplorerAPIBaseURL: string;
    constructor(web3ProviderURL: string, explorerAPIBaseURL: string) {
        super(EVMClient.create(web3ProviderURL).getWeb3());
        if (this.isValidHTTPURL(explorerAPIBaseURL)) {
            this.cronosExplorerAPIBaseURL = explorerAPIBaseURL;
        } else {
            throw new Error("Invalid `explorerAPIBaseURL` provided.");
        }
    }

    private isValidHTTPURL = (url: string): boolean => {
        if (url.startsWith('https://')) {
            return true;
        } else if (url.startsWith('http://')) {
            return true;
        } else {
            return false;
        }
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
            baseURL: this.cronosExplorerAPIBaseURL,
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
            baseURL: this.cronosExplorerAPIBaseURL,
            url: '/api',
            params: requestParams,
        });

        if (txListResponse.status !== 200) {
            throw new Error('Could not fetch pending transaction list from Cronos Chain Index API.');
        }
        return txListResponse.data;
    };
}
