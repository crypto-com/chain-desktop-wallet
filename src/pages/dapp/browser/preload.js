// !! if you change the location of this file, remember to change `extraResources` in package.json as well !!
/* eslint-disable max-classes-per-file */
/* eslint-disable */
const { Buffer } = require('buffer');
const { ipcRenderer } = require('electron');
const EventEmitter = require('events');

class RPCServer {
  constructor(rpcUrl) {
    this.rpcUrl = rpcUrl;
  }

  getBlockNumber() {
    return this.call({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [] }).then(
      json => json.result,
    );
  }

  getBlockByNumber(number) {
    return this.call({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [number, false],
    }).then(json => json.result);
  }

  getFilterLogs(filter) {
    return this.call({ jsonrpc: '2.0', method: 'eth_getLogs', params: [filter] });
  }

  call(payload) {
    return fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(json => {
        if (!json.result && json.error) {
          console.log('<== rpc error', json.error);
          throw new Error(json.error.message || 'rpc error');
        }
        return json;
      });
  }
}

class Utils {
  static isUtf8(buf) {
    if (!buf) {
      return false;
    }
    var i = 0;
    var len = buf.length;
    while (i < len) {
      // UTF8-1 = %x00-7F
      if (buf[i] <= 0x7f) {
        i++;
        continue;
      }
      // UTF8-2 = %xC2-DF UTF8-tail
      if (buf[i] >= 0xc2 && buf[i] <= 0xdf) {
        // if(buf[i + 1] >= 0x80 && buf[i + 1] <= 0xBF) {
        if (buf[i + 1] >> 6 === 2) {
          i += 2;
          continue;
        } else {
          return false;
        }
      }
      // UTF8-3 = %xE0 %xA0-BF UTF8-tail
      // UTF8-3 = %xED %x80-9F UTF8-tail
      if (
        ((buf[i] === 0xe0 && buf[i + 1] >= 0xa0 && buf[i + 1] <= 0xbf) ||
          (buf[i] === 0xed && buf[i + 1] >= 0x80 && buf[i + 1] <= 0x9f)) &&
        buf[i + 2] >> 6 === 2
      ) {
        i += 3;
        continue;
      }
      // UTF8-3 = %xE1-EC 2( UTF8-tail )
      // UTF8-3 = %xEE-EF 2( UTF8-tail )
      if (
        ((buf[i] >= 0xe1 && buf[i] <= 0xec) || (buf[i] >= 0xee && buf[i] <= 0xef)) &&
        buf[i + 1] >> 6 === 2 &&
        buf[i + 2] >> 6 === 2
      ) {
        i += 3;
        continue;
      }
      // UTF8-4 = %xF0 %x90-BF 2( UTF8-tail )
      //          %xF1-F3 3( UTF8-tail )
      //          %xF4 %x80-8F 2( UTF8-tail )
      if (
        ((buf[i] === 0xf0 && buf[i + 1] >= 0x90 && buf[i + 1] <= 0xbf) ||
          (buf[i] >= 0xf1 && buf[i] <= 0xf3 && buf[i + 1] >> 6 === 2) ||
          (buf[i] === 0xf4 && buf[i + 1] >= 0x80 && buf[i + 1] <= 0x8f)) &&
        buf[i + 2] >> 6 === 2 &&
        buf[i + 3] >> 6 === 2
      ) {
        i += 4;
        continue;
      }
      return false;
    }
    return true;
  }

  static genId() {
    return new Date().getTime() + Math.floor(Math.random() * 1000);
  }

  static flatMap(array, func) {
    return [].concat(...array.map(func));
  }

  static intRange(from, to) {
    if (from >= to) {
      return [];
    }
    return new Array(to - from).fill().map((_, i) => i + from);
  }

  static hexToInt(hexString) {
    if (hexString === undefined || hexString === null) {
      return hexString;
    }
    return Number.parseInt(hexString, 16);
  }

  static intToHex(int) {
    if (int === undefined || int === null) {
      return int;
    }
    const hexString = int.toString(16);
    return `0x${hexString}`;
  }

  // message: Bytes | string
  static messageToBuffer(message) {
    let buffer = Buffer.from([]);
    try {
      if (typeof message === 'string') {
        buffer = Buffer.from(message.replace('0x', ''), 'hex');
      } else {
        buffer = Buffer.from(message);
      }
    } catch (err) {
      console.log(`messageToBuffer error: ${err}`);
    }
    return buffer;
  }

  static bufferToHex(buf) {
    return `0x${Buffer.from(buf).toString('hex')}`;
  }
}

class ProviderRpcError extends Error {
  constructor(code, message) {
    super();
    this.code = code;
    this.message = message;
  }

  toString() {
    return `${this.message} (${this.code})`;
  }
}

class IdMapping {
  constructor() {
    this.intIds = new Map();
  }

  tryIdentifyId(payload) {
    if (!payload.id) {
      payload.id = Utils.genId();
      return;
    }
    if (typeof payload.id !== 'number') {
      const newId = Utils.genId();
      this.intIds.set(newId, payload.id);
      payload.id = newId;
    }
  }

  tryRestoreId(payload) {
    const id = this.tryPopId(payload.id);
    if (id) {
      payload.id = id;
    }
  }

  tryPopId(id) {
    const originId = this.intIds.get(id);
    if (originId) {
      this.intIds.delete(id);
    }
    return originId;
  }
}

class Web3Provider extends EventEmitter {
  constructor(config) {
    super();
    this.setConfig(config);

    this.idMapping = new IdMapping();
    this.callbacks = new Map();
    this.wrapResults = new Map();
    this.isDesktopWallet = true;
    this.isDebug = !!config.isDebug;

    this.eth_requestAccounts({ id: -1 });
  }

  setAddress(address) {
    const lowerAddress = (address || '').toLowerCase();
    this.address = lowerAddress;
    this.ready = !!address;
    if (window.ethereum && window.ethereum.isDesktopWallet) {
      window.ethereum.address = lowerAddress;
      window.ethereum.ready = !!address;
    }
  }

  setConfig(config, emitChanged = false) {
    if (!config) {
      return;
    }

    this.setAddress(config.address);

    this.chainId = config.chainId;
    if (emitChanged) {
      this.emit('chainChanged', config.chainId);
    }
    this.rpc = new RPCServer(config.rpcUrl);
    this.isDebug = !!config.isDebug;
    this.emitConnect(config.chainId);
  }

  request(payload) {
    // this points to window in methods like web3.eth.getAccounts()
    let that = this;
    if (!(this instanceof Web3Provider)) {
      that = window.ethereum;
    }
    return that.requestInner(payload, false);
  }

  /**
   * @deprecated Listen to "connect" event instead.
   */
  // eslint-disable-next-line class-methods-use-this
  isConnected() {
    return true;
  }

  /**
   * @deprecated Use request({method: "eth_requestAccounts"}) instead.
   */
  enable() {
    console.log(
      'enable() is deprecated, please use window.ethereum.request({method: "eth_requestAccounts"}) instead.',
    );
    return this.request({ method: 'eth_requestAccounts', params: [] });
  }

  /**
   * @deprecated Use request() method instead.
   */
  send(payload) {
    const response = { jsonrpc: '2.0', id: payload.id };
    switch (payload.method) {
      case 'eth_accounts':
        response.result = this.eth_accounts();
        break;
      case 'eth_coinbase':
        response.result = this.eth_coinbase();
        break;
      case 'net_version':
        response.result = this.net_version();
        break;
      case 'eth_chainId':
        response.result = this.eth_chainId();
        break;
      default:
        throw new ProviderRpcError(
          4200,
          `DesktopWallet does not support calling ${payload.method} synchronously without a callback. Please provide a callback parameter to call ${payload.method} asynchronously.`,
        );
    }
    return response;
  }

  /**
   * @deprecated Use request() method instead.
   */
  sendAsync(payload, callback) {
    console.log(
      'sendAsync(data, callback) is deprecated, please use window.ethereum.request(data) instead.',
    );
    // this points to window in methods like web3.eth.getAccounts()
    let that = this;
    if (!(this instanceof Web3Provider)) {
      that = window.ethereum;
    }
    if (Array.isArray(payload)) {
      Promise.all(payload.map(that.requestInner.bind(that)))
        .then(data => callback(null, data))
        .catch(error => callback(error, null));
    } else {
      that
        .requestInner(payload)
        .then(data => callback(null, data))
        .catch(error => callback(error, null));
    }
  }

  /**
   * @private Internal rpc handler
   */
  requestInner(payload, wrapResult = true) {
    this.idMapping.tryIdentifyId(payload);
    if (this.isDebug) {
      console.log(`==> _request payload ${JSON.stringify(payload)}`);
    }
    return new Promise((resolve, reject) => {
      if (!payload.id) {
        payload.id = Utils.genId();
      }
      this.callbacks.set(payload.id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
      this.wrapResults.set(payload.id, wrapResult);

      console.log(payload);

      switch (payload.method) {
        case 'eth_accounts':
          return this.sendResponse(payload.id, this.eth_accounts());
        case 'eth_coinbase':
          return this.sendResponse(payload.id, this.eth_coinbase());
        case 'net_version':
          return this.sendResponse(payload.id, this.net_version());
        case 'eth_chainId':
          return this.sendResponse(payload.id, this.eth_chainId());
        case 'eth_sign':
          return this.eth_sign(payload);
        case 'personal_sign':
          return this.personal_sign(payload);
        case 'personal_ecRecover':
          return this.personal_ecRecover(payload);
        case 'eth_signTypedData_v3':
          return this.eth_signTypedData(payload, false);
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4':
          return this.eth_signTypedData(payload, true);
        case 'eth_sendTransaction':
          return this.eth_sendTransaction(payload);
        case 'eth_requestAccounts':
          return this.eth_requestAccounts(payload);
        case 'wallet_watchAsset':
          return this.wallet_watchAsset(payload);
        case 'wallet_addEthereumChain':
          return this.wallet_addEthereumChain(payload);
        case 'wallet_switchEthereumChain':
          return this.wallet_switchEthereumChain(payload);
        case 'eth_newFilter':
        case 'eth_newBlockFilter':
        case 'eth_newPendingTransactionFilter':
        case 'eth_uninstallFilter':
        case 'eth_subscribe':
          throw new ProviderRpcError(
            4200,
            `DesktopWallet does not support calling ${payload.method}. Please use your own solution`,
          );
        default:
          // call upstream rpc
          this.callbacks.delete(payload.id);
          this.wrapResults.delete(payload.id);
          return this.rpc
            .call(payload)
            .then(response => {
              if (this.isDebug) {
                console.log(`<== rpc response ${JSON.stringify(response)}`);
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              wrapResult ? resolve(response) : resolve(response.result);
            })
            .catch(reject);
      }
    });
  }

  emitConnect(chainId) {
    this.emit('connect', { chainId });
  }

  eth_accounts() {
    return this.address ? [this.address] : [];
  }

  eth_coinbase() {
    return this.address;
  }

  net_version() {
    return this.chainId.toString(10) || null;
  }

  eth_chainId() {
    return this.chainId;
  }

  eth_sign(payload) {
    const buffer = Utils.messageToBuffer(payload.params[1]);
    const hex = Utils.bufferToHex(buffer);
    if (Utils.isUtf8(buffer)) {
      this.postMessage('signPersonalMessage', payload.id, { data: hex });
    } else {
      this.postMessage('signMessage', payload.id, { data: hex });
    }
  }

  personal_sign(payload) {
    const message = payload.params[0];
    const buffer = Utils.messageToBuffer(message);
    if (buffer.length === 0) {
      // hex it
      const hex = Utils.bufferToHex(message);
      this.postMessage('signPersonalMessage', payload.id, { data: hex, params: payload.params });
    } else {
      this.postMessage('signPersonalMessage', payload.id, { data: message, params: payload.params });
    }
  }

  personal_ecRecover(payload) {
    this.postMessage('ecRecover', payload.id, {
      signature: payload.params[1],
      message: payload.params[0],
    });
  }

  eth_signTypedData(payload, useV4) {
    this.postMessage('signTypedMessage', payload.id, {
      raw: payload.params[1],
    });
  }

  eth_sendTransaction(payload) {
    this.postMessage('sendTransaction', payload.id, payload.params[0]);
  }

  eth_requestAccounts(payload) {
    this.postMessage('requestAccounts', payload.id, {});
  }

  wallet_watchAsset(payload) {
    const { options } = payload.params;
    this.postMessage('watchAsset', payload.id, {
      type: payload.type,
      contract: options.address,
      symbol: options.symbol,
      decimals: options.decimals || 0,
    });
  }

  wallet_addEthereumChain(payload) {
    this.postMessage('addEthereumChain', payload.id, payload.params[0]);
  }

  wallet_switchEthereumChain(payload) {
    this.postMessage('switchEthereumChain', payload.id, payload.params[0]);
  }

  /**
   * @private Internal js -> native message handler
   */
  postMessage(handler, id, data) {
    if (this.ready || handler === 'requestAccounts') {
      const object = {
        id,
        name: handler,
        object: data,
      };
      if (window.desktopWallet.postMessage) {
        window.desktopWallet.postMessage(object);
      } else {
        // old clients
        window.webkit.messageHandlers[handler].postMessage(object);
      }
    } else {
      // don't forget to verify in the app
      this.sendError(id, new ProviderRpcError(4100, 'provider is not ready'));
    }
  }

  /**
   * @private Internal native result -> js
   */
  sendResponse(id, result) {
    const originId = this.idMapping.tryPopId(id) || id;
    const callback = this.callbacks.get(id);
    const wrapResult = this.wrapResults.get(id);
    const data = { jsonrpc: '2.0', id: originId };
    if (typeof result === 'object' && result.jsonrpc && result.result) {
      data.result = result.result;
    } else {
      data.result = result;
    }
    if (this.isDebug) {
      console.log(
        `<== sendResponse id: ${id}, result: ${JSON.stringify(result)}, data: ${JSON.stringify(
          data,
        )}`,
      );
    }
    if (callback) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      wrapResult ? callback(null, data) : callback(null, result);
      this.callbacks.delete(id);
    } else {
      console.log(`callback id: ${id} not found`);
      try {
        if (window.ethereum.callbacks.has(id)) {
          window.ethereum.sendResponse(id, result);
        }
      } catch (error) {
        console.log(`send response to frame error: ${error}`);
      }
    }
  }

  /**
   * @private Internal native error -> js
   */
  sendError(id, error) {
    console.log(`<== ${id} sendError ${error}`);
    const callback = this.callbacks.get(id);
    if (callback) {
      callback(error instanceof Error ? error : new ProviderRpcError(4001, error), null);
      this.callbacks.delete(id);
    }
  }
}

window.desktopWallet = {
  Provider: Web3Provider,
  postMessage: arg => {
    ipcRenderer.sendToHost('dapp', arg);
  },
};

const providerConfig = {
  chainId: '0x19',
  address: '',
  rpcUrl: 'https://evm.cronos.org',
  isDebug: true,
};
window.ethereum = new window.desktopWallet.Provider(providerConfig);
