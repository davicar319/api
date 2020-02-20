const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./db');
const typeDefs = require('./schema');

const port = process.env.port || 4000;
const DB_HOST = process.env.DB_HOST;
const models = require('./models');

const resolvers = {
  Query: {
    notes: () => {
      return models.Note.find((err, notes) => {
        return notes;
      });
    },
    note: (parent, args) => {
      return notes.find(note => note.id === args.id);
    }
  },
  Mutation: {
    newNote: async (parent, args) => {
      return await models.Note.create({
        content: args.content,
        author: 'Dave Carlson'
      });
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
