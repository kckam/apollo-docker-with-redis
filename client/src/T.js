import logo from "./logo.svg";
import "./App.css";
import { useQuery, useLazyQuery, gql, useSubscription } from "@apollo/client";
import { client, cache } from "./index";

const COMMENTS_SUBSCRIPTION = gql`
  query Book($id: ID!) {
    book(id: $id) {
      id
      author
      title
    }
  }
`;

const GET_BOOKS = gql`
  query AllBooks {
    books {
      id
      author
      __typename
    }
  }
`;

function App() {
  // const { data, error, loading } = useSubscription(COMMENTS_SUBSCRIPTION, {});
  const { data, error, loading } = useQuery(COMMENTS_SUBSCRIPTION, {
    variables: { id: "1" },
    fetchPolicy: "cache-first",
    // nextFetchPolicy: "cache-first",
  });

  const { data: allBooks } = useQuery(GET_BOOKS, {
    fetchPolicy: "cache-first",
    // nextFetchPolicy: "cache-first",
  });
  // console.log(data);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error || !data) {
    return <b>{JSON.stringify(error)}Error</b>;
  }

  return (
    <>
      <h1>
        {data.book.author}--{data.book.title}
      </h1>
      <h2>{JSON.stringify(allBooks)}</h2>
    </>
  );
}

export default App;
