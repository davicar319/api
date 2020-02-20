const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./db');
const typeDefs = require('./schema');

const port = process.env.port || 4000;
const DB_HOST = process.env.DB_HOST;
const models = require('./models');
const resolvers = require('./resolvers');

//Connect to the mongoDB
db.connect(DB_HOST);
//Setup the Apollo server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    //Add the database models to the context.
    return { models };
  }
});
//Apply the Appolo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.get('/', (req, res) => res.send('Hello World!!!'));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}${server.graphqlPath}`)
);
