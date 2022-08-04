export interface CosmosHubTxsResponse {
  code: number;
  data: CosmosHubTxsResponseTxModel[];
  message?: string;
}

export interface CosmosHubTxsResponseTxModel {
  hash: string; // "ECF818BB7994D429D50FFB8CBCB2706ED86AB8C9611D7E06E03CDE9ADB02CB0A",
  height: string; // "1060601",
  chain_id: string; // "cosmoshub-4",
  time: string; // "1642394400";
  fee: string; // "5400";
  gas_wanted: string; // "77291";
  type: string; // "send";
  direct: string; // "receive";
  memo: string;
  status: string; // "success";
  denom?: string; // "uatom"
  sub: {
    from_address: string;
    to_address: string;
    denom: string; // "uatom"
    amount: string; // "1",
    direct: string; // "receive"
    type: string; // "send"
  }[];
  amount: string; // "1000",
  version?: string; // "0.0.1"
  bridge_detail?: any;
}
