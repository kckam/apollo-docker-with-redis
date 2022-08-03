import { useQuery, useLazyQuery, gql, useSubscription } from "@apollo/client";

export const AUTHOR = gql`
  fragment author on Book {
    author
    title
  }
`;
