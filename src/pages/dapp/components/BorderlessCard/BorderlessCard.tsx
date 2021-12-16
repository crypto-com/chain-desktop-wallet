import React from 'react';
import { Card } from 'antd';
import './BorderlessCard.less';

interface BorderlessCardProps {
  children: React.ReactNode;
  title?: string; // card title
  rightContent?: React.ReactNode; // right node
  paddingOverwrite?: string; // overwrite body padding
  marginOverwrite?: string; // overwrite body margin
  className?: string; // combine parent className
  style?: object;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
const BorderlessCard: React.FC<BorderlessCardProps> = props => (
  <Card
    bodyStyle={{
      padding: props.paddingOverwrite ? props.paddingOverwrite : '0 0 16px',
      height: '100%',
    }}
    style={Object.assign({}, props.style, {
      margin: props.marginOverwrite,
    })}
    className="card"
    onClick={props.onClick}
  >
    {props.title && (
      <div className="head">
        <div className="title">{props.title}</div>
        <div>{props.rightContent}</div>
      </div>
    )}
    {props.children}
  </Card>
);

export default BorderlessCard;
