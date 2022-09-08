import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { HandlerDetails } from 'electron';
import { DappBrowserIPC } from '../types';
import {
  evmTransactionSigner,
  EvmTransactionSigner,
} from '../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../service/signers/TransactionSupported';
import { isHexEqual } from '../../../utils/utils';
import { TransactionDataParser } from './TransactionDataParser';
import { ErrorHandler, WebView } from './types';
import { useChainConfigs } from './useChainConfigs';
import { useCronosEvmAsset } from '../../../hooks/useCronosEvmAsset';
import { EVMChainConfig } from '../../../models/Chain';
import { getGasPrice } from '../../../service/evm/gas';
import { getNonce } from '../../../service/evm/nonce';
import { useRefCallback } from '../../../hooks/useRefCallback';

const remote = window.require('@electron/remote');

enum RPCErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  REQUESTED_CHAIN_NOT_ADDED = 4902,
} 

interface RPCError {
  code: RPCErrorCode;
  message: string;
}


export type ConfirmTransactionSuccessCallback = (info: {
  decryptedPhrase: string;
  gasPrice: BigNumber;
  gasLimit: BigNumber;
  signature: string;
}) => void;

interface IUseIPCProviderProps {
  webview: WebView | null;
  onRequestAddress: (onSuccess: (address: string) => void, onError: ErrorHandler) => void;
  onRequestTokenApproval: (
    event: DappBrowserIPC.TokenApprovalEvent,
    onSuccess: ConfirmTransactionSuccessCallback,
    onError: ErrorHandler,
  ) => void;
  onRequestSendTransaction: (
    event: DappBrowserIPC.SendTransactionEvent,
    onSuccess: ConfirmTransactionSuccessCallback,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignMessage: (
    event: DappBrowserIPC.SignMessageEvent,
    onSuccess: ConfirmTransactionSuccessCallback,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignPersonalMessage: (
    event: DappBrowserIPC.SignPersonalMessageEvent,
    onSuccess: ConfirmTransactionSuccessCallback,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignTypedMessage: (
    event: DappBrowserIPC.SignTypedMessageEvent,
    onSuccess: ConfirmTransactionSuccessCallback,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestEcRecover: (
    event: DappBrowserIPC.EcrecoverEvent,
    onSuccess: (address: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestWatchAsset: (
    event: DappBrowserIPC.WatchAssetEvent,
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestAddEthereumChain: (
    event: {
      chainConfig: EVMChainConfig;
    },
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSwitchEthereumChain: (
    event: {
      prev: EVMChainConfig;
      next: EVMChainConfig;
    },
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onFinishTransaction: (error?: string) => void;
}

export const useIPCProvider = (props: IUseIPCProviderProps) => {
  const { webview, onFinishTransaction } = props;
  const asset = useCronosEvmAsset();
  const [isDOMReady, setIsDOMReady] = useState(false);

  const [queuedMessages, setQueuedMessages] = useState<string[]>([]);

  const {
    list: chainConfigs,
    add: addChainConfig,
    setSelectedChain,
    selectedChain,
  } = useChainConfigs();

  useEffect(() => {
    if (!isDOMReady) {
      return;
    }

    if (queuedMessages.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const message of queuedMessages) {
        // eslint-disable-next-line no-await-in-loop
        execute(message);
      }

      setQueuedMessages([]);
    }
  }, [isDOMReady]);

  const execute = async (script: string) => {
    await webview?.executeJavaScript(
      `
          (function() {
              ${script}
          })();
          `,
    );
  };

  const executeJavScript = useRefCallback(
    async (script: string) => {
      if (!isDOMReady) {
        setQueuedMessages([...queuedMessages, script]);
        return;
      }

      execute(script);
    }
  );

  const injectDomReadyScript = useCallback(
    (chainConfig?: EVMChainConfig) => {
      executeJavScript.current(`
    window.onbeforeunload = function() {
      return;
    }
    `);

      if (!chainConfig) {
        // eslint-disable-next-line prefer-destructuring
        chainConfig = chainConfigs[0];
      }

      updateChainConfig(chainConfig);
    },
    [webview, chainConfigs, asset],
  );

  const sendError = (id: number, error: RPCError) => {
    executeJavScript.current(`
        window.ethereum.sendError(${id}, ${JSON.stringify(error)})
    `);
  };

  const sendResponse = (id: number, response?: string) => {
    if (response) {
      executeJavScript.current(`
          window.ethereum.sendResponse(${id}, "${response}")
      `);
    } else {
      executeJavScript.current(`
          window.ethereum.sendResponse(${id})
      `);
    }
  };

  useEffect(() => {
    injectDomReadyScript(selectedChain);
  }, [selectedChain]);

  const sendResponses = (id: number, responses: string[]) => {
    const script = responses.map(r => `'${r}'`).join(',');
    executeJavScript.current(`
        window.ethereum.sendResponse(${id}, [${script}])
    `);
  };

  const handleRequestAccounts = useRefCallback((id: number, address: string) => {
    executeJavScript.current(
      `
          window.ethereum.setAddress("${address}");
        `,
    );

    updateChainConfig(selectedChain);
    sendResponses(id, [address]);
  });

  const handleTokenApproval = useRefCallback(
    async (
      event: DappBrowserIPC.TokenApprovalEvent,
      mnemonic: string,
      _gasPrice: BigNumber,
      _gasLimit: BigNumber,
    ) => {
      const data = evmTransactionSigner.encodeTokenApprovalABI(
        event.object.spender,
        ethers.constants.MaxUint256,
      );

      const transaction: EVMContractCallUnsigned = {
        from: event.object.from,
        contractAddress: event.object.to,
        data,
        gasLimit: `0x${_gasLimit.toString(16)}`,
        gasPrice: `0x${_gasPrice.toString(16)}`,
        maxFeePerGas: event.object.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: event.object.maxPriorityFeePerGas ?? undefined,
        nonce: await getNonce(event.object.from, event.object.chainConfig),
      };
      try {
        const result = await EvmTransactionSigner.sendContractCallTransaction({
          chainConfig: event.object.chainConfig,
          transaction,
          mnemonic,
        });

        sendResponse(event.id, result);
      } catch (error) {
        sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: 'Transaction failed' });
      }

      onFinishTransaction();
    },
  );

  const handleSendTransaction = useRefCallback(
    async (
      event: DappBrowserIPC.SendTransactionEvent,
      mnemonic: string,
      _gasPrice: BigNumber,
      _gasLimit: BigNumber,
    ) => {
      const transaction: EVMContractCallUnsigned = {
        contractAddress: event.object.to,
        data: event.object.data,
        from: event.object.from,
        gasLimit: `0x${_gasLimit.toString(16)}`,
        gasPrice: `0x${_gasPrice.toString(16)}`,
        maxFeePerGas: event.object.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: event.object.maxPriorityFeePerGas ?? undefined,
        nonce: await getNonce(event.object.from, event.object.chainConfig),
        value: event.object.value,
      };

      try {
        const result = await EvmTransactionSigner.sendContractCallTransaction({
          chainConfig: event.object.chainConfig,
          transaction,
          mnemonic,
        });
        sendResponse(event.id, result);
        onFinishTransaction();
      } catch (error) {
        sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: (error as any).toString() });
        onFinishTransaction((error as any).toString());
      }
    },
  );

  const handleSignMessage = useRefCallback(
    async (eventId: number, data: string, passphrase: string) => {
      try {
        const sig = await EvmTransactionSigner.signPersonalMessage(data, passphrase);
        sendResponse(eventId, sig);
      } catch (error) {
        sendError(eventId, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: (error as any).toString() });
      }
    },
  );

  const handleSignTypedMessage = useRefCallback(
    async (event: DappBrowserIPC.SignTypedMessageEvent, passphrase: string) => {
      try {
        const sig = await EvmTransactionSigner.signTypedDataV4(event.object.raw, passphrase);
        sendResponse(event.id, sig);
      } catch (error) {
        sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: (error as any).toString() });
      }
    },
  );

  useEffect(() => {
    if (!webview) {
      return;
    }

    const ipcMessageHandler = async (e: Electron.IpcMessageEvent) => {
      const { channel, args } = e;

      if (channel !== DappBrowserIPC.ChannelName) {
        return;
      }

      if (args?.length < 1) {
        return;
      }

      const event: DappBrowserIPC.Event = args[0];

      switch (event.name) {
        case 'requestAccounts':
          props.onRequestAddress(
            address => {
              handleRequestAccounts.current(event.id, address);
            },
            reason => {
              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'sendTransaction':
          {
            // fill in gasData
            const gasObject = await getGasPrice(selectedChain, {
              from: event.object.from,
              to: event.object.to,
              data: event.object.data,
              value: ethers.BigNumber.from(event.object.value ? event.object.value : 0),
            });

            event.object.gasPrice = event.object?.gasPrice ?? gasObject.gasPrice;
            event.object.gas = event.object?.gas ?? gasObject.gasLimit;
            event.object.maxFeePerGas = gasObject.maxFeePerGas;
            event.object.maxPriorityFeePerGas = gasObject.maxPriorityFeePerGas;

            event.object.chainConfig = selectedChain;

            if (event.object.data.startsWith('0x095ea7b3')) {
              const parsedData = await TransactionDataParser.parseTokenApprovalData(
                selectedChain,
                event.object.to,
                event.object.data,
              );
              const approvalEvent: DappBrowserIPC.TokenApprovalEvent = {
                name: 'tokenApproval',
                id: event.id,
                object: {
                  tokenData: parsedData.tokenData,
                  amount: parsedData.amount,
                  spender: parsedData.spender,
                  ...event.object,
                },
              };
              props.onRequestTokenApproval(
                approvalEvent,
                info => {
                  handleTokenApproval.current(
                    approvalEvent,
                    info.decryptedPhrase,
                    info.gasPrice,
                    info.gasLimit,
                  );
                },
                reason => {
                  sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
                },
              );
            } else {
              props.onRequestSendTransaction(
                event,
                info => {
                  handleSendTransaction.current(
                    event,
                    info.decryptedPhrase,
                    info.gasPrice,
                    info.gasLimit,
                  );
                },
                reason => {
                  sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
                },
              );
            }
          }
          break;
        case 'signMessage':
          props.onRequestSignMessage(
            event,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _ => {

              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: 'Not implemented' });
            },
            reason => {

              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'signPersonalMessage':
          props.onRequestSignPersonalMessage(
            event,
            info => {
              handleSignMessage.current(event.id, event.object.data, info.decryptedPhrase);
            },
            reason => {
              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'signTypedMessage':
          props.onRequestSignTypedMessage(
            event,
            info => {
              handleSignTypedMessage.current(event, info.decryptedPhrase);
            },
            reason => {
              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'ecRecover':
          props.onRequestEcRecover(
            event,
            () => {
              new Web3('').eth.personal
                .ecRecover(event.object.message, event.object.signature)
                .then(
                  result => {
                    sendResponse(event.id, result);
                  },
                  reason => {
                    sendError(event.id, reason);
                  },
                );
            },
            reason => {
              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'watchAsset':
          props.onRequestWatchAsset(
            event,
            () => {},
            reason => {
              sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
            },
          );
          break;
        case 'addEthereumChain':
          {
            const foundConfig = chainConfigs.find(c => isHexEqual(c.chainId, event.object.chainId));

            if (foundConfig && isHexEqual(selectedChain.chainId, event.object.chainId)) {
              setSelectedChain(foundConfig);
              injectDomReadyScript(foundConfig);
              sendResponse(event.id, foundConfig.chainId);
              return;
            }

            if (foundConfig && selectedChain.chainId !== event.object.chainId) {
              props.onRequestSwitchEthereumChain(
                {
                  prev: selectedChain,
                  next: foundConfig,
                },
                () => {
                  setSelectedChain(foundConfig);
                  injectDomReadyScript(foundConfig);
                  sendResponse(event.id, foundConfig.chainId);
                },
                () => {
                  // no-op
                },
              );
              return;
            }

            const config = {
              chainId: event.object.chainId,
              rpcUrls: event.object.rpcUrls,
              blockExplorerUrls: event.object.blockExplorerUrls,
              chainName: event.object.chainName,
              nativeCurrency: event.object.nativeCurrency,
            };

            props.onRequestAddEthereumChain(
              { chainConfig: config },
              async () => {
                addChainConfig(config);

                props.onRequestSwitchEthereumChain(
                  {
                    prev: selectedChain,
                    next: config,
                  },
                  () => {
                    setSelectedChain(config);
                    injectDomReadyScript(config);
                    sendResponse(event.id, config.chainId);
                  },
                  () => {
                    // no-op
                  },
                );

                sendResponse(event.id);
              },
              reason => {
                sendError(event.id, { code: RPCErrorCode.USER_REJECTED_REQUEST, message: reason });
              },
            );
          }
          break;
        case 'switchEthereumChain':
          {
            const foundConfig = chainConfigs.find(c => isHexEqual(c.chainId, event.object.chainId));

            if (!foundConfig) {
              sendError(event.id, { code: RPCErrorCode.REQUESTED_CHAIN_NOT_ADDED, message: 'Chain not found' });
              return;
            }

            if (selectedChain.chainId !== event.object.chainId) {
              props.onRequestSwitchEthereumChain(
                {
                  prev: selectedChain,
                  next: foundConfig,
                },
                () => {
                  setSelectedChain(foundConfig);
                  injectDomReadyScript(foundConfig);
                  sendResponse(event.id, foundConfig.chainId);
                },
                () => {
                  // no-op
                },
              );
            } else {
              sendResponse(event.id, foundConfig.chainId);
            }
          }
          break;
        case 'openLinkInDefaultBrowser':
          {
            const { url } = event.object;
            const { shell } = window.require('electron');
            shell.openExternal(url);
          }
          break;
        default:
          break;
      }
    };

    webview.addEventListener('ipc-message', ipcMessageHandler);

    // eslint-disable-next-line consistent-return
    return () => {
      webview.removeEventListener('ipc-message', ipcMessageHandler);
    };
  }, [chainConfigs, webview, selectedChain]);

  const setupIPC = useCallback(() => {
    if (!webview) {
      return;
    }

    webview.addEventListener('new-window', e => {
      e.preventDefault();
      webview.loadURL(e.url);
    });

    webview.addEventListener('did-finish-load', () => {
      setIsDOMReady(true);

      injectDomReadyScript(selectedChain);
      if (process.env.NODE_ENV === 'development') {
        webview.openDevTools();
      }

      const webContents = remote.webContents.fromId(webview.getWebContentsId());
      webContents.setWindowOpenHandler((details: HandlerDetails) => {
        if (details.url.startsWith('http:') || details.url.startsWith('https:')) {
          webview.loadURL(details.url);
          return { action: 'allow', overrideBrowserWindowOptions: { show: false } };
        }
        return { action: 'deny' };
      });
    });

    updateChainConfig(selectedChain, true);
  }, [webview, selectedChain]);

  const updateChainConfig = (config: EVMChainConfig, emitChanged = false) => {
    executeJavScript.current(
      `
            var config = {
                address: '${asset?.address}',
                chainId: '${config.chainId}',
                rpcUrl: "${config.rpcUrls[0]}",
                isDebug: true
            };
            window.ethereum.setConfig(config, ${emitChanged});
        `,
    );
  };

  useEffect(() => {
    setupIPC();
  }, [setupIPC]);
};
