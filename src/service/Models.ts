import { NodeRpcService } from './rpc/NodeRpcService';
import { Session } from '../models/Session';
import { TransactionSigner } from './signers/TransactionSigner';
import { LedgerTransactionSigner } from './signers/LedgerTransactionSigner';

export interface TenderMintTransactionPrepared {
  nodeRpc: NodeRpcService;
  accountNumber: number;
  accountSequence: number;
  currentSession: Session;
  transactionSigner: TransactionSigner;
  ledgerTransactionSigner: LedgerTransactionSigner;
  latestBlock?: number;
}

export interface PrepareEVMTransaction {
  nonce: number;
  loadedGasPrice: string;
  gasLimit: number;
  currentSession: Session;
}
