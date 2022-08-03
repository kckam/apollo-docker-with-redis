import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
  HttpLink,
  split,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
    keepAlive: 10_000,
    retryWait: () => false,
    retryAttempts: 100,
  })
);

// const client = new ApolloClient({
//   uri: "http://localhost:4000/graphql",
//   cache: new InMemoryCache({
//     typePolicies: {
//       // Book: {
//       //   keyFields: ["id"],
//       // },
//     },
//   }),
// });

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

// https://stackoverflow.com/questions/65842596/apollo-client-using-cached-results-from-object-list-in-response-to-query-for-s
export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        book(_, { args, toReference }) {
          return toReference({
            __typename: "Book",
            id: args.id,
          });
        },
      },
    },
  },
});
// {
//   typePolicies: {
//     Book: {
//       keyFields: ["id"],
//     },
//   },
// }

export const client = new ApolloClient({
  link: splitLink,
  cache,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ApolloProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
