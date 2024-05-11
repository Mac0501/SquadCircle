import React from 'react';
import { Spin } from 'antd';

const Loading = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'center',
        height:"50vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
};

export default Loading;
