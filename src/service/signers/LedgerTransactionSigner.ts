import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { CosmosMsg } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/msg/cosmosMsg';
import Long from 'long';
import { Big, Units } from '../../utils/ChainJsLib';
import { WalletConfig } from '../../config/StaticConfig';
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
import { ISignerProvider } from './SignerProvider';
import { BaseTransactionSigner, ITransactionSigner } from './TransactionSigner';

export class LedgerTransactionSigner extends BaseTransactionSigner implements ITransactionSigner {
  public readonly config: WalletConfig;

  public readonly signerProvider: ISignerProvider;

  public readonly addressIndex: number;

  constructor(config: WalletConfig, signerProvider: ISignerProvider, addressIndex: number) {
    super(config);
    this.config = config;
    this.signerProvider = signerProvider;
    this.addressIndex = addressIndex;
  }

  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(transaction, msgSend, rawTx);
  }

  public async signVoteTransaction(
    transaction: VoteTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgVote = new cro.gov.MsgVote({
      voter: transaction.voter,
      option: transaction.option,
      proposalId: Big(transaction.proposalID),
    });

    return this.getSignedMessageTransaction(transaction, msgVote, rawTx);
  }

  public async signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);
    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    return this.getSignedMessageTransaction(transaction, msgDelegate, rawTx);
  }

  public async signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgWithdrawDelegatorReward = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    return this.getSignedMessageTransaction(transaction, msgWithdrawDelegatorReward, rawTx);
  }

  public async signUndelegateTx(
    transaction: UndelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgUndelegate = new cro.staking.MsgUndelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(transaction, msgUndelegate, rawTx);
  }

  public async signRedelegateTx(
    transaction: RedelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgBeginRedelegate = new cro.staking.MsgBeginRedelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorSrcAddress: transaction.sourceValidatorAddress,
      validatorDstAddress: transaction.destinationValidatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(transaction, msgBeginRedelegate, rawTx);
  }

  async signNFTTransfer(transaction: NFTTransferUnsigned, decryptedPhrase: string) {
    const { cro, rawTx } = this.getTransactionInfo(decryptedPhrase, transaction);

    const msgTransferNFT = new cro.nft.MsgTransferNFT({
      id: transaction.tokenId,
      sender: transaction.sender,
      denomId: transaction.denomId,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction(transaction, msgTransferNFT, rawTx);
  }

  async signNFTMint(transaction: NFTMintUnsigned, decryptedPhrase: string) {
    const { cro, rawTx } = this.getTransactionInfo(decryptedPhrase, transaction);

    const msgMintNFT = new cro.nft.MsgMintNFT({
      id: transaction.tokenId,
      name: transaction.name,
      sender: transaction.sender,
      denomId: transaction.denomId,
      uri: transaction.uri,
      data: transaction.data,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction(transaction, msgMintNFT, rawTx);
  }

  async signNFTDenomIssue(transaction: NFTDenomIssueUnsigned, decryptedPhrase: string) {
    const { cro, rawTx } = this.getTransactionInfo(decryptedPhrase, transaction);

    const msgIssueDenom = new cro.nft.MsgIssueDenom({
      id: transaction.denomId,
      name: transaction.name,
      sender: transaction.sender,
      schema: transaction.schema,
    });

    return this.getSignedMessageTransaction(transaction, msgIssueDenom, rawTx);
  }

  async getSignedMessageTransaction(transaction: TransactionUnsigned, message: CosmosMsg, rawTx) {
    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));
    const signableTx = rawTx
      .appendMessage(message)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);
    const signature = await this.signerProvider.sign(bytesMessage);

    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public async signIBCTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfoData(phrase, transaction.memo);

    const millisToNanoSecond = 1_000_000;
    const timeout = (Date.now() + 60_000) * millisToNanoSecond;

    const msgSend = new cro.ibc.MsgTransfer({
      sender: transaction.fromAddress,
      sourceChannel: transaction.channel || '',
      sourcePort: transaction.port || '',
      timeoutTimestampInNanoSeconds: Long.fromValue(timeout),
      receiver: transaction.toAddress,
      token: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction(transaction, msgSend, rawTx);
  }
}
