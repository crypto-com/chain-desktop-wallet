import { BigNumberish, ethers } from 'ethers';
import Web3 from 'web3';
import { AbiItem, toHex, utf8ToHex } from 'web3-utils';
import { signTypedData_v4 } from 'eth-sig-util';
import { ITransactionSigner } from './TransactionSigner';
import TokenContractABI from './abi/TokenContractABI.json';
import CRC721TokenContractABI from '../../contracts/CRC721.json';

import {
  BridgeTransactionUnsigned,
  DelegateTransactionUnsigned,
  EVMContractCallUnsigned,
  EVMNFTTransferUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { walletService } from '../WalletService';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from '../LedgerService';
import { CronosClient } from '../cronos/CronosClient';
import { EVMChainConfig } from '../../models/Chain';
import { parseChainId } from '../evm/chainId';
import { IERC20__factory } from '../../contracts';
import { DerivationPathStandard } from './LedgerSigner';

const DEFAULT_CHAIN_ID = 338;
const DEFAULT_PROVIDER = 'http://localhost:8545';

class EvmTransactionSigner implements ITransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const transferAsset = transaction.asset;

    const gasPriceBN = ethers.BigNumber.from(
      transferAsset?.config?.fee?.networkFee! || (transaction.gasPrice ?? '0'),
    );

    const chainId = transaction?.asset?.config?.chainId || DEFAULT_CHAIN_ID;
    const txParams: ethers.providers.TransactionRequest = {
      nonce: toHex(transaction.nonce || 0),
      gasPrice: gasPriceBN.toHexString(),
      gasLimit: parseInt(transferAsset?.config?.fee?.gasLimit ?? '0') || transaction.gasLimit,
      to: transaction.toAddress,
      value: ethers.BigNumber.from(transaction.amount),
      data:
        transaction.memo && transaction.memo.length > 0
          ? utf8ToHex(transaction.memo)
          : '0x',
      chainId: Number(chainId),
    };

    const signedTx = await ethers.Wallet.fromMnemonic(phrase).signTransaction(txParams);
    return Promise.resolve(signedTx);
  }


  static async signContractCallTransaction(props: {    chainConfig: EVMChainConfig,
    transaction: EVMContractCallUnsigned,
    mnemonic: string}) {

    const { chainConfig, transaction, mnemonic } = props;

    const chainId = parseChainId(chainConfig);
    const rpcURL = chainConfig.rpcUrls[0];

    const currentSession = await walletService.retrieveCurrentSession();

    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      const device = createLedgerDevice();

      const walletAddressIndex = currentSession.wallet.addressIndex;
      const walletDerivationPathStandard = currentSession.wallet.derivationPathStandard ?? DerivationPathStandard.BIP44;

      const signedTx = await device.signEthTx(
        walletAddressIndex,
        walletDerivationPathStandard,
        chainId,
        transaction.nonce,
        transaction.gasLimit,
        transaction.gasPrice,
        transaction.contractAddress,
        transaction.value ?? '0x0',
        transaction.data,
      );

      return signedTx;
    }

    const txRequest: ethers.providers.TransactionRequest = {
      chainId,
      data: transaction.data,
      from: transaction.from,
      gasLimit: transaction.gasLimit,
      nonce: transaction.nonce,
      to: transaction.contractAddress,
      value: transaction.value ?? '0x0',
    };

    if (transaction.maxFeePerGas && transaction.maxPriorityFeePerGas) {
      txRequest.maxFeePerGas = transaction.maxFeePerGas;
      txRequest.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
      txRequest.type = 2;
    } else {
      txRequest.gasPrice = transaction.gasPrice;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcURL);
    const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);

    return await wallet.signTransaction(txRequest);
  
  }

  // eslint-disable-next-line class-methods-use-this
  static async sendContractCallTransaction(props: {
    chainConfig: EVMChainConfig,
    transaction: EVMContractCallUnsigned,
    mnemonic: string,
  }): Promise<string> {
    const { chainConfig } = props;
    const rpcURL = chainConfig.rpcUrls[0];

    const cronosClient = new CronosClient(rpcURL, chainConfig.rpcUrls[0]);
    const signedTx = await this.signContractCallTransaction(props);

    const result = await cronosClient.broadcastRawTransactionHex(signedTx);

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  public async sendCall(
    asset: UserAsset,
    payload: ethers.providers.TransactionRequest,
    jsonRpcUrl: string,
  ): Promise<string> {
    if (!asset.address || !asset.config?.nodeUrl) {
      throw TypeError(`Missing asset config: ${asset.config}`);
    }

    const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);

    const response = await provider.call(payload);

    return Promise.resolve(response);
  }

  static async signPersonalMessage(message: string, passphrase = ''): Promise<string> {
    const currentSession = await walletService.retrieveCurrentSession();

    if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
      const device = createLedgerDevice();

      const walletAddressIndex = currentSession.wallet.addressIndex;
      const walletDerivationPathStandard = currentSession.wallet.derivationPathStandard ?? DerivationPathStandard.BIP44;

      return await device.signPersonalMessage(walletAddressIndex, walletDerivationPathStandard, message);
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
      const walletDerivationPathStandard = currentSession.wallet.derivationPathStandard ?? DerivationPathStandard.BIP44;

      return await device.signTypedDataV4(walletAddressIndex, walletDerivationPathStandard, message);
    }
    const wallet = ethers.Wallet.fromMnemonic(passphrase);
    const bufferedKey = Buffer.from(wallet.privateKey.replace(/^(0x)/, ''), 'hex');
    return signTypedData_v4(bufferedKey, { data: JSON.parse(message) });
  }

  public async signTokenTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
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

    const gasPriceBN = ethers.BigNumber.from(
      transaction.gasPrice || transferAsset?.config?.fee?.networkFee!,
    );
    const encodedTokenTransfer = this.encodeTokenTransferABI(
      transferAsset.contractAddress,
      transaction,
    );

    const chainId = transaction?.asset?.config?.chainId || DEFAULT_CHAIN_ID;
    const txParams = {
      nonce: toHex(transaction.nonce || 0),
      gasPrice: gasPriceBN.toHexString(),
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
    const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_PROVIDER));
    const contractABI = TokenContractABI.abi as AbiItem[];
    const contract = new web3.eth.Contract(contractABI, tokenContractAddress);
    return contract.methods.transfer(transaction.toAddress, transaction.amount).encodeABI();
  }

  // eslint-disable-next-line class-methods-use-this
  public encodeTokenApprovalABI(
    spender: string,
    amount: BigNumberish,
  ) {

    const IERC20 = IERC20__factory.createInterface();
    return IERC20.encodeFunctionData('approve', [spender, amount]);
  }

  // eslint-disable-next-line class-methods-use-this
  public encodeNFTTransferABI(tokenContractAddress: string, transaction: EVMNFTTransferUnsigned) {
    const web3 = new Web3(new Web3.providers.HttpProvider(DEFAULT_PROVIDER));
    const contractABI = CRC721TokenContractABI.abi as AbiItem[];
    const contract = new web3.eth.Contract(contractABI, tokenContractAddress);
    return contract.methods
      .safeTransferFrom(transaction.sender, transaction.recipient, transaction.tokenId)
      .encodeABI() as string;
  }

  // eslint-disable-next-line class-methods-use-this
  public getNFTSafeTransferFromEstimatedGas(
    asset: UserAsset,
    tokenContractAddress: string,
    transaction: EVMNFTTransferUnsigned,
  ) {
    if (!asset.config?.nodeUrl) {
      throw new TypeError('Missing config Node URL');
    }
    const web3 = new Web3(new Web3.providers.HttpProvider(asset.config.nodeUrl));
    const contractABI = CRC721TokenContractABI.abi as AbiItem[];
    const contract = new web3.eth.Contract(contractABI, tokenContractAddress);
    return contract.methods
      .safeTransferFrom(transaction.sender, transaction.recipient, transaction.tokenId)
      .estimateGas();
  }

  // eslint-disable-next-line class-methods-use-this
  public async signBridgeTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const transferAsset = transaction.originAsset;
    const chainId = transaction?.asset?.config?.chainId || 338;

    const txParams = {
      nonce: toHex(transaction.nonce || 0),
      gasPrice: ethers.BigNumber.from(transaction.gasPrice || transferAsset?.config?.fee?.networkFee!).toHexString(),
      gasLimit: transaction.gasLimit,
      to: transaction.toAddress,
      value: ethers.BigNumber.from(transaction.amount),
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
