import { getRecoil } from "recoil-nexus";
import { sessionState } from "../recoil/atom";
import { AnalyticsService } from "../service/analytics/AnalyticsService";

const useAnalytics = () => {
  const session = getRecoil(sessionState);
  const analyticsService = new AnalyticsService(session);
  return { analyticsService }
}


export { useAnalytics }; 
