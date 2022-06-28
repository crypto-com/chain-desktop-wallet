

// FIXME: change me
// const APP_PROTOCOL_NAME = 'cryptowallet';
export const APP_PROTOCOL_NAME = 'ledgerlive';
export const WALLET_CONNECT_PAGE_KEY = '/walletconnect';


type WCRequestMethod = 'personal_sign' | 'eth_sign' | 'eth_signTransaction' | 'eth_signTypedData' | 'eth_sendTransaction' | 'eth_signPersonalMessage' | 'eth_signTypedData_v3';



export type IWCRequest = IWCRequestPersonalSign | IWCRequestEthSign | IWCRequestEthSignTransaction | IWCRequestEthSignTypedData | IWCRequestEthSendTransaction | IWCRequestEthSignPersonalMessage | IWCRequestEthSignTypedDataV3;

export interface TxParams {
  from: string;
  to: string;
  data: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  nonce?: string;
}

interface IWCRequestBase {
  id: number;
  jsonrpc: string;
  method: WCRequestMethod;
  params: any[];
}

export interface IWCRequestPersonalSign extends IWCRequestBase {
  method: 'personal_sign';
  //  DATA, N Bytes - message to sign. 
  //  DATA, 20 Bytes - address.
  params: [string, string];
}

export interface IWCRequestEthSign extends IWCRequestBase {
  method: 'eth_sign';
  //  DATA, 20 Bytes - address.
  //  DATA, N Bytes - message to sign.
  params: [string, string];
}

export interface IWCRequestEthSignTransaction extends IWCRequestBase {
  method: 'eth_signTransaction';
  /*
    from: DATA, 20 Bytes - The address the transaction is send from.
    to: DATA, 20 Bytes - (optional when creating new contract) The address the transaction is directed to.
    data: DATA - The compiled code of a contract OR the hash of the invoked method signature and encoded parameters. For details see Ethereum Contract ABI
    gas: QUANTITY - (optional, default: 90000) Integer of the gas provided for the transaction execution. It will return unused gas.
    gasPrice: QUANTITY - (optional, default: To-Be-Determined) Integer of the gasPrice used for each paid gas
    value: QUANTITY - (optional) Integer of the value sent with this transaction
    nonce: QUANTITY - (optional) Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce.
  */
  params: [TxParams]
}

export interface IWCRequestEthSignTypedData extends IWCRequestBase {
  method: 'eth_signTypedData';
  //  DATA, N Bytes - address.
  //  DATA, N Bytes - message to sign.
  params: [string, string];
}

export interface IWCRequestEthSendTransaction extends IWCRequestBase {
  method: 'eth_sendTransaction';
  params: [TxParams]
}

export interface IWCRequestEthSignPersonalMessage extends IWCRequestBase {
  method: 'eth_signPersonalMessage';
  //  DATA, 20 Bytes - address.
  //  DATA, N Bytes - message to sign.
  params: [string, string];
}

export interface IWCRequestEthSignTypedDataV3 extends IWCRequestBase {
  method: 'eth_signTypedData_v3';
  //  DATA, N Bytes - address.
  //  DATA, N Bytes - message to sign.
  params: [string, string];
}
