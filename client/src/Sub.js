import { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { useQuery, useLazyQuery, gql, useSubscription } from "@apollo/client";
import T from "./T";
import axios from "axios";
import { AUTHOR } from "./fragments";

const subsc = gql`
  subscription {
    numberIncremented
  }
`;

function App() {
  const { data, loading } = useSubscription(subsc, {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    shouldResubscribe: true,
    onSubscriptionData: (res) => {
      // console.log("res");
      // console.log(res);
    },
  });

  // console.log(data);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {new Array(data?.numberIncremented).fill("").map((el, i) => {
        return (
          <div
            style={{
              border: "1px solid #000",
              flex: "1",
              boxSizing: "border-box",
            }}
          >
            {i}
          </div>
        );
      })}
      SUB1: {data?.numberIncremented} - {loading}
    </div>
  );
}

export default App;
