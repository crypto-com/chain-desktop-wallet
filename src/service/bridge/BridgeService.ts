import { getBech32AddressFromEVMAddress } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import { TransactionConfig } from 'web3-eth';
import { BridgeTransferRequest } from '../TransactionRequestModels';
import { BridgeTransferDirection, BroadCastResult } from '../../models/Transaction';
import { BridgeTransactionUnsigned } from '../signers/TransactionSupported';
import { LEDGER_WALLET_TYPE } from '../LedgerService';
import { WalletBaseService } from '../WalletBaseService';
import { getBaseScaledAmount } from '../../utils/NumberUtils';
import BridgeABI from './contracts/BridgeABI.json';
import { CronosClient } from '../cronos/CronosClient';
import { evmTransactionSigner } from '../signers/EvmTransactionSigner';

class BridgeService extends WalletBaseService {
  public async handleBridgeTransaction(
    bridgeTransferRequest: BridgeTransferRequest,
  ): Promise<BroadCastResult> {
    const { bridgeTransferDirection } = bridgeTransferRequest;

    switch (bridgeTransferDirection) {
      case BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS: {
        return await this.handleCryptoOrgToCronosTransfer(bridgeTransferRequest);
      }

      case BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG: {
        return await this.handleCronosToCryptoOrgTransfer(bridgeTransferRequest);
      }

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

  private async handleCronosToCryptoOrgTransfer(bridgeTransferRequest: BridgeTransferRequest) {
    const { originAsset } = bridgeTransferRequest;

    if (bridgeTransferRequest.walletType === LEDGER_WALLET_TYPE) {
      throw TypeError(
        `${LEDGER_WALLET_TYPE} not supported yet for ${bridgeTransferRequest.bridgeTransferDirection} transactions yet. Coming soon`,
      );
    }

    if (!originAsset.config?.nodeUrl || !originAsset.address) {
      throw TypeError(`Missing asset config: ${originAsset.config}`);
    }

    const cronosClient = new CronosClient(
      originAsset.config?.nodeUrl,
      originAsset.config?.indexingUrl,
    );

    // TODO: Load contract address from Bridge configuration object
    const bridgeContractAddress = '0x3368dD21c4136747a6569f98C55f5ec0a2D984B3';
    const bridgeContractABI = BridgeABI as AbiItem[];
    const web3 = new Web3(originAsset.config?.nodeUrl);
    const contract = new web3.eth.Contract(bridgeContractABI, bridgeContractAddress);
    const encodedABI = contract.methods
      .send_cro_to_crypto_org(bridgeTransferRequest.tendermintAddress)
      .encodeABI();

    // eslint-disable-next-line no-console
    console.log('Encoded Contract ABI', encodedABI);

    const scaledBaseAmount = getBaseScaledAmount(bridgeTransferRequest.amount, originAsset);

    const bridgeTransaction: BridgeTransactionUnsigned = {
      amount: scaledBaseAmount,
      fromAddress: bridgeTransferRequest.evmAddress,
      toAddress: bridgeContractAddress,
      memo: `bridge:desktop-wallet-client`,
      data: encodedABI,
      accountNumber: 0,
      accountSequence: 0,
    };

    const txConfig: TransactionConfig = {
      from: bridgeTransaction.fromAddress,
      to: bridgeTransaction.toAddress,
      value: web3.utils.toWei(bridgeTransferRequest.amount, 'ether'),
    };

    const prepareTxInfo = await this.prepareEVMTransaction(originAsset, txConfig);

    bridgeTransaction.nonce = prepareTxInfo.nonce;
    bridgeTransaction.gasPrice = prepareTxInfo.loadedGasPrice;
    bridgeTransaction.gasLimit = prepareTxInfo.gasLimit;

    const signedTransaction = await evmTransactionSigner.signBridgeTransfer(
      bridgeTransaction,
      bridgeTransferRequest.decryptedPhrase,
    );

    const broadcastedTransactionHash = await cronosClient.broadcastRawTransactionHex(
      signedTransaction,
    );

    return {
      transactionHash: broadcastedTransactionHash,
      message: '',
      code: 200,
    };
  }

  private async handleCryptoOrgToCronosTransfer(bridgeTransferRequest: BridgeTransferRequest) {
    // TODO : Persist these values on the db and make them configurable
    const bridgeChannel = 'channel-129';
    const bridgePort = 'transfer';

    if (!bridgeTransferRequest.tendermintAddress || !bridgeTransferRequest.evmAddress) {
      throw new TypeError(
        `The Bech32 address and EVM address are required for doing ${bridgeTransferRequest.bridgeTransferDirection} transfer`,
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
      memo: `bridge:desktop-wallet-client`,
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
}

export const bridgeService = new BridgeService();
