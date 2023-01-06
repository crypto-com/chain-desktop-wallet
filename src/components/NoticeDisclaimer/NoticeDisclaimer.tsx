import React from 'react';
import { Layout } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './NoticeDisclaimer.less';
import { ThemeColor } from '../../config/StaticConfig';

const { Content, Sider } = Layout;

const NoticeDisclaimer: React.FC = props => {
  return (
    <div className="notice-disclaimer">
      <Layout>
        <Sider width="20px">
          <ExclamationCircleOutlined style={{ color: ThemeColor.BLUE }} />
        </Sider>
        <Content>{props.children}</Content>
      </Layout>
    </div>
  );
};

export default NoticeDisclaimer;
