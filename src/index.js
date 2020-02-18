const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./db');

const port = process.env.port || 4000;
const DB_HOST = process.env.DB_HOST;

let notes = [
  { id: '1', content: 'This is a note', author: 'Dave Carlson' },
  { id: '2', content: 'This is another note.', author: 'Harlow Everly' },
  { id: '3', content: 'Oh look, another note.', author: 'Riley Harrison' }
];

const typeDefs = gql`
  type Query {
    hello: String
    notes: [Note!]!
    note(id: ID!): Note!
  }
  type Note {
    id: ID!
    content: String!
    author: String!
  }
  type Mutation {
    newNote(content: String!): Note!
  }
`;
const resolvers = {
  Query: {
    hello: () => 'Hello World GraphQL',
    notes: () => notes,
    note: (parent, args) => {
      return notes.find(note => note.id === args.id);
    }
  },
  Mutation: {
    newNote: (parent, args) => {
      let noteValue = {
        id: String(notes.length + 1),
        content: args.content,
        author: 'David A Carlson'
      };
      notes.push(noteValue);
      return noteValue;
    }
  }
};
//Connect to the mongoDB
db.connect(DB_HOST);
//Setup the Apollo server
const server = new ApolloServer({ typeDefs, resolvers });
//Apply the Appolo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.get('/', (req, res) => res.send('Hello World!!!'));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}${server.graphqlPath}`)
);
