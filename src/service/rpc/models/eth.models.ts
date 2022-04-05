/**
 * Blockchair API Response Models
 */

export interface TransactionsByAddressResponse {
    data: TransactionData[];
}

export interface TransactionData {
    transaction_hash: string;
    signer: string[];
    from: string[];
    to: string;
    amount: string;
    decimal: number;
    token_addr: string;
    token_name: string;
    token_symbol: string;
    type: string;
    failed: boolean;
    fail_reason: null;
    timestamp: string;
    block: number;
    transaction_index: number;
    log_index: number;
    gas_price: number;
    gas_used: number;
}