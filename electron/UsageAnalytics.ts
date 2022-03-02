import { JSONStorage } from "node-localstorage";
import { app } from "electron";
import ua from "universal-analytics";
import { v4 as uuidv4 } from 'uuid';

// Public UA codes
const DEV_UA_CODE = 'UA-197149286-1'
const PROD_UA_CODE = 'UA-99317940-17'

function getGAnalyticsCode() {
    const isDev = process.env.NODE_ENV === 'development';
    return isDev ? DEV_UA_CODE : PROD_UA_CODE
}


const path = app.getPath('userData');

const nodeStorage = new JSONStorage(path);
const userId = nodeStorage.getItem('userid') || uuidv4();

nodeStorage.setItem('userid', userId);

const trackingCode = getGAnalyticsCode()

const agent = ua(trackingCode, userId);

function getUACode() {
    return nodeStorage.getItem('userid') || uuidv4();
}

function actionEvent(category: any, action: any, label: any, value: any) {
    try {
        agent.event({
            ec: category,
            ea: action,
            el: label,
            ev: value,
        }).send();
    } catch (e) { }
}

function transactionEvent(transactionId: string, value: string, transactionType: string) {
    try {
        agent.transaction(
            transactionId,
            value,
            '',
            '',
            transactionType)
            .item(value, 1)
            .send();
    } catch (e) { }
}

function pageView(pageName: string) {
    try {
        agent.pageview(pageName).send()
    } catch (e) { }
}

export { getUACode, getGAnalyticsCode, actionEvent, transactionEvent, pageView };
