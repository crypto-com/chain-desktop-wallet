import { SupportedChainName } from '../../config/StaticConfig';

export enum BridgeNetworkConfigType {
  MAINNET_BRIDGE = 'MAINNET_BRIDGE',
  TESTNET_BRIDGE = 'TESTNET_BRIDGE',
}

export interface BridgeConfig {
  prefix: string;
  bridgeDirectionType: BridgeTransferDirection;
  bridgeNetworkConfigType: BridgeNetworkConfigType;
  gasLimit: number;
  defaultGasPrice: number;
  cronosBridgeContractAddress: string;
  bridgeChannel?: string;
  bridgePort?: string;
  bridgeIndexingUrl?: string;
}

export interface BridgeTxHistoryAddressQuery { 
  cronosEvmAddress?: string;
  cronosTendermintAddress?: string;
  cosmosHubTendermintAddress?: string;
}

export enum BridgeTransferDirection {
  CRONOS_TO_CRYPTO_ORG = 'CRONOS_TO_CRYPTO_ORG',
  CRYPTO_ORG_TO_CRONOS = 'CRYPTO_ORG_TO_CRONOS',
  ETH_TO_CRONOS = 'ETH_TO_CRONOS',
  CRONOS_TO_ETH = 'CRONOS_TO_ETH',
  COSMOS_HUB_TO_CRONOS = 'COSMOS_HUB_TO_CRONOS',
  CRONOS_TO_COSMOS_HUB = 'CRONOS_TO_COSMOS_HUB',
  NOT_SUPPORT = 'NOT_SUPPORT',
}

export const SUPPORTED_ASSETS_BY_BRIDGE_DIRECTION = new Map<BridgeTransferDirection, string[]>();
SUPPORTED_ASSETS_BY_BRIDGE_DIRECTION.set(BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG, ['CRO']);
SUPPORTED_ASSETS_BY_BRIDGE_DIRECTION.set(BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS, ['CRO']);
SUPPORTED_ASSETS_BY_BRIDGE_DIRECTION.set(BridgeTransferDirection.COSMOS_HUB_TO_CRONOS, ['ATOM']);
SUPPORTED_ASSETS_BY_BRIDGE_DIRECTION.set(BridgeTransferDirection.CRONOS_TO_COSMOS_HUB, ['ATOM']);


export interface SupportedBridge {
  value: string;
  label: string;
}

export const SUPPORTED_BRIDGE = new Map<string, SupportedBridge>();
SUPPORTED_BRIDGE.set('CRONOS', { value: 'CRONOS', label: SupportedChainName.CRONOS });
SUPPORTED_BRIDGE.set('CRYPTO_ORG', {
  value: 'CRYPTO_ORG',
  label: SupportedChainName.CRYPTO_ORG,
});
SUPPORTED_BRIDGE.set('COSMOS_HUB', {
  value: 'COSMOS_HUB',
  label: SupportedChainName.COSMOS_HUB,
});

export const SUPPORTED_BRIDGE_BY_CHAIN = new Map<string, SupportedBridge[]>();
SUPPORTED_BRIDGE_BY_CHAIN.set('CRYPTO_ORG', 
  [
    SUPPORTED_BRIDGE.get('CRONOS')!,
  ]
);
SUPPORTED_BRIDGE_BY_CHAIN.set('CRONOS', 
  [
    SUPPORTED_BRIDGE.get('CRYPTO_ORG')!,
    SUPPORTED_BRIDGE.get('COSMOS_HUB')!,
  ]
);
SUPPORTED_BRIDGE_BY_CHAIN.set('COSMOS_HUB', 
  [
    SUPPORTED_BRIDGE.get('CRONOS')!,
  ]
);

const DefaultTestnetBridgeIndexingUrl = 'https://cronos.org/testnet3/indexing/api/v1/bridges';
export const DefaultTestnetBridgeConfigs: {
  CRYPTO_ORG_TO_CRONOS: BridgeConfig;
  CRONOS_TO_CRYPTO_ORG: BridgeConfig;
} = {
  CRONOS_TO_CRYPTO_ORG: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
    bridgeNetworkConfigType: BridgeNetworkConfigType.TESTNET_BRIDGE,
    cronosBridgeContractAddress: '0x44b8c54d95906D6b223dAE5E038cB8EF4ef45aE5',
    gasLimit: 30_000,
    // 5 Gwei
    defaultGasPrice: 5_000_000_000_000,
    prefix: 'tcrc',
    bridgeIndexingUrl: DefaultTestnetBridgeIndexingUrl,
  },
  CRYPTO_ORG_TO_CRONOS: {
    bridgeDirectionType: BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS,
    bridgeNetworkConfigType: BridgeNetworkConfigType.TESTNET_BRIDGE,
    cronosBridgeContractAddress: '',
    bridgeChannel: 'channel-131',
    bridgePort: 'transfer',
    gasLimit: 300_000,
    prefix: 'tcrc',
    defaultGasPrice: 10,
    bridgeIndexingUrl: DefaultTestnetBridgeIndexingUrl,
  },
};

const DefaultBridgeIndexingUrl = 'https://cronos.org/indexing/api/v1/bridges';
export const DefaultMainnetBridgeConfigs = {
  CRONOS_TO_CRYPTO_ORG: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: '0x6b1b50c2223eb31E0d4683b046ea9C6CB0D0ea4F',
    gasLimit: 30_000,
    // 5 Gwei
    defaultGasPrice: 5_000_000_000_000,
    prefix: 'crc',
    bridgeIndexingUrl: DefaultBridgeIndexingUrl,
  },
  CRYPTO_ORG_TO_CRONOS: {
    bridgeDirectionType: BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: '',
    prefix: 'crc',
    bridgeChannel: 'channel-44',
    bridgePort: 'transfer',
    gasLimit: 300_000,
    defaultGasPrice: 10,
    bridgeIndexingUrl: DefaultBridgeIndexingUrl,
  },
  COSMOS_HUB_TO_CRONOS: {
    bridgeDirectionType: BridgeTransferDirection.COSMOS_HUB_TO_CRONOS,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: '0xB888d8Dd1733d72681b30c00ee76BDE93ae7aa93',
    gasLimit: 30_000,
    defaultGasPrice: 5_000_000_000_000,
    prefix: 'crc',
    bridgeIndexingUrl: DefaultBridgeIndexingUrl,
  },
  CRONOS_TO_COSMOS_HUB: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_COSMOS_HUB,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: '',
    prefix: 'crc',
    bridgeChannel: 'channel-241',
    bridgePort: 'transfer',
    gasLimit: 300_000,
    defaultGasPrice: 10,
    bridgeIndexingUrl: DefaultBridgeIndexingUrl,
  },
};
