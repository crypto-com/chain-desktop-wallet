import React from 'react';
import './MenuContentBlock.less';

interface MenuContentBlockProps {
    children: React.ReactNode;
    title?: string; // card title
    className?: string; // combine parent className
  }

const MenuContentBlock : React.FC<MenuContentBlockProps> = props => {
    return (<div className={`menu-content-block ${props.className}`}>
        <div className="title">
            {props.title}
        </div>
        <div className="site-layout-background">
            {props.children}
        </div>    
    </div>)
}

export default MenuContentBlock;