import { getBech32AddressFromEVMAddress } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { BridgeTransferRequest } from './TransactionRequestModels';
import { BridgeTransferDirection } from '../models/Transaction';
import { BridgeTransactionUnsigned } from './signers/TransactionSupported';
import { LEDGER_WALLET_TYPE } from './LedgerService';
import { WalletBaseService } from './WalletBaseService';

class BridgeService extends WalletBaseService {
  public async handleBridgeTransaction(bridgeTransferRequest: BridgeTransferRequest) {
    const { bridgeTransferDirection } = bridgeTransferRequest;

    switch (bridgeTransferDirection) {
      case BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS: {
        // TODO : fill in proper values
        const bridgeChannel = 'channel-3';
        const bridgePort = 'transfer';

        const recipientBech32Address = getBech32AddressFromEVMAddress(
          bridgeTransferRequest.fromAddress,
          'eth',
        );

        const {
          nodeRpc,
          accountNumber,
          accountSequence,
          transactionSigner,
          ledgerTransactionSigner,
        } = await this.prepareTransaction();

        const bridgeTransaction: BridgeTransactionUnsigned = {
          amount: bridgeTransferRequest.amount,
          fromAddress: bridgeTransferRequest.fromAddress,
          toAddress: recipientBech32Address,
          accountNumber,
          accountSequence,
          channel: bridgeChannel,
          memo: `${bridgeTransferDirection}:desktop-wallet-client`,
          port: bridgePort,
        };

        let signedTxHex: string = '';

        if (bridgeTransferRequest.walletType === LEDGER_WALLET_TYPE) {
          signedTxHex = await ledgerTransactionSigner.signIBCTransfer(
            bridgeTransaction,
            bridgeTransferRequest.decryptedPhrase,
          );
        } else {
          signedTxHex = await transactionSigner.signIBCTransfer(
            bridgeTransaction,
            bridgeTransferRequest.decryptedPhrase,
          );
        }
        return await nodeRpc.broadcastTransaction(signedTxHex);
      }

      case BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG:
        throw new TypeError('Bridge  transfer direction not supported yet');

        break;

      case BridgeTransferDirection.ETH_TO_CRONOS:
        throw new TypeError('Bridge  transfer direction not supported yet');

        break;
      case BridgeTransferDirection.CRONOS_TO_ETH:
        throw new TypeError('Bridge  transfer direction not supported yet');

        break;
      default:
        throw new TypeError('Unknown bridge  transfer direction');
    }
  }
}

export const bridgeService = new BridgeService();
