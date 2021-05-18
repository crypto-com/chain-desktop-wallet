import { v4 as uuidv4 } from 'uuid';
import ua from 'universal-analytics';
import { Session } from '../../models/Session';

const electron = window.require('electron');
const getUACode = electron.remote.getGlobal('getUACode');
const getGAnalyticsCode = electron.remote.getGlobal('getGAnalyticsCode');

export class AnalyticsService {
  private readonly userAgent: ua.Visitor | null = null;

  private readonly currentSession: Session;

  public constructor(session: Session) {
    this.userAgent = this.userAgent || AnalyticsService.initUA();
    this.currentSession = session;
  }

  public recordEvent(category: any, action: any, label: any, value: any) {
    if (this.currentSession.wallet.config.analyticsDisabled) {
      // DONT RECORD WHEN ANALYTICS IS DISABLED
      return;
    }
    this.userAgent
      ?.event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
      })
      .send();
  }

  // eslint-disable-next-line class-methods-use-this
  private static initUA() {
    const previousID = getUACode() || localStorage.getItem('userid');
    const userId = previousID || uuidv4();

    console.log('userId', userId !== previousID ? `New userid${userId}` : `Existing User${userId}`);

    localStorage.setItem('userid', userId);
    const trackingCode = getGAnalyticsCode();

    return ua(trackingCode, userId);
  }

  public transactionEvent(transactionId: string, value: string, transactionType: string) {
    if (this.currentSession.wallet.config.analyticsDisabled) {
      // DONT RECORD WHEN ANALYTICS IS DISABLED
      return;
    }
    this.userAgent
      ?.transaction(transactionId, value, '', '', transactionType)
      .item(value, 1)
      .send();
  }
}
