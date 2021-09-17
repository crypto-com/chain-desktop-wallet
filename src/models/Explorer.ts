import { UserAssetConfig } from './UserAsset';
import { WalletConfig } from '../config/StaticConfig';

export class Explorer {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}

export const renderExplorerUrl = (config: WalletConfig | UserAssetConfig, page: string) => {
  const { explorer, explorerUrl } = config;
  let url = '';

  if (explorer) {
    switch (page) {
      case 'tx':
        url = explorer.tx;
        break;
      case 'address':
        url = explorer.address;
        break;
      case 'validator':
        url = explorer.validator;
        break;
      default:
        url = explorer.baseUrl;
    }
  } else {
    switch (page) {
      case 'tx':
        url = `${explorerUrl}/tx`;
        break;
      case 'address':
        url = `${explorerUrl}/account`;
        break;
      case 'validator':
        url = `${explorerUrl}/validator`;
        break;
      default:
        url = `${explorerUrl}`;
    }
  }
  return url;
};
