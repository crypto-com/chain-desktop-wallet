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
}

export enum BridgeTransferDirection {
  CRONOS_TO_CRYPTO_ORG = 'CRONOS_TO_CRYPTO_ORG',
  CRYPTO_ORG_TO_CRONOS = 'CRYPTO_ORG_TO_CRONOS',
  ETH_TO_CRONOS = 'ETH_TO_CRONOS',
  CRONOS_TO_ETH = 'CRONOS_TO_ETH',
  NOT_SUPPORT = 'NOT_SUPPORT',
}

export const DefaultTestnetBridgeConfigs: {
  CRYPTO_ORG_TO_CRONOS: BridgeConfig;
  CRONOS_TO_CRYPTO_ORG: BridgeConfig;
} = {
  CRONOS_TO_CRYPTO_ORG: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
    bridgeNetworkConfigType: BridgeNetworkConfigType.TESTNET_BRIDGE,
    cronosBridgeContractAddress: '0x3368dD21c4136747a6569f98C55f5ec0a2D984B3',
    gasLimit: 200_000,
    // 5 Gwei
    defaultGasPrice: 5_000_000_000_000,
    prefix: 'tcrc',
  },
  CRYPTO_ORG_TO_CRONOS: {
    bridgeDirectionType: BridgeTransferDirection.CRYPTO_ORG_TO_CRONOS,
    bridgeNetworkConfigType: BridgeNetworkConfigType.TESTNET_BRIDGE,
    cronosBridgeContractAddress: '',
    bridgeChannel: 'channel-129',
    bridgePort: 'transfer',
    gasLimit: 300_000,
    prefix: 'tcrc',
    defaultGasPrice: 10,
  },
};

export const DefaultMainnetBridgeConfigs = {
  CRONOS_TO_CRYPTO_ORG: {
    bridgeDirectionType: BridgeTransferDirection.CRONOS_TO_CRYPTO_ORG,
    bridgeNetworkConfigType: BridgeNetworkConfigType.MAINNET_BRIDGE,
    cronosBridgeContractAddress: 'TO_BE_DECIDED',
    gasLimit: 200_000,
    // 5 Gwei
    defaultGasPrice: 5_000_000_000_000,
    prefix: 'crc',
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
  },
};
