import { getBech32AddressFromEVMAddress } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { BridgeTransferRequest } from './TransactionRequestModels';
import { BridgeTransferDirection } from '../models/Transaction';
import { BridgeTransactionUnsigned } from './signers/TransactionSupported';
import { LEDGER_WALLET_TYPE } from './LedgerService';
import { WalletBaseService } from './WalletBaseService';
import { getBaseScaledAmount } from '../utils/NumberUtils';

class BridgeService extends WalletBaseService {
  public async handleBridgeTransaction(bridgeTransferRequest: BridgeTransferRequest) {
    const { bridgeTransferDirection } = bridgeTransferRequest;

    switch (bridgeTransferDirection) {
      case BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS: {
        // TODO : Persist these values on the db and make them configurable
        const bridgeChannel = 'channel-3';
        const bridgePort = 'transfer';

        if (!bridgeTransferRequest.tendermintAddress || !bridgeTransferRequest.evmAddress) {
          throw new TypeError(
            `The Bech32 address and EVM address are required for doing ${bridgeTransferDirection} transfer`,
          );
        }

        const evmToBech32ConvertedRecipient = getBech32AddressFromEVMAddress(
          bridgeTransferRequest.evmAddress,
          'eth',
        );

        const {
          nodeRpc,
          accountNumber,
          accountSequence,
          transactionSigner,
          ledgerTransactionSigner,
        } = await this.prepareTransaction();

        const scaledBaseAmount = getBaseScaledAmount(
          bridgeTransferRequest.amount,
          bridgeTransferRequest.originAsset,
        );

        const bridgeTransaction: BridgeTransactionUnsigned = {
          amount: scaledBaseAmount,
          fromAddress: bridgeTransferRequest.tendermintAddress,
          toAddress: evmToBech32ConvertedRecipient,
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
