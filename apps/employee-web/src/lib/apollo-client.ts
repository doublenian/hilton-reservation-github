import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Cookies from 'js-cookie';

// GraphQL端点
const httpLink = createHttpLink({
  uri: `${window.location.protocol}//${window.location.hostname}:4000/graphql`,
});

// 认证链接 - 添加token到请求头
const authLink = setContext((_, { headers }) => {
  // 从cookie获取token
  const token = Cookies.get('auth-token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
    
    // 如果是401错误，可能是token过期
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // 清除过期的token
      Cookies.remove('auth-token');
      
      // 重定向到登录页面
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
});

// 创建Apollo Client实例
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Reservation: {
        fields: {
          createdAt: {
            merge: (existing, incoming) => incoming,
          },
          updatedAt: {
            merge: (existing, incoming) => incoming,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient; 