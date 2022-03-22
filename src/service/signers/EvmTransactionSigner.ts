import { BigNumberish, ethers } from 'ethers';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { signTypedData_v4 } from 'eth-sig-util';
import { ITransactionSigner } from './TransactionSigner';
import TokenContractABI from './abi/TokenContractABI.json';

import {
  BridgeTransactionUnsigned,
  DelegateTransactionUnsigned,
  EVMContractCallUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';
import { UserAssetType } from '../../models/UserAsset';
import { walletService } from '../WalletService';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from '../LedgerService';
import { CronosClient } from '../cronos/CronosClient';
import { EVMChainConfig } from '../../models/Chain';
import { parseChainId } from '../evm/chainId';
import { IERC20__factory } from '../../contracts';

const DEFAULT_CHAIN_ID = 338;

class EvmTransactionSigner implements ITransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');
    const transferAsset = transaction.asset;

    const gasPriceBN = web3.utils.toBN(
      transaction.gasPrice || transferAsset?.config?.fee?.networkFee!,
    );

    const chainId = transaction?.asset?.config?.chainId || DEFAULT_CHAIN_ID;
    const txParams = {
      nonce: web3.utils.toHex(transaction.nonce || 0),
      gasPrice: web3.utils.toHex(gasPriceBN),
      gasLimit: transaction.gasLimit || transferAsset?.config?.fee?.gasLimit,
      to: transaction.toAddress,
      value: web3.utils.toHex(transaction.amount),
      data:
        transaction.memo && transaction.memo.length > 0
          ? web3.utils.utf8ToHex(transaction.memo)
          : '0x',
      chainId: Number(chainId),
    };

    const signedTx = await ethers.Wallet.fromMnemonic(phrase).signTransaction(txParams);
    return Promise.resolve(signedTx);
  }

  // eslint-disable-next-line class-methods-use-this
  public async sendContractCallTransaction(props: {
    chainConfig: EVMChainConfig,
    transaction: EVMContractCallUnsigned,
    phrase: string,
  }): Promise<string> {

    const { chainConfig, transaction, phrase } = props;

    const chainId = parseChainId(chainConfig);
    const rpcURL = chainConfig.rpcUrls[0];

    const currentSession = await walletService.retrieveCurrentSession();

    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      const device = createLedgerDevice();

      const walletAddressIndex = currentSession.wallet.addressIndex;

      const signedTx = await device.signEthTx(
        walletAddressIndex,
        chainId,
        transaction.nonce,
        transaction.gasLimit,
        transaction.gasPrice,
        transaction.contractAddress,
        transaction.value ?? '0x0',
        transaction.data,
      );
      const cronosClient = new CronosClient(rpcURL, "");

      const result = await cronosClient.broadcastRawTransactionHex(signedTx);

      return Promise.resolve(result);
    }

    const txParams: ethers.providers.TransactionRequest = {
      chainId,
      data: transaction.data,
      from: transaction.from,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      // maxFeePerGas: transaction.maxFeePerGas,
      // maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      nonce: transaction.nonce,
      to: transaction.contractAddress,
      value: transaction.value ?? '0x0',
    };

    const provider = new ethers.providers.JsonRpcProvider(rpcURL);
    const wallet = ethers.Wallet.fromMnemonic(phrase).connect(provider);

    const signedTx = await wallet.sendTransaction(txParams);
    return Promise.resolve(signedTx.hash);
  }

  static async signPersonalMessage(message: string, passphrase = ''): Promise<string> {
    const currentSession = await walletService.retrieveCurrentSession();

    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      const device = createLedgerDevice();

      const walletAddressIndex = currentSession.wallet.addressIndex;

      return await device.signPersonalMessage(walletAddressIndex, message);
    }

    const wallet = ethers.Wallet.fromMnemonic(passphrase);
    return await wallet.signMessage(ethers.utils.arrayify(message));
  }

  // ERC712 sign
  static async signTypedDataV4(message: string, passphrase = ''): Promise<string> {
    const currentSession = await walletService.retrieveCurrentSession();

    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      const device = createLedgerDevice();

      const walletAddressIndex = currentSession.wallet.addressIndex;

      return await device.signTypedDataV4(walletAddressIndex, message);
    }
    const wallet = ethers.Wallet.fromMnemonic(passphrase);
    const bufferedKey = Buffer.from(wallet.privateKey.replace(/^(0x)/, ''), 'hex');
    return signTypedData_v4(bufferedKey, { data: JSON.parse(message) });
  }

  public async signTokenTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');
    const transferAsset = transaction.asset;

    if (!transferAsset?.contractAddress) {
      throw new TypeError('The contract address is required to transfer tokens assets');
    }

    if (
      transferAsset?.assetType !== UserAssetType.CRC_20_TOKEN &&
      transferAsset?.assetType !== UserAssetType.ERC_20_TOKEN
    ) {
      throw new TypeError('The asset type is expected to be a CRC_20_TOKEN or ERC_20_TOKEN');
    }

    const gasPriceBN = web3.utils.toBN(
      transaction.gasPrice || transferAsset?.config?.fee?.networkFee!,
    );
    const encodedTokenTransfer = this.encodeTokenTransferABI(
      transferAsset.contractAddress,
      transaction,
    );

    const chainId = transaction?.asset?.config?.chainId || DEFAULT_CHAIN_ID;
    const txParams = {
      nonce: web3.utils.toHex(transaction.nonce || 0),
      gasPrice: web3.utils.toHex(gasPriceBN),
      gasLimit: transaction.gasLimit || transferAsset?.config?.fee?.gasLimit,
      to: transferAsset.contractAddress,
      value: 0,
      data: encodedTokenTransfer,
      chainId: Number(chainId),
    };

    const signedTx = await ethers.Wallet.fromMnemonic(phrase).signTransaction(txParams);
    return Promise.resolve(signedTx);
  }

  // eslint-disable-next-line class-methods-use-this
  public encodeTokenTransferABI(
    tokenContractAddress: string,
    transaction: TransferTransactionUnsigned,
  ) {
    const web3 = new Web3('');
    const contractABI = TokenContractABI.abi as AbiItem[];
    const contract = new web3.eth.Contract(contractABI, tokenContractAddress);
    return contract.methods.transfer(transaction.toAddress, transaction.amount).encodeABI();
  }

  // eslint-disable-next-line class-methods-use-this
  public encodeTokenApprovalABI(
    spender: string,
    amount: BigNumberish,
  ) {

    const IERC20 = IERC20__factory.createInterface()
    return IERC20.encodeFunctionData('approve', [spender, amount])
  }

  // eslint-disable-next-line class-methods-use-this
  public async signBridgeTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');

    const transferAsset = transaction.originAsset;
    const chainId = transaction?.asset?.config?.chainId || 338;

    const txParams = {
      nonce: web3.utils.toHex(transaction.nonce || 0),
      gasPrice: web3.utils.toHex(transaction.gasPrice || transferAsset?.config?.fee?.networkFee!),
      gasLimit: transaction.gasLimit,
      to: transaction.toAddress,
      value: web3.utils.toHex(transaction.amount),
      data: transaction.data,
      chainId: Number(chainId),
    };

    const signedTx = await ethers.Wallet.fromMnemonic(phrase).signTransaction(txParams);
    return Promise.resolve(signedTx);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  signDelegateTx(_: DelegateTransactionUnsigned, phrase: string): Promise<string> {
    return Promise.resolve('');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  signWithdrawStakingRewardTx(_: WithdrawStakingRewardUnsigned, phrase: string): Promise<string> {
    return Promise.resolve('');
  }
}

export { EvmTransactionSigner };
export const evmTransactionSigner = new EvmTransactionSigner();
