import {JSONStorage} from "node-localstorage";
import {app} from "electron";
import ua from "universal-analytics";
import { v4 as uuidv4 } from 'uuid';
const isDev = process.env.NODE_ENV === 'development'; // change true, in developing mode

const path = app.getPath('userData');

console.log('analytics-path', path)

const nodeStorage = new JSONStorage(path);
const userId = nodeStorage.getItem('userid') || uuidv4();
nodeStorage.setItem('userid', userId);

const agent = ua('UA-197149286-1', userId);

function actionEvent(category: any, action: any, label: any, value: any) {
    // if (isDev) {
    //     return;
    // }
    agent.event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
    }).send();
}

module.exports = { actionEvent };
