import { v4 as uuidv4 } from 'uuid';
import ua from 'universal-analytics';

const electron = window.require('electron');
const getUACode = electron.remote.getGlobal('getUACode');
const getGAnalyticsCode = electron.remote.getGlobal('getGAnalyticsCode');

export class AnalyticsService {
  private userAgent: ua.Visitor | null = null;

  public constructor() {
    this.userAgent = this.userAgent || AnalyticsService.initUA();
  }

  public recordEvent(category: any, action: any, label: any, value: any) {
    console.log('### actionEvent was called', { agent: this.userAgent });
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
    this.userAgent
      ?.transaction(transactionId, value, '', '', transactionType)
      .item(value, 1)
      .send();
  }
}

export const analyticsService = new AnalyticsService();
