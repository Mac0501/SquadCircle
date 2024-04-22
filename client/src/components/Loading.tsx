import React from 'react';
import { Spin } from 'antd';

const Loading = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Spin size="large" />
    </div>
  );
};

export default Loading;
