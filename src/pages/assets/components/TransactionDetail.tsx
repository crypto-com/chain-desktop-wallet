import React from 'react';
// import { useTranslation } from 'react-i18next';
import 'antd/dist/antd.css';
import './TransactionDetail.less';
import { Session } from '../../../models/Session';
import { UserAssetType } from '../../../models/UserAsset';
import { TransactionTabularData } from '../assets';
import { renderExplorerUrl } from '../../../models/Explorer';

interface ReceiveDetailProps {
  transaction: TransactionTabularData;
  session: Session;
}

const TransactionDetail: React.FC<ReceiveDetailProps> = props => {
  const { transaction, session } = props;

  //   const [t] = useTranslation();

  const renderDetail = (record: TransactionTabularData) => {
    if (record.assetType !== UserAssetType.TENDERMINT) {
      return (
        <>
          <div className="row">
            <div className="field">From: </div>
            <div className="value">
              <a
                data-original={record.senderAddress}
                target="_blank"
                rel="noreferrer"
                href={`${renderExplorerUrl(
                  session.activeAsset?.config ?? session.wallet.config,
                  'address',
                )}/${record.senderAddress}`}
              >
                {record.senderAddress}
              </a>
            </div>
          </div>
          <div className="row">
            <div className="field">To: </div>
            <div className="value">
              <a
                data-original={record.recipientAddress}
                target="_blank"
                rel="noreferrer"
                href={`${renderExplorerUrl(
                  session.activeAsset?.config ?? session.wallet.config,
                  'address',
                )}/${record.recipientAddress}`}
              >
                {record.recipientAddress}
              </a>
            </div>
          </div>
          <div className="row">
            <div className="field">Amount: </div>
            <div className="value">{record.amount}</div>
          </div>
        </>
      );
    }
    switch (record.msgTypeName) {
      case 'MsgSend':
        return (
          <>
            <div className="row">
              <div className="field">From: </div>
              <div className="value">
                <a
                  data-original={record.senderAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.senderAddress}`}
                >
                  {record.senderAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">To: </div>
              <div className="value">
                <a
                  data-original={record.recipientAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.recipientAddress}`}
                >
                  {record.recipientAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Amount: </div>
              <div className="value">{record.amount}</div>
            </div>
          </>
        );
      case 'MsgWithdrawDelegatorReward':
        return (
          <>
            <div className="row">
              <div className="field">Validator: </div>
              <div className="value">
                <a
                  data-original={record.validatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'validator',
                  )}/${record.validatorAddress}`}
                >
                  {record.validatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Delegator: </div>
              <div className="value">
                <a
                  data-original={record.delegatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.delegatorAddress}`}
                >
                  {record.delegatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Recipient: </div>
              <div className="value">
                <a
                  data-original={record.recipientAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.recipientAddress}`}
                >
                  {record.recipientAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Amount: </div>
              <div className="value">{record.amount}</div>
            </div>
          </>
        );
      case 'MsgDelegate':
        return (
          <>
            <div className="row">
              <div className="field">Validator: </div>
              <div className="value">
                <a
                  data-original={record.validatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'validator',
                  )}/${record.validatorAddress}`}
                >
                  {record.validatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Delegator: </div>
              <div className="value">
                <a
                  data-original={record.delegatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.delegatorAddress}`}
                >
                  {record.delegatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Amount: </div>
              <div className="value">{record.amount}</div>
            </div>
            <div className="row">
              <div className="field">Auto Claimed Rewards: </div>
              <div className="value">{record.autoClaimedRewards}</div>
            </div>
          </>
        );
      case 'MsgUndelegate':
        return (
          <>
            <div className="row">
              <div className="field">Validator: </div>
              <div className="value">
                <a
                  data-original={record.validatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'validator',
                  )}/${record.validatorAddress}`}
                >
                  {record.validatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Delegator: </div>
              <div className="value">
                <a
                  data-original={record.delegatorAddress}
                  target="_blank"
                  rel="noreferrer"
                  href={`${renderExplorerUrl(
                    session.activeAsset?.config ?? session.wallet.config,
                    'address',
                  )}/${record.delegatorAddress}`}
                >
                  {record.delegatorAddress}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="field">Amount: </div>
              <div className="value">{record.amount}</div>
            </div>
            <div className="row">
              <div className="field">Auto Claimed Rewards: </div>
              <div className="value">{record.autoClaimedRewards}</div>
            </div>
          </>
        );
      default:
        return <></>;
    }
  };

  return <div className="transaction-detail">{renderDetail(transaction)}</div>;
};

export default TransactionDetail;
