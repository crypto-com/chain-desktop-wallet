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

export enum BridgeTransferDirection {
  CRONOS_TO_CRYPTO_ORG = 'CRONOS_TO_CRYPTO_ORG',
  CRYPTO_ORG_TO_CRONOS = 'CRYPTO_ORG_TO_CRONOS',
  ETH_TO_CRONOS = 'ETH_TO_CRONOS',
  CRONOS_TO_ETH = 'CRONOS_TO_ETH',
  NOT_SUPPORT = 'NOT_SUPPORT',
}

const DefaultBridgeIndexingUrl = 'https://cronos.crypto.org/indexing/api/v1/bridges';
const DefaultTestnetBridgeIndexingUrl =
  'https://cronos.crypto.org/testnet3/indexing/api/v1/bridges';

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

export const DefaultMainnetBridgeConfigs = {
  CRONOS_TO_CRYPTO_ORG: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: 'TO_BE_DECIDED',
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
    bridgeChannel: 'channel-0',
    bridgePort: 'transfer',
    gasLimit: 300_000,
    defaultGasPrice: 10,
    bridgeIndexingUrl: DefaultBridgeIndexingUrl,
  },
};
