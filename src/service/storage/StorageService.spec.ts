/**
 * @jest-environment node
 */
import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, NetworkName } from '../../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from '../WalletCreator';
import { StorageService } from './StorageService';
import { Session } from '../../models/Session';
import { SettingsDataUpdate, Wallet } from '../../models/Wallet';
import { getRandomId } from '../../crypto/RandomGen';
import { AssetMarketPrice, UserAsset, UserAssetType } from '../../models/UserAsset';
import { DerivationPathStandard } from '../signers/LedgerSigner';

async function buildTestWallet(name?: string) {
  const testNetConfig = DefaultWalletConfigs.TestNetConfig;

  const createOptions: WalletCreateOptions = {
    walletType: 'normal',
    config: testNetConfig,
    walletName: name || 'My-TestNet-Wallet',
    addressIndex: 0,
    derivationPathStandard: DerivationPathStandard.BIP44,
  };
  return (await new WalletCreator(createOptions).create()).wallet;
}

async function buildMainnetWallet(name?: string) {
  const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

  const createOptions: WalletCreateOptions = {
    walletType: 'normal',
    config: mainNetConfig,
    walletName: name || 'My-Mainnet-Wallet',
    addressIndex: 0,
    derivationPathStandard: DerivationPathStandard.BIP44,
  };
  return (await new WalletCreator(createOptions).create()).wallet;
}

describe('Testing Full Storage Service', () => {
  it('Test creating and storing a new wallet', async () => {
    const wallet = await buildTestWallet();
    const newWalletAddress = wallet.address;
    const walletIdentifier = wallet.identifier;

    const mockWalletStore = new StorageService(`test-wallet-storage-${getRandomId()}`);

    // Persist wallet in the db
    await mockWalletStore.saveWallet(wallet);

    const loadedWallet = await mockWalletStore.findWalletByIdentifier(walletIdentifier);
    expect(loadedWallet.name).to.eq('My-TestNet-Wallet');
    expect(loadedWallet.address).to.eq(newWalletAddress);
    expect(loadedWallet.config.network.chainId).to.eq('testnet-croeseid-2');
  });

  it('Test session storage ', async () => {
    const wallet = await buildTestWallet();
    const walletIdentifier = wallet.identifier;
    const session = new Session(wallet);

    const mockWalletStore = new StorageService(`test-session-storage-${getRandomId()}`);
    // Persist session in the db
    await mockWalletStore.setSession(session);

    const currentSession = await mockWalletStore.retrieveCurrentSession();
    expect(currentSession.wallet.name).to.eq('My-TestNet-Wallet');
    expect(currentSession.currency).to.eq('USD');
    expect(currentSession.wallet.identifier).to.eq(walletIdentifier);
    // eslint-disable-next-line no-underscore-dangle
    expect(currentSession._id).to.eq(Session.SESSION_ID);
  });

  it('Test loading all persisted wallets', async () => {
    const mockWalletStore = new StorageService(`test-load-all-${getRandomId()}`);
    for (let i = 0; i < 10; i++) {
      const wallet: Wallet = await buildTestWallet();
      mockWalletStore.saveWallet(wallet);
    }

    const fetchedWallets = await mockWalletStore.retrieveAllWallets();
    expect(fetchedWallets.length).to.eq(10);
  });

  it('Test updating wallet fees settings', async () => {
    const mockWalletStore = new StorageService(`test-update-wallet-fees-settings-${getRandomId()}`);
    const wallet: Wallet = await buildTestWallet();
    const walletId = wallet.identifier;
    await mockWalletStore.saveWallet(wallet);

    const newFee = {
      networkFee: '33000',
      gasLimit: '400000',
    };

    const nodeData: SettingsDataUpdate = {
      walletId,
      gasLimit: newFee.gasLimit,
      networkFee: newFee.networkFee,
    };
    await mockWalletStore.updateWalletSettings(nodeData);

    const updatedWalletConfig = await mockWalletStore.findWalletByIdentifier(walletId);

    expect(updatedWalletConfig.config.fee.networkFee).to.eq(newFee.networkFee);
    expect(updatedWalletConfig.config.fee.gasLimit).to.eq(newFee.gasLimit);

    const newFee2 = {
      networkFee: '38000',
      gasLimit: '480000',
    };

    const nodeData2: SettingsDataUpdate = {
      walletId,
      gasLimit: newFee2.gasLimit,
      networkFee: newFee2.networkFee,
    };
    await mockWalletStore.updateWalletSettings(nodeData2);

    const updatedWalletConfig2 = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig2.config.fee.networkFee).to.eq(newFee2.networkFee);
    expect(updatedWalletConfig2.config.fee.gasLimit).to.eq(newFee2.gasLimit);
  });

  it('Test updating wallet settings data', async () => {
    const mockWalletStore = new StorageService(`test-update-wallet-settings-${getRandomId()}`);
    const wallet: Wallet = await buildTestWallet();
    const walletId = wallet.identifier;

    await mockWalletStore.saveWallet(wallet);

    const newChainId = 'new-testnet-id-xv';
    const nodeData: SettingsDataUpdate = { walletId, chainId: newChainId };
    await mockWalletStore.updateWalletSettings(nodeData);

    const updatedWalletConfig = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig.config.network.chainId).to.eq(newChainId);
    expect(updatedWalletConfig.config.indexingUrl).to.eq(
      DefaultWalletConfigs.TestNetConfig.indexingUrl,
    );

    const newNodeUrl = 'https://testnet-new-croeseid.crypto-4.org';
    const newIndexingUrl = 'https://crossfire.crypto.org/api/v1/';
    const nodeData2: SettingsDataUpdate = {
      walletId,
      nodeUrl: newNodeUrl,
      indexingUrl: newIndexingUrl,
    };
    await mockWalletStore.updateWalletSettings(nodeData2);

    const updatedWalletConfig2 = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig2.config.nodeUrl).to.eq(newNodeUrl);
    expect(updatedWalletConfig2.config.network.defaultNodeUrl).to.eq(newNodeUrl);
    expect(updatedWalletConfig2.config.indexingUrl).to.eq(newIndexingUrl);

    const nodeData3: SettingsDataUpdate = {
      walletId,
      nodeUrl: 'https://another-new-node-url-test-1.com',
      chainId: 'another-new-chainId-test',
    };
    await mockWalletStore.updateWalletSettings(nodeData3);

    const updatedWalletConfig3 = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig3.config.nodeUrl).to.eq(nodeData3.nodeUrl);
    expect(updatedWalletConfig3.config.network.defaultNodeUrl).to.eq(nodeData3.nodeUrl);
    expect(updatedWalletConfig3.config.network.chainId).to.eq(nodeData3.chainId);
  });

  it('Test wallet config : Enable and Disable default memo', async () => {
    const mockWalletStore = new StorageService(`test-update-wallet-memo-settings-${getRandomId()}`);
    const wallet: Wallet = await buildTestWallet();
    const walletId = wallet.identifier;

    await mockWalletStore.saveWallet(wallet);
    await mockWalletStore.updateDisabledDefaultMemo({
      walletId,
      disableDefaultMemoAppend: true,
    });

    const updatedWalletConfig = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig.config.disableDefaultClientMemo).to.eq(true);

    await mockWalletStore.updateDisabledDefaultMemo({
      walletId,
      disableDefaultMemoAppend: false,
    });

    const updatedWalletConfig2 = await mockWalletStore.findWalletByIdentifier(walletId);
    expect(updatedWalletConfig2.config.disableDefaultClientMemo).to.eq(false);
  });

  it('Test assets storage', async () => {
    const mockWalletStore = new StorageService(`test-assets-storage-${getRandomId()}`);

    const WALLET_ID = '12dc3b3b90bc';
    const asset: UserAsset = {
      decimals: 8,
      mainnetSymbol: '',
      balance: '0',
      description: 'The best asset',
      icon_url: 'some url',
      identifier: 'cbd4bab2cbfd2b3',
      name: 'Best Asset',
      symbol: 'BEST',
      walletId: WALLET_ID,
      stakedBalance: '0',
      unbondingBalance: '0',
      rewardsBalance: '0',
    };

    await mockWalletStore.saveAsset(asset);
    const assets = await mockWalletStore.retrieveAssetsByWallet(WALLET_ID);

    expect(assets[0].balance).to.eq('0');
    expect(assets[0].identifier).to.eq('cbd4bab2cbfd2b3');
    expect(assets[0].symbol).to.eq('BEST');
    expect(assets.length).to.eq(1);

    /// Testing updating assets
    asset.balance = '250000'; // New balance

    await mockWalletStore.saveAsset(asset);
    const updatedAssets = await mockWalletStore.retrieveAssetsByWallet(WALLET_ID);
    expect(updatedAssets[0].balance).to.eq('250000');
    expect(updatedAssets[0].identifier).to.eq('cbd4bab2cbfd2b3');
    expect(updatedAssets[0].symbol).to.eq('BEST');
    expect(updatedAssets.length).to.eq(1);
  });

  it('Test asset market price storage', async () => {
    const mockWalletStore = new StorageService(`test-market-storage-${getRandomId()}`);

    const assetMarketPrice: AssetMarketPrice = {
      assetSymbol: 'CRO',
      assetType: UserAssetType.EVM,
      currency: 'USD',
      dailyChange: '-2.48',
      price: '0.071',
    };

    await mockWalletStore.saveAssetMarketPrice(assetMarketPrice);

    const fetchedAsset = await mockWalletStore.retrieveAssetPrice(UserAssetType.EVM, 'CRO', 'USD');

    expect(fetchedAsset.assetSymbol).to.eq('CRO');
    expect(fetchedAsset.currency).to.eq('USD');
    expect(fetchedAsset.price).to.eq('0.071');
    expect(fetchedAsset.dailyChange).to.eq('-2.48');

    fetchedAsset.price = '0.0981';
    fetchedAsset.dailyChange = '+10.85';

    await mockWalletStore.saveAssetMarketPrice(fetchedAsset);

    const updatedAsset = await mockWalletStore.retrieveAssetPrice(UserAssetType.EVM, 'CRO', 'USD');

    expect(updatedAsset.assetSymbol).to.eq('CRO');
    expect(updatedAsset.currency).to.eq('USD');
    expect(updatedAsset.price).to.eq('0.0981');
    expect(updatedAsset.dailyChange).to.eq('+10.85');
  });

  it('Testing transactions store', async () => {
    // const mockWalletStore = new StorageService(`test-transactions-storage-${getRandomId()}`);
    // const walletId = 'cbd4bab2cbfd2b3';
    // const transactionData: TransferTransactionData = {
    //   amount: '250400',
    //   assetSymbol: 'TCRO',
    //   date: 'Tue Dec 15 2020 11:27:54 GMT+0300 (East Africa Time)',
    //   hash: 'AFEBA2DE9891AF22040359C8AACEF2836E8BF1276D66505DE36559F3E912EFF8',
    //   memo: 'Hello ZX',
    //   receiverAddress: 'tcro172vcpddyavr3mpjrwx4p44h4vlncyj7g0mh06e',
    //   senderAddress: 'tcrocncl1nrztwwgrgjg4gtctgul80menh7p04n4vzy5dk3',
    //   status: TransactionStatus.PENDING,
    // };
    //
    // await walletService.saveTransfers({transactions: [], walletId: ""});
    //
    // const fetchedTxs = await mockWalletStore.retrieveAllTransferTransactions(walletId);
    //
    // expect(fetchedTxs.transactions[0].memo).to.eq('Hello ZX');
    // expect(fetchedTxs.transactions[0].date).to.eq(
    //   'Tue Dec 15 2020 11:27:54 GMT+0300 (East Africa Time)',
    // );
    // expect(fetchedTxs.transactions[0].senderAddress).to.eq(
    //   'tcrocncl1nrztwwgrgjg4gtctgul80menh7p04n4vzy5dk3',
    // );
    // expect(fetchedTxs.transactions[0].receiverAddress).to.eq(
    //   'tcro172vcpddyavr3mpjrwx4p44h4vlncyj7g0mh06e',
    // );
  });

  it('Test wallet deletion', async () => {
    const wallet = await buildTestWallet();
    const newWalletAddress = wallet.address;
    const walletIdentifier = wallet.identifier;

    const mockWalletStore = new StorageService(`test-wallet-deletion-${getRandomId()}`);

    // Persist wallet in the db
    await mockWalletStore.saveWallet(wallet);

    const loadedWallet = await mockWalletStore.findWalletByIdentifier(walletIdentifier);
    const allWallets = await mockWalletStore.retrieveAllWallets();

    expect(allWallets.length).to.gt(0);
    expect(allWallets.length).to.eq(1);

    expect(loadedWallet).to.not.eq(null);
    expect(loadedWallet.name).to.eq('My-TestNet-Wallet');
    expect(loadedWallet.address).to.eq(newWalletAddress);
    expect(loadedWallet.config.network.chainId).to.eq('testnet-croeseid-2');

    await mockWalletStore.deleteWallet(walletIdentifier);
    const loadedWalletAfterDeletion = await mockWalletStore.findWalletByIdentifier(
      walletIdentifier,
    );
    const allWalletsAfterDeletion = await mockWalletStore.retrieveAllWallets();

    expect(loadedWalletAfterDeletion).to.eq(null);
    expect(allWalletsAfterDeletion.length).to.lt(1);
    expect(allWalletsAfterDeletion.length).to.eq(0);
  });

  it('Test general settings enable/disable ', async () => {
    const walletTestnet1 = await buildTestWallet('My-TEST-WalletZZ');
    const walletTestnet1ID = walletTestnet1.identifier;

    const walletTestnet2 = await buildTestWallet('TheBestTestnetWalletZ');
    const walletTestnet3 = await buildTestWallet('TheTestnetWalletZ');

    const walletMainnet1 = await buildMainnetWallet('MainNetWalletX');
    const walletMainnet1ID = walletMainnet1.identifier;
    const walletMainnet2 = await buildMainnetWallet('MainNetWalletX22');

    const mockWalletStore = new StorageService(
      `test-general-settings-propagation-${getRandomId()}`,
    );

    await Promise.all([
      await mockWalletStore.saveWallet(walletTestnet1),
      await mockWalletStore.saveWallet(walletTestnet2),
      await mockWalletStore.saveWallet(walletTestnet3),

      await mockWalletStore.saveWallet(walletMainnet1),
      await mockWalletStore.saveWallet(walletMainnet2),
    ]);

    const allWalletsBefore = await mockWalletStore.retrieveAllWallets();
    // eslint-disable-next-line no-restricted-syntax
    for (const wallet of allWalletsBefore) {
      expect(wallet.config.enableGeneralSettings).to.eq(false);
    }

    // GeneralSettingsPropagation updated for TESTNET wallets
    await mockWalletStore.updateGeneralSettingsPropagation(NetworkName.TESTNET, true);

    const dataSettings: SettingsDataUpdate = {
      chainId: 'testnet-xxx-2',
      gasLimit: '330000',
      indexingUrl: 'https://cronos-pos.org/explorer/croeseid/api/v1/',
      networkFee: '12020',
      nodeUrl: 'https://www.new-node-url-croeseid.crypto.org',
      walletId: walletTestnet1ID,
    };

    await mockWalletStore.updateWalletSettings(dataSettings);
    const allWallets = await mockWalletStore.retrieveAllWallets();

    // eslint-disable-next-line no-restricted-syntax
    for (const wallet of allWallets) {
      if (wallet.config.name === NetworkName.TESTNET) {
        expect(wallet.config.enableGeneralSettings).to.eq(true);
        expect(wallet.config.network.chainId).to.eq('testnet-xxx-2');
        expect(wallet.config.fee.gasLimit).to.eq('330000');
        expect(wallet.config.fee.networkFee).to.eq('12020');
        expect(wallet.config.nodeUrl).to.eq('https://www.new-node-url-croeseid.crypto.org');
        expect(wallet.config.network.defaultNodeUrl).to.eq(
          'https://www.new-node-url-croeseid.crypto.org',
        );
      } else {
        expect(wallet.config.enableGeneralSettings).to.eq(false);
        expect(wallet.config).to.eqls(DefaultWalletConfigs.MainNetConfig);
      }
    }

    // GeneralSettingsPropagation now updated for MAINNET wallets
    await mockWalletStore.updateGeneralSettingsPropagation(NetworkName.MAINNET, true);
    const dataSettingsMainnet: SettingsDataUpdate = {
      chainId: 'MainnetZZ-ChainID',
      gasLimit: '3300022',
      indexingUrl: 'https://cronos-pos.org/explorer/mainnet/api/v1/',
      networkFee: '12022',
      nodeUrl: 'https://www.new-node-url-mainnet.crypto.org',
      walletId: walletMainnet1ID,
    };

    await mockWalletStore.updateWalletSettings(dataSettingsMainnet);
    const allWalletsAfterMainnetEnabledPropagation = await mockWalletStore.retrieveAllWallets();

    // eslint-disable-next-line no-restricted-syntax
    for (const wallet of allWalletsAfterMainnetEnabledPropagation) {
      expect(wallet.config.enableGeneralSettings).to.eq(true);
      if (wallet.config.name === NetworkName.MAINNET) {
        expect(wallet.config.network.chainId).to.eq('MainnetZZ-ChainID');
        expect(wallet.config.fee.gasLimit).to.eq('3300022');
        expect(wallet.config.fee.networkFee).to.eq('12022');
        expect(wallet.config.nodeUrl).to.eq('https://www.new-node-url-mainnet.crypto.org');
        expect(wallet.config.network.defaultNodeUrl).to.eq(
          'https://www.new-node-url-mainnet.crypto.org',
        );
      }

      if (wallet.config.name === NetworkName.TESTNET) {
        expect(wallet.config.enableGeneralSettings).to.eq(true);
        expect(wallet.config.network.chainId).to.eq('testnet-xxx-2');
        expect(wallet.config.fee.gasLimit).to.eq('330000');
        expect(wallet.config.fee.networkFee).to.eq('12020');
        expect(wallet.config.nodeUrl).to.eq('https://www.new-node-url-croeseid.crypto.org');
        expect(wallet.config.network.defaultNodeUrl).to.eq(
          'https://www.new-node-url-croeseid.crypto.org',
        );
      }
    }
  });
});
