import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Router } from './Router';
import { ConfigProvider, theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import updateLocale from 'dayjs/plugin/updateLocale';
import enGB from 'antd/locale/en_GB';
dayjs.extend(updateLocale);

// Configure dayjs locale to start the week on Monday
dayjs.updateLocale('en-gb', {
    weekStart: 1,
    weekdaysMin: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <ConfigProvider
    locale={enGB}
    theme={{
      algorithm: theme.darkAlgorithm,
    }}
  >
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  </ConfigProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
