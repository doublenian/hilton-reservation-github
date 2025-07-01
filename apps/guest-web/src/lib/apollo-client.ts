import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: `${window.location.protocol}//${window.location.hostname}:4000/graphql`,
});
 
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
}); 