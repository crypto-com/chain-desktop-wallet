import { useCallback, useEffect, useMemo } from 'react';
import { TransactionConfig } from 'web3-eth';
import { useRecoilValue } from 'recoil';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { TransactionPrepareService } from '../../../service/TransactionPrepareService';
import { walletService } from '../../../service/WalletService';
import { ChainConfig } from './config';
import { DappBrowserIPC } from '../types';
import {
  evmTransactionSigner,
  EvmTransactionSigner,
} from '../../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../../service/signers/TransactionSupported';
import { walletAllAssetsState } from '../../../recoil/atom';
import { getCronosEvmAsset, isHexEqual } from '../../../utils/utils';
import { TransactionDataParser } from './TransactionDataParser';
import { ErrorHandler, WebView } from './types';
import { useRefCallback } from './useRefCallback';
import { useChainConfigs } from './useChainConfigs';
import { useCronosEvmAsset } from '../../../hooks/useCronosEvmAsset';

interface IUseIPCProviderProps {
  webview: WebView | null;
  onRequestAddress: (onSuccess: (address: string) => void, onError: ErrorHandler) => void;
  onRequestTokenApproval: (
    event: DappBrowserIPC.TokenApprovalEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => void;
  onRequestSendTransaction: (
    event: DappBrowserIPC.SendTransactionEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignMessage: (
    event: DappBrowserIPC.SignMessageEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignPersonalMessage: (
    event: DappBrowserIPC.SignPersonalMessageEvent,
    onSuccess: (passphrase: string) => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSignTypedMessage: (
    event: DappBrowserIPC.SignTypedMessageEvent,
    onSuccess: (passphrase: string) => void,
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
      chainConfig: DappBrowserIPC.EthereumChainConfig;
    },
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onRequestSwitchEthereumChain: (
    event: {
      prev: DappBrowserIPC.EthereumChainConfig;
      next: DappBrowserIPC.EthereumChainConfig;
    },
    onSuccess: () => void,
    onError: ErrorHandler,
  ) => Promise<void>;
  onFinishTransaction: (error?: string) => void;
}

export const useIPCProvider = (props: IUseIPCProviderProps) => {
  const { webview, onFinishTransaction } = props;

  const transactionPrepareService = new TransactionPrepareService(walletService.storageService);
  const allAssets = useRecoilValue(walletAllAssetsState);
  const cronosAsset = getCronosEvmAsset(allAssets);
  const transactionDataParser = useMemo(() => {
    return new TransactionDataParser(ChainConfig.RpcUrl, ChainConfig.ExplorerAPIUrl);
  }, []);

  const asset = useCronosEvmAsset()

  const { list: chainConfigs, add: addChainConfig, setSelectedChain, selectedChain } = useChainConfigs();

  const executeJavScript = useCallback(
    async (script: string) => {
      await webview?.executeJavaScript(
        `
        (function() {
            ${script}
        })();
        `,
      );
    },
    [webview],
  );

  const injectDomReadyScript = useCallback((chainConfig?: DappBrowserIPC.EthereumChainConfig) => {
    // TODO: choose selected chain

    if (!chainConfig) {
      // eslint-disable-next-line prefer-destructuring
      chainConfig = chainConfigs[0];
    }

    executeJavScript(
      `
            var config = {
                address: '${asset?.address}',
                chainId: '${chainConfig.chainId}',
                rpcUrl: "${chainConfig.rpcUrls[0]}",
                isDebug: true
            };
            window.ethereum.setConfig(config);
        `,
    );
  }, [webview, chainConfigs, asset]);

  const sendError = (id: number, error: string) => {
    executeJavScript(`
        window.ethereum.sendError(${id}, "${error}")
    `);
  };

  const sendResponse = (id: number, response?: string) => {
    if (response) {
      executeJavScript(`
          window.ethereum.sendResponse(${id}, "${response}")
      `);
    } else {
      executeJavScript(`
          window.ethereum.sendResponse(${id})
      `);
    }
  };

  useEffect(() => {

    injectDomReadyScript(selectedChain)

  }, [selectedChain]);


  const sendResponses = (id: number, responses: string[]) => {
    const script = responses.map(r => `'${r}'`).join(',');
    executeJavScript(`
        window.ethereum.sendResponse(${id}, [${script}])
    `);
  };

  const handleRequestAccounts = useRefCallback((id: number, address: string) => {
    executeJavScript(
      `
          window.ethereum.setAddress("${address}");
        `,
    );
    sendResponses(id, [address]);
  });

  const handleTokenApproval = useRefCallback(
    async (event: DappBrowserIPC.TokenApprovalEvent, passphrase: string) => {
      const prepareTXConfig: TransactionConfig = {
        from: event.object.from,
        to: event.object.to,
      };

      const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(
        cronosAsset!,
        prepareTXConfig,
      );

      const data = evmTransactionSigner.encodeTokenApprovalABI(
        event.object.tokenData.contractAddress,
        event.object.spender,
        ethers.constants.MaxUint256,
      );

      const txConfig: EVMContractCallUnsigned = {
        from: event.object.from,
        contractAddress: event.object.to,
        data,
        gasLimit: ethers.utils.hexValue(event.object.gas),
        gasPrice: event.object.gasPrice,
        nonce: prepareTxInfo.nonce,
      };
      try {
        const result = await evmTransactionSigner.sendContractCallTransaction(
          cronosAsset!,
          txConfig,
          passphrase,
          ChainConfig.RpcUrl,
        );

        sendResponse(event.id, result);
      } catch (error) {
        sendError(event.id, 'Transaction failed');
      }

      onFinishTransaction();
    },
  );

  const getGasPrice = async (event: DappBrowserIPC.SendTransactionEvent) => {
    const prepareTXConfig: TransactionConfig = {
      from: event.object.from,
      to: event.object.to,
      data: event.object.data,
      value: event.object.value,
    };

    const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(
      cronosAsset!,
      prepareTXConfig,
    );

    return {
      gasLimit: prepareTxInfo.gasLimit,
      gasPrice: Web3.utils.toHex(prepareTxInfo.loadedGasPrice),
    };
  };

  const handleSendTransaction = useRefCallback(
    async (event: DappBrowserIPC.SendTransactionEvent, passphrase: string) => {
      const prepareTXConfig: TransactionConfig = {
        from: event.object.from,
        to: event.object.to,
      };

      const prepareTxInfo = await transactionPrepareService.prepareEVMTransaction(
        cronosAsset!,
        prepareTXConfig,
      );

      const txConfig: EVMContractCallUnsigned = {
        from: event.object.from,
        contractAddress: event.object.to,
        data: event.object.data,
        gasLimit: ethers.utils.hexValue(event.object.gas),
        gasPrice: event.object.gasPrice,
        value: event.object.value,
        nonce: prepareTxInfo.nonce,
      };

      try {
        const result = await evmTransactionSigner.sendContractCallTransaction(
          cronosAsset!,
          txConfig,
          passphrase,
          ChainConfig.RpcUrl,
        );
        sendResponse(event.id, result);
        onFinishTransaction();
      } catch (error) {
        sendError(event.id, (error as any) as string);
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
        sendError(eventId, (error as any) as string);
      }
    },
  );

  const handleSignTypedMessage = useRefCallback(
    async (event: DappBrowserIPC.SignTypedMessageEvent, passphrase: string) => {
      try {
        const sig = await EvmTransactionSigner.signTypedDataV4(event.object.raw, passphrase);
        sendResponse(event.id, sig);
      } catch (error) {
        sendError(event.id, (error as any) as string);
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
              sendError(event.id, reason);
            },
          );
          break;
        case 'signTransaction':
          // parse transaction data

          // gasPrice maybe missing (eg. Tectonic)
          if (!event.object?.gasPrice || !event.object.gas) {
            const gasObject = await getGasPrice(event);
            event.object.gasPrice = event.object?.gasPrice ?? gasObject.gasPrice;
            event.object.gas = event.object?.gas ?? gasObject.gasLimit;
          }

          if (event.object.data.startsWith('0x095ea7b3')) {
            const response = await transactionDataParser.parseTokenApprovalData(
              event.object.to,
              event.object.data,
            );
            const approvalEvent: DappBrowserIPC.TokenApprovalEvent = {
              name: 'tokenApproval',
              id: event.id,
              object: {
                tokenData: response.tokenData,
                amount: response.amount,
                gas: event.object.gas,
                gasPrice: event.object.gasPrice,
                from: event.object.from,
                spender: response.spender,
                to: event.object.to,
              },
            };
            props.onRequestTokenApproval(
              approvalEvent,
              passphrase => {
                handleTokenApproval.current(approvalEvent, passphrase);
              },
              reason => {
                sendError(event.id, reason);
              },
            );
          } else {
            props.onRequestSendTransaction(
              event,
              passphrase => {
                handleSendTransaction.current(event, passphrase);
              },
              reason => {
                sendError(event.id, reason);
              },
            );
          }

          break;
        case 'signMessage':
          props.onRequestSignMessage(
            event,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _ => {
              sendError(event.id, 'Not implemented');
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signPersonalMessage':
          props.onRequestSignPersonalMessage(
            event,
            passphrase => {
              handleSignMessage.current(event.id, event.object.data, passphrase);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'signTypedMessage':
          props.onRequestSignTypedMessage(
            event,
            passphrase => {
              handleSignTypedMessage.current(event, passphrase);
            },
            reason => {
              sendError(event.id, reason);
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
              sendError(event.id, reason);
            },
          );
          break;
        case 'watchAsset':
          props.onRequestWatchAsset(
            event,
            () => { },
            reason => {
              sendError(event.id, reason);
            },
          );
          break;
        case 'addEthereumChain': {

          const foundConfig = chainConfigs.find(c => isHexEqual(c.chainId, event.object.chainId))

          if (foundConfig && isHexEqual(selectedChain.chainId, event.object.chainId)) {
            return;
          }

          if (foundConfig && selectedChain.chainId !== event.object.chainId) {
            props.onRequestSwitchEthereumChain({
              prev: selectedChain, next: foundConfig
            }, () => {
              setSelectedChain(foundConfig)
              injectDomReadyScript(foundConfig)
            }, () => {
              // no-op
            })
            return;
          }

          const config = {
            chainId: event.object.chainId,
            rpcUrls: event.object.rpcUrls,
            'blockExplorerUrls': event.object.blockExplorerUrls,
            'chainName': event.object.chainName,
            'nativeCurrency': event.object.nativeCurrency,
          }

          props.onRequestAddEthereumChain({ chainConfig: config },
            async () => {
              addChainConfig(config);

              props.onRequestSwitchEthereumChain({
                prev: selectedChain, next: config
              }, () => {
                setSelectedChain(config)
                injectDomReadyScript(config)
              }, () => {
                // no-op
              })

              sendResponse(event.id);
            },
            reason => {
              sendError(event.id, reason);
            },
          );
        }
          break;
        case 'switchEthereumChain': {

          const foundConfig = chainConfigs.find(c => isHexEqual(c.chainId, event.object.chainId))
          if (foundConfig && selectedChain.chainId !== event.object.chainId) {
            props.onRequestSwitchEthereumChain({
              prev: selectedChain, next: foundConfig
            }, () => {
              setSelectedChain(foundConfig)
              injectDomReadyScript(foundConfig)
            }, () => {
              // no-op
            })
          }

        }
          break;
        default:
          break;
      }
    }

    webview.addEventListener('ipc-message', ipcMessageHandler);

    // eslint-disable-next-line consistent-return
    return () => {
      webview.removeEventListener('ipc-message', ipcMessageHandler)
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
      injectDomReadyScript(selectedChain);
      if (process.env.NODE_ENV === 'development') {
        webview.openDevTools();
      }
    });
  }, [webview, selectedChain]);

  useEffect(() => {
    setupIPC();
  }, [setupIPC]);
};
