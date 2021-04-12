import React, { useState, useEffect, useRef } from 'react';
import './governance.less';
import 'antd/dist/antd.css';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Layout, Tabs, List, Space } from 'antd';
import { DislikeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons';

import { useRecoilValue } from 'recoil';
import { sessionState } from '../../recoil/atom';

import { ProposalModel } from '../../models/Transaction';
import { walletService } from '../../service/WalletService';

const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

const IconText = ({ icon, text }) => (
  <Space>
    {React.createElement(icon)}
    {text}
  </Space>
);

const GovernancePage = () => {
  const [proposalList, setProposalList] = useState<ProposalModel[]>();
  const currentSession = useRecoilValue(sessionState);
  const didMountRef = useRef(false);

  useEffect(() => {
    const fetchProposalList = async () => {
      const list = await walletService.retrieveProposals(
        currentSession.wallet.config.network.chainId,
      );
      setProposalList(list);
      console.log(list);
    };

    if (!didMountRef.current) {
      fetchProposalList();
      didMountRef.current = true;
    }
    // eslint-disable-next-line
  }, [proposalList, setProposalList]);

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background">Governance</Header>
      <div className="header-description">You may see all proposals and cast your votes here.</div>
      <Content>
        <Tabs defaultActiveKey="1">
          <TabPane tab="All" key="1">
            <div className="site-layout-background governance-content">
              <div className="container">
                <List
                  dataSource={proposalList}
                  renderItem={item => (
                    <List.Item
                      key={item.proposal_id}
                      actions={[
                        <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                        <IconText icon={LikeOutlined} text="156" key="list-vertical-yes-o" />,
                        <IconText icon={DislikeOutlined} text="2" key="list-vertical-no-o" />,
                      ]}
                    >
                      <List.Item.Meta
                        // avatar={
                        //   <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                        // }
                        title={
                          <>
                            <span>{item.status}</span> -{' '}
                            <a href="https://ant.design">{item.content.title}</a>
                          </>
                        }
                        description={item.content.description}
                      />
                      {/* <div>{item.status}</div> */}
                    </List.Item>
                  )}
                  pagination={{
                    onChange: page => {
                      console.log(page);
                    },
                    pageSize: 10,
                  }}
                >
                  {/* {this.state.loading && this.state.hasMore && (
                    <div className="demo-loading-container">
                      <Spin />
                    </div>
                  )} */}
                </List>
              </div>
            </div>
          </TabPane>
          <TabPane tab="Active" key="2">
            <div className="site-layout-background governance-content">
              <div className="container">hi</div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
      <Footer />
    </Layout>
  );
};

export default GovernancePage;
