import { createServer } from "http";
import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { PubSub } from "graphql-subscriptions";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver } from "graphql";
import cors from "cors";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { BaseRedisCache } from "apollo-server-cache-redis";
import Redis from "ioredis";

const pubsub = new RedisPubSub();

let currentNumber = 0;
const PORT = 4000;
// const pubsub = new PubSub();
const corsOptions = {
  origin: "http://localhost:4000",
  credentials: true,
};

const books = [
  {
    id: 1,
    title: "The AwakeningKOKOKK",
    author: "Kate Chopin - - - - ",
  },
  {
    id: 2,
    title: "City of Glass",
    author: "Paul Auster",
  },
];

// Schema definition
const typeDefs = gql`
  interface Character {
    name: String
  }

  type Bot implements Character {
    name: String
    age: Int
  }

  type Human implements Character {
    name: String
    height: Int
  }

  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
  ) on FIELD_DEFINITION | OBJECT | INTERFACE

  directive @upper on FIELD_DEFINITION

  type Book @cacheControl(maxAge: 240, scope: PUBLIC) {
    id: ID
    title: String @upper
    author: String
  }

  type People {
    name: String
    friend: People
    bots: Bot
  }

  type Query {
    currentNumber: Int
    helo: String
    book(id: ID!): Book
    books: [Book]
    bots: [Bot]
    humans: [Human]
    search: [Character]
    people: People
  }

  type Subscription {
    numberIncremented: Int
  }
`;

// Resolver map
const resolvers = {
  Character: {
    __resolveType(character, context, info) {
      if (character.height) {
        return "Human";
      }

      return "Bot";
    },
  },
  People: {
    bots: (parents) => {
      console.log(parents);
    },
  },
  Query: {
    currentNumber() {
      return currentNumber;
    },
    people: () => {
      return {
        name: "this is kc",
        friend: {
          name: "this is ck",
          friend: {
            name: "this is ck",
          },
        },
      };
    },
    helo: () => "world",
    bots: () => [{ name: "omg", age: 123 }],
    humans: () => [{ name: "omg", height: 123 }],
    search: () => {
      return [
        { name: "omg", height: 123 },
        { name: "omg", age: 123 },
      ];
    },
    book: async (parent, { id }) => {
      let a = new Promise((res, rej) => {
        setTimeout(() => {
          console.log("oommgg");
          res("ok");
        }, 100);
      });

      await a;

      return books.find((el) => el.id == id);
    },
    books: async (_, __, ___, info) => {
      // info.cacheControl.setCacheHint({ maxAge: 60, scope: "PRIVATE" });
      let a = new Promise((res, rej) => {
        setTimeout(() => {
          res("ok");
        }, 100);
      });

      await a;

      return books;
    },
  },
  Subscription: {
    numberIncremented: {
      subscribe: () => pubsub.asyncIterator(["NUMBER_INCREMENTED"]),
    },
  },
};

function upperDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const upperDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (upperDirective) {
        // Get this field's original resolver
        const { resolve = defaultFieldResolver } = fieldConfig;

        // Replace the original resolver with a function that *first* calls
        // the original resolver, then converts its result to upper case
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (typeof result === "string") {
            return result.toUpperCase();
          }
          return result;
        };
        return fieldConfig;
      }
    },
  });
}

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

schema = upperDirectiveTransformer(schema, "upper");

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();

// app.use(cors());

const httpServer = createServer(app);

app.get("/", (req, res) => {
  res.set("Cache-Control", "public, max-age=31557600");
  console.log("Trigger home");
  res.send({ hello: "world" });
});

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer(
  {
    schema,
    onConnect: async (ctx) => {
      console.log("connected");
    },
  },
  wsServer
);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  cache: new BaseRedisCache({
    client: new Redis(6379),
  }),
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // responseCachePlugin.default({
    //   sessionId: (requestContext) => {
    //     return requestContext.request.http.headers.get("session-id") || null;
    //   },
    // }),
    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
await server.start();
server.applyMiddleware({
  app,
  cors: {
    origin: [
      "https://studio.apollographql.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  },
  // cors: {
  //   origin: ["https://studio.apollographql.com"],
  //   credentials: true,
  // },
});

// Now that our HTTP server is fully set up, actually listen.
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
  );
});

// In the background, increment a number every second and notify subscribers when
// it changes.

function incrementNumber() {
  currentNumber++;
  pubsub.publish("NUMBER_INCREMENTED", { numberIncremented: currentNumber });
  setTimeout(incrementNumber, 1000);
}
// Start incrementing
incrementNumber();
