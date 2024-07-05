import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import {
  coin,
  DirectSecp256k1HdWallet,
  encodePubkey,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
  TxBodyEncodeObject,
} from '@cosmjs/proto-signing';
import { MsgSendEncodeObject, MsgTransferEncodeObject } from '@cosmjs/stargate';
import { HdPath } from '@cosmjs/crypto';
import {
  toBase64,
  fromBase64,
  toHex,
} from '@crypto-org-chain/chain-jslib/node_modules/@cosmjs/encoding';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { BaseTransactionSigner } from './TransactionSigner';
import { BridgeTransactionUnsigned, TransferTransactionUnsigned } from './TransactionSupported';
import { DEFAULT_IBC_TRANSFER_TIMEOUT, SupportedChainName, WalletConfig } from '../../config/StaticConfig';
import { MakeHdPath } from '../tendermint/MakeHdPath';
import { DerivationPathStandard } from './LedgerSigner';
import Long from 'long';

export interface ITransactionSigner {
  signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string>;

  // signDelegateTx(
  //   transaction: DelegateTransactionUnsigned,
  //   phrase: string,
  //   gasFee: string,
  //   gasLimit: number,
  // ): Promise<string>;

  // signWithdrawStakingRewardTx(
  //   transaction: WithdrawStakingRewardUnsigned,
  //   phrase: string,
  //   gasFee: string,
  //   gasLimit: number,
  // ): Promise<string>;
}

export class CosmjsTendermintTransactionSigner extends BaseTransactionSigner
  implements ITransactionSigner {
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    super(config);
    this.config = config;
  }

  // eslint-disable-next-line class-methods-use-this
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { accountNumber, accountSequence, asset } = transaction;

    if (!asset?.config?.tendermintNetwork) {
      throw new Error('Asset network config is not defined');
    }

    const { tendermintNetwork: network } = asset.config;

    let hdPath: HdPath;
    switch (network.chainName) {
      case SupportedChainName.COSMOS_HUB:
        hdPath = MakeHdPath.init(0, DerivationPathStandard.BIP44).cosmosHubMainnet();
        break;
      case SupportedChainName.CRONOS_TENDERMINT:
        hdPath = MakeHdPath.init(0, DerivationPathStandard.BIP44).cryptoOrgTestnet();
        break;
      default:
        throw new Error(`${network.chainName} is not supported`);
    }

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(phrase, {
      hdPaths: [hdPath],
      prefix: network.addressPrefix,
    });

    const [{ address: walletAddress, pubkey: pubkeyBytes }] = await wallet.getAccounts();
    const pubkey = encodePubkey({
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubkeyBytes),
    });
    const registry = new Registry();

    const msg = MsgSend.fromPartial({
      fromAddress: walletAddress,
      toAddress: transaction.toAddress,
      amount: [
        {
          denom: network.coin.baseDenom,
          amount: String(transaction.amount),
        },
      ],
    });

    const msgAny: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: msg,
    };

    const txBodyFields: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [msgAny],
      },
    };

    const fee = {
      amount: [
        {
          denom: network.coin.baseDenom,
          amount: gasFee,
        },
      ],
      gas: gasLimit,
    };
    // eslint-disable-next-line
    const txBodyBytes = registry.encode(txBodyFields);
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: accountSequence }],
      fee.amount,
      fee.gas,
      undefined,
      undefined,
    );

    const chainId = asset.config.chainId ?? '';
    const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const { signature } = await wallet.signDirect(walletAddress, signDoc);
    const txRaw = TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
    const signedBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
    const txHash = toHex(signedBytes);

    return txHash;
  }

  public async signIBCTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { accountNumber, accountSequence, originAsset: asset } = transaction;
    const typeUrlIBCTransfer = '/ibc.applications.transfer.v1.MsgTransfer';

    if (!asset?.config?.tendermintNetwork) {
      throw new Error('Asset network config is not defined');
    }

    const { tendermintNetwork: network } = asset.config;

    let hdPath: HdPath;
    switch (network.chainName) {
      case SupportedChainName.COSMOS_HUB:
        hdPath = MakeHdPath.init(0, DerivationPathStandard.BIP44).cosmosHubMainnet();
        break;
      default:
        throw new Error(`${network.chainName} is not supported`);
    }

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(phrase, {
      hdPaths: [hdPath],
      prefix: network.addressPrefix,
    });

    const [{ address: walletAddress, pubkey: pubkeyBytes }] = await wallet.getAccounts();
    const pubkey = encodePubkey({
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubkeyBytes),
    });
    const registry = new Registry();

    const millisToNanoSecond = 1_000_000;
    const timeout = (Date.now() + DEFAULT_IBC_TRANSFER_TIMEOUT) * millisToNanoSecond;

    const msg = MsgTransfer.fromPartial({
      sourcePort: transaction.port || '',
      sourceChannel: transaction.channel || '',
      token: coin(transaction.amount, asset.config.tendermintNetwork.coin.baseDenom),
      sender: walletAddress,
      receiver: transaction.toAddress,
      timeoutTimestamp: Long.fromString(String(timeout), true),
    });

    const msgAny: MsgTransferEncodeObject = {
      typeUrl: typeUrlIBCTransfer,
      value: msg,
    };

    const txBodyFields: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: [msgAny],
      },
    };

    const fee = {
      amount: [
        {
          denom: network.coin.baseDenom,
          amount: gasFee,
        },
      ],
      gas: gasLimit,
    };
    // eslint-disable-next-line
    registry.register(typeUrlIBCTransfer, MsgTransfer);
    const txBodyBytes = registry.encode(txBodyFields);
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: accountSequence }],
      fee.amount,
      fee.gas,
      undefined,
      undefined,
    );

    const chainId = asset.config.chainId ?? '';
    const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const { signature } = await wallet.signDirect(walletAddress, signDoc);
    const txRaw = TxRaw.fromPartial({
      bodyBytes: txBodyBytes,
      authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
    const signedBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
    const txHash = toHex(signedBytes);

    return txHash;
  }
}
