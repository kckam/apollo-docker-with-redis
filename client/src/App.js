import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  useQuery,
  useLazyQuery,
  gql,
  useSubscription,
  makeVar,
  useReactiveVar,
} from "@apollo/client";
import T from "./T";
import axios from "axios";
import { AUTHOR } from "./fragments";
import Sub from "./Sub";

const GET_CHARACTERS = gql`
  {
    search {
      name
      __typename

      ... on Bot {
        age
      }

      ... on Human {
        height
      }
    }
  }
`;

const GET_BOOKS = gql`
  ${AUTHOR}
  query AllBooks {
    books {
      id
      ...author
      __typename
    }
  }
`;

const GET_BOOK = gql`
  ${AUTHOR}
  query book($id: ID!) {
    book(id: $id) {
      id
      ...author
      __typename
    }
  }
`;
const cartItemsVar = makeVar("sdfsdf");
function App() {
  const [show, setShow] = useState(false);
  // const { data, loading } = useQuery(GET_BOOKS);
  // const {} = useQuery(GET_BOOKS, {});
  const {} = useQuery(GET_CHARACTERS, {});
  const [loadBooks] = useLazyQuery(GET_BOOKS, {});
  // const { data, loading } = useSubscription(SUB);

  const [loadBook] = useLazyQuery(GET_BOOK, {
    // fetchPolicy: "cache-only",
  });

  const cartItems = useReactiveVar(cartItemsVar);

  console.log(cartItemsVar());

  return (
    <>
      <div
        onClick={() => {
          cartItemsVar(123);
        }}
      >
        Pop reactive {cartItemsVar()}
      </div>
      <div
        onClick={() => {
          loadBooks();
        }}
      >
        Load
      </div>
      <div
        onClick={() => {
          loadBook({
            variables: {
              id: "1",
            },
          });
        }}
      >
        Book 1
      </div>
      <div
        onClick={() => {
          setShow((p) => !p);
        }}
      >
        Toggle
      </div>
      {show && <T />}

      <Sub />
      {/* {data.books.map((el) => {
        return <div>{el.author}</div>;
      })}
      <button
        onClick={() => {
          setShow((show) => !show);
        }}
      >
        {show ? "Show" : "Nooo"}
      </button>
      {show && <T />} */}
    </>
  );
}

export default App;
