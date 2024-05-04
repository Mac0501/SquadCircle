import React from 'react';
import { Tabs } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { TabPane } = Tabs;

interface TabElement {
  tabTitle: string;
  path: string;
  tabBody: React.ReactNode;
}

interface CustomTabProps {
  elements: TabElement[];
}

const CustomTab: React.FC<CustomTabProps> = ({ elements }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <Tabs
      activeKey={currentPath}
      onChange={(path) => {
        navigate(path);
      }}
    >
      {elements.map((element) => (
        <TabPane
          tab={element.tabTitle}
          key={element.path}
        >
          {element.tabBody}
        </TabPane>
      ))}
    </Tabs>
  );
};

export default CustomTab;