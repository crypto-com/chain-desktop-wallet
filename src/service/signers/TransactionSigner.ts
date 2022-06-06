import sdk from '@crypto-org-chain/chain-jslib';
import { CosmosMsg } from '@crypto-org-chain/chain-jslib/lib/dist/transaction/msg/cosmosMsg';
import Long from 'long';
import { Big, HDKey, Secp256k1KeyPair, Units } from '../../utils/ChainJsLib';
import { DEFAULT_IBC_TRANSFER_TIMEOUT, WalletConfig } from '../../config/StaticConfig';
import {
  RestakeStakingRewardTransactionUnsigned,
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
  WithdrawAllStakingRewardsUnsigned,
} from './TransactionSupported';

export interface ITransactionSigner {
  signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string>;

  signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string>;

  signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string>;
}

export class BaseTransactionSigner {
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
  }

  public getTransactionInfo(
    _phrase: string,
    transaction: TransactionUnsigned,
    gasFee: string,
    gasLimit: number,
  ) {
    return this.getTransactionInfoData(_phrase, transaction.memo, gasFee, gasLimit);
  }

  public getTransactionInfoData(_phrase: string, memo: string, gasFee: string, gasLimit: number) {
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

    const fee = new cro.Coin(gasFee, Units.BASE);

    rawTx.setFee(fee);
    rawTx.setGasLimit(gasLimit.toString());
    return { cro, rawTx, keyPair };
  }
}

export class TransactionSigner extends BaseTransactionSigner implements ITransactionSigner {
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction([msgSend], transaction, keyPair, rawTx);
  }

  public async signVoteTransaction(
    transaction: VoteTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgVote = new cro.gov.MsgVote({
      voter: transaction.voter,
      option: transaction.option,
      proposalId: Big(transaction.proposalID),
    });

    return this.getSignedMessageTransaction([msgVote], transaction, keyPair, rawTx);
  }

  public async signNFTTransfer(
    transaction: NFTTransferUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgTransferNFT = new cro.nft.MsgTransferNFT({
      id: transaction.tokenId,
      sender: transaction.sender,
      denomId: transaction.denomId,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction([msgTransferNFT], transaction, keyPair, rawTx);
  }

  public async signNFTMint(
    transaction: NFTMintUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgMintNFT = new cro.nft.MsgMintNFT({
      id: transaction.tokenId,
      name: transaction.name,
      sender: transaction.sender,
      denomId: transaction.denomId,
      uri: transaction.uri,
      data: transaction.data,
      recipient: transaction.recipient,
    });

    return this.getSignedMessageTransaction([msgMintNFT], transaction, keyPair, rawTx);
  }

  public async signNFTDenomIssue(
    transaction: NFTDenomIssueUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgIssueDenom = new cro.nft.MsgIssueDenom({
      id: transaction.denomId,
      name: transaction.name,
      sender: transaction.sender,
      schema: transaction.schema,
    });

    return this.getSignedMessageTransaction([msgIssueDenom], transaction, keyPair, rawTx);
  }

  public async signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);
    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    return this.getSignedMessageTransaction([msgDelegate], transaction, keyPair, rawTx);
  }

  public async signRestakeStakingRewardTx(
    transaction: RestakeStakingRewardTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);

    const msgWithdraw = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    return this.getSignedMessageTransaction(
      [msgWithdraw, msgDelegate],
      transaction,
      keyPair,
      rawTx,
    );
  }

  public async signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgWithdrawDelegatorReward = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    return this.getSignedMessageTransaction(
      [msgWithdrawDelegatorReward],
      transaction,
      keyPair,
      rawTx,
    );
  }

  public async signWithdrawAllStakingRewardsTx(
    transaction: WithdrawAllStakingRewardsUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgWithdrawAllDelegatorRewards = transaction.validatorAddressList.map(
      validatorAddress => {
        return new cro.distribution.MsgWithdrawDelegatorReward({
          delegatorAddress: transaction.delegatorAddress,
          validatorAddress,
        });
      },
    );

    return this.getSignedMessageTransaction(
      msgWithdrawAllDelegatorRewards,
      transaction,
      keyPair,
      rawTx,
    );
  }

  public async signUndelegateTx(
    transaction: UndelegateTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgUndelegate = new cro.staking.MsgUndelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction([msgUndelegate], transaction, keyPair, rawTx);
  }

  public async signRedelegateTx(
    transaction: RedelegateTransactionUnsigned,
    phrase: string,
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

    const msgBeginRedelegate = new cro.staking.MsgBeginRedelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorSrcAddress: transaction.sourceValidatorAddress,
      validatorDstAddress: transaction.destinationValidatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    return this.getSignedMessageTransaction([msgBeginRedelegate], transaction, keyPair, rawTx);
  }

  // eslint-disable-next-line class-methods-use-this
  async getSignedMessageTransaction(
    message: CosmosMsg[],
    transaction: TransactionUnsigned,
    keyPair,
    rawTx,
  ) {
    // Appending cosmos messages to raw transaction
    message.forEach(msg => {
      rawTx.appendMessage(msg);
    });

    const signableTx = rawTx
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
    gasFee: string,
    gasLimit: number,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction, gasFee, gasLimit);

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

    return this.getSignedMessageTransaction([msgSend], transaction, keyPair, rawTx);
  }
}
