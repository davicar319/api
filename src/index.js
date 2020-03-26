const jwt = require('jsonwebtoken');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');

const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
('');
const app = express();
app.use(helmet());
app.use(cors());
require('dotenv').config();
const db = require('./db');
const typeDefs = require('./schema');

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
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: async ({ req }) => {
    //Extract the jwt token from the headers.
    const token = req.headers.authorization;
    //Retrive the user from the token.
    const user = await getUser(token);
    //Add the database models and user to the context.
    console.log(user);
    return { models, user };
  }
});
//Apply the Appolo GraphQL middleware and set the path to /api
server.applyMiddleware({ app, path: '/api' });

app.get('/', (req, res) => res.send('Hello World!!!'));
const port = process.env.PORT || 4000;

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}${server.graphqlPath}`)
);
