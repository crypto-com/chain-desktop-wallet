import {JSONStorage} from "node-localstorage";
import {app} from "electron";
import ua from "universal-analytics";
import { v4 as uuidv4 } from 'uuid';

const DEV_UA_CODE =  'UA-197149286-1'
const PROD_UA_CODE =  'UA-197252159-1'

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
    agent.event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
    }).send();
}

function transactionEvent(transactionId: string, value: string, transactionType: string) {
    agent.transaction(
        transactionId,
        value,
        '',
        '',
        transactionType)
        .item(value, 1)
        .send();
}

function pageView(pageName: string) {
    agent.pageview(pageName ).send()
}

module.exports = { getUACode, getGAnalyticsCode, actionEvent, transactionEvent, pageView };
