import { Session } from '../../models/Session';

const remote = window.require('@electron/remote');

// Load all analytics functions from the main electron process
const transactionEvent = remote.getGlobal('transactionEvent');
const actionEvent = remote.getGlobal('actionEvent');
const pageView = remote.getGlobal('pageView');

export enum AnalyticsTxType {
  TransferTransaction = 'TransferTransaction',
  StakingTransaction = 'StakingTransaction',
  NftTransaction = 'NftTransaction',
  BridgeTransaction = 'BridgeTransaction',
}

export enum AnalyticsActions {
  FundsTransfer = 'FundsTransfer',
  FundsStaked = 'FundsStaked',
  NftTransfer = 'NftTransfer',
  NftIssue = 'NftIssue',
  NftMint = 'NftMint',
  BridgeTransfer = 'BridgeTransfer',
}

export enum AnalyticsCategory {
  Transfer = 'Transfer',
  Delegate = 'Delegate',
  PageView = 'PageView',
  Voting = 'Voting',
  Nft = 'Nft',
  Bridge = 'Bridge',
  DApp = 'Browsing',
  Settings = 'Settings'
}

export class AnalyticsService {
  private readonly currentSession: Session;

  public constructor(session: Session) {
    this.currentSession = session;
  }

  // eslint-disable-next-line class-methods-use-this
  public logTransactionEvent(
    txHash: string,
    txAmount: string,
    analyticsTxType: AnalyticsTxType,
    analyticsAction: AnalyticsActions,
    analyticsCategory: AnalyticsCategory,
  ) {
    if (this.currentSession.wallet.config.analyticsDisabled) {
      // DONT RECORD WHEN ANALYTICS IS DISABLED
      return;
    }

    try {
      actionEvent(
        analyticsTxType.toString(),
        analyticsCategory.toString(),
        analyticsAction.toString(),
        txAmount,
      );

      transactionEvent(txHash, txAmount, analyticsTxType.toString());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error logging event', e);
    }
  }

  public logCustomizeGas(chain: string) {
    try {
      if (this.currentSession.wallet.config.analyticsDisabled) {
        return;
      }

      actionEvent(
        'CustomizeGas',
        AnalyticsCategory.Settings,
        chain,
        0
      );
    } catch (e) {
      // no-op 
    }
  }

  public logBrowserDomain(domain: string) {
    try {
      if (this.currentSession.wallet.config.analyticsDisabled) {
        // DONT RECORD WHEN ANALYTICS IS DISABLED
        return;
      }

      if (domain) {
        actionEvent('DAppBrowser', AnalyticsCategory.DApp, domain, 0);
      }
    } catch (e) {
      // Ignore
    }
  }

  public logPage(pageName: string) {
    try {
      if (this.currentSession.wallet.config.analyticsDisabled) {
        // DONT RECORD WHEN ANALYTICS IS DISABLED
        return;
      }

      pageView(pageName).send();
    } catch (e) {
      // Ignore
    }
  }
}
