/**
 * Blockchair API Response Models
 */

export type BlockchairTxQueryResponse = TxDataFailureResponse | TxDataSuccessResponse;

export interface TxDataFailureResponse {
    data: null,
    context: BadContext;
}

export interface TxDataSuccessResponse {
    data: AddressTxDetails;
    context: SuccessContext;
}

export interface BadContext {
    code: number;
    error: string;
    market_price_usd: number;
    cache: Cache;
    api: API;
    servers: string;
    time: number;
    render_time: number;
    full_time: number;
    request_cost: number;
}

export interface SuccessContext {
    code: number;
    source: string;
    limit: string;
    offset: string;
    results: number;
    state: number;
    state_layer_2: number;
    market_price_usd: number;
    cache: Cache;
    api: API;
    servers: string;
    time: number;
    render_time: number;
    full_time: number;
    request_cost: number;
}

export interface API {
    version: string;
    last_major_update: Date;
    next_major_update: null;
    documentation: string;
    notice: string;
}

export interface Cache {
    live: boolean;
    duration: number;
    since: Date;
    until: Date;
    time: null;
}

export interface AddressTxDetails {
    [key: string]: AddressData;
}

export interface AddressData {
    address: Address;
    calls: TxData[];
}

export interface Address {
    type: string;
    contract_code_hex: null;
    contract_created: null;
    contract_destroyed: null;
    balance: string;
    balance_usd: number;
    received_approximate: string;
    received_usd: number;
    spent_approximate: string;
    spent_usd: number;
    fees_approximate: string;
    fees_usd: number;
    receiving_call_count: number;
    spending_call_count: number;
    call_count: number;
    transaction_count: number;
    first_seen_receiving: Date;
    last_seen_receiving: Date;
    first_seen_spending: Date;
    last_seen_spending: Date;
    nonce: null;
}

export interface TxData {
    block_id: number;
    transaction_hash: null | string;
    index: string;
    time: Date;
    sender: null | string;
    recipient: string;
    value: number;
    value_usd: number;
    transferred: boolean;
}
