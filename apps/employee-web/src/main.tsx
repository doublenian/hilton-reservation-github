import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { apolloClient } from './lib/apollo-client';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <ApolloProvider client={apolloClient}>
        <App />
      </ApolloProvider>
    </ConfigProvider>
  </React.StrictMode>
); 