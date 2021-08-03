interface ExplorerAPIResponse {
    message: string;
    status: "1" | "0";
}

export interface TxListAPIResponse extends ExplorerAPIResponse {
    result: TransactionDetail[];
}

export interface PendingTxListAPIResponse extends ExplorerAPIResponse {
    result: PendingTransactionDetail[];
}

export interface TransactionDetail {
    blockHash: string;
    blockNumber: string;
    confirmations: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    from: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    isError: string;
    nonce: string;
    timeStamp: string;
    to: string;
    transactionIndex: string;
    txreceiptStatus: string;
    value: string;
}

export interface PendingTransactionDetail {
    contractAddress: string;
    cumulativeGasUsed: string;
    from: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    nonce: string;
    to: string;
    value: string;
}
