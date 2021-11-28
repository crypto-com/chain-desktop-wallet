import sdk from '@crypto-org-chain/chain-jslib';
import { CosmosMsg } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/msg/cosmosMsg';
import Long from 'long';
import { Big, HDKey, Secp256k1KeyPair, Units } from '../../utils/ChainJsLib';
import {
  DEFAULT_IBC_TRANSFER_TIMEOUT,
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
  WalletConfig,
} from '../../config/StaticConfig';
import {
  TransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
  UndelegateTransactionUnsigned,
  RedelegateTransactionUnsigned,
  VoteTransactionUnsigned,
  NFTTransferUnsigned,
  NFTMintUnsigned,
  NFTDenomIssueUnsigned,
  BridgeTransactionUnsigned,
} from './TransactionSupported';

export interface ITransactionSigner {
  signTransfer(transaction: TransferTransactionUnsigned, phrase: string): Promise<string>;

  signDelegateTx(transaction: DelegateTransactionUnsigned, phrase: string): Promise<string>;

  signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string>;
}

export class BaseTransactionSigner {
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
  }

  public getTransactionInfo(_phrase: string, transaction: TransactionUnsigned) {
    return this.getTransactionInfoData(_phrase, transaction.memo);
  }

  public getTransactionInfoData(_phrase: string, memo: string) {
    const cro = sdk.CroSDK({ network: this.config.network });
    let keyPair;
    // For ledger based devices a mnemonic phrase is never passed in so we need to handle this only for normal wallets
    if (_phrase) {
      const importedHDKey = HDKey.fromMnemonic(_phrase);
      const privateKey = importedHDKey.derivePrivKey(this.config.derivationPath);
      keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    }

    const rawTx = new cro.RawTransaction();
    rawTx.setMemo(memo);

    const networkFee =
      this.config.fee !== undefined ? this.config.fee.networkFee : FIXED_DEFAULT_FEE;
    const gasLimit =
      this.config.fee !== undefined ? this.config.fee.gasLimit : FIXED_DEFAULT_GAS_LIMIT;

    const fee = new cro.Coin(networkFee, Units.BASE);

    rawTx.setFee(fee);
    rawTx.setGasLimit(gasLimit);
    return { cro, rawTx, keyPair };
  }
}

export class TransactionSigner extends BaseTransactionSigner implements ITransactionSigner {
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(msgSend, transaction, keyPair, rawTx);
  }

  public async signVoteTransaction(
    transaction: VoteTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgVote = new cro.gov.MsgVote({
      voter: transaction.voter,
      option: transaction.option,
      proposalId: Big(transaction.proposalID),
    });

    return this.getSignedMessageTransaction(msgVote, transaction, keyPair, rawTx);
  }

  public async signNFTTransfer(transaction: NFTTransferUnsigned, phrase: string): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgTransferNFT = new cro.nft.MsgTransferNFT({
      id: transaction.tokenId,
      sender: transaction.sender,
      denomId: transaction.denomId,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction(msgTransferNFT, transaction, keyPair, rawTx);
  }

  public async signNFTMint(transaction: NFTMintUnsigned, phrase: string): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgMintNFT = new cro.nft.MsgMintNFT({
      id: transaction.tokenId,
      name: transaction.name,
      sender: transaction.sender,
      denomId: transaction.denomId,
      uri: transaction.uri,
      data: transaction.data,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction(msgMintNFT, transaction, keyPair, rawTx);
  }

  public async signNFTDenomIssue(
    transaction: NFTDenomIssueUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgIssueDenom = new cro.nft.MsgIssueDenom({
      id: transaction.denomId,
      name: transaction.name,
      sender: transaction.sender,
      schema: transaction.schema,
    });

    return this.getSignedMessageTransaction(msgIssueDenom, transaction, keyPair, rawTx);
  }

  public async signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);
    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    return this.getSignedMessageTransaction(msgDelegate, transaction, keyPair, rawTx);
  }

  public async signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgWithdrawDelegatorReward = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    return this.getSignedMessageTransaction(
      msgWithdrawDelegatorReward,
      transaction,
      keyPair,
      rawTx,
    );
  }

  public async signUndelegateTx(
    transaction: UndelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgUndelegate = new cro.staking.MsgUndelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(msgUndelegate, transaction, keyPair, rawTx);
  }

  public async signRedelegateTx(
    transaction: RedelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgBeginRedelegate = new cro.staking.MsgBeginRedelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorSrcAddress: transaction.sourceValidatorAddress,
      validatorDstAddress: transaction.destinationValidatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(msgBeginRedelegate, transaction, keyPair, rawTx);
  }

  // eslint-disable-next-line class-methods-use-this
  async getSignedMessageTransaction(
    message: CosmosMsg,
    transaction: TransactionUnsigned,
    keyPair,
    rawTx,
  ) {
    const signableTx = rawTx
      .appendMessage(message)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    return signableTx
      .setSignature(0, keyPair.sign(signableTx.toSignDoc(0)))
      .toSigned()
      .getHexEncoded();
  }

  public async signIBCTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const millisToNanoSecond = 1_000_000;
    const timeout = (Date.now() + DEFAULT_IBC_TRANSFER_TIMEOUT) * millisToNanoSecond;

    const msgSend = new cro.ibc.MsgTransfer({
      sender: transaction.fromAddress,
      sourceChannel: transaction.channel || '',
      sourcePort: transaction.port || '',
      timeoutTimestampInNanoSeconds: Long.fromString(String(timeout), true),
      receiver: transaction.toAddress,
      token: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(msgSend, transaction, keyPair, rawTx);
  }
}
