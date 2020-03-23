const jwt = require('jsonwebtoken');
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const helmet = require('helmet');
const app = express();
app.use(helmet());
require('dotenv').config();
const db = require('./db');
const typeDefs = require('./schema');

const port = process.env.port || 4000;
const DB_HOST = process.env.DB_HOST;
const models = require('./models');
const resolvers = require('./resolvers');

const getUser = token => {
  if (token) {
    try {
      //return the user information from the token.
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      //If there is a problem with the token, throw an error.
      throw new Error('Session is invalid.');
    }
  }
};

//Connect to the mongoDB
db.connect(DB_HOST);
//Setup the Apollo server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    //Extract the jwt token from the headers.
    const token = req.headers.authorization;
    //Retrive the user from the token.
    const user = getUser(token);
    //Add the database models and user to the context.
    console.log(user);
    return { models, user };
  }
});
//Apply the Appolo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.get('/', (req, res) => res.send('Hello World!!!'));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}${server.graphqlPath}`)
);
