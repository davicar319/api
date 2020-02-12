const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const app = express();

const port = process.env.port || 4000;  

const typeDefs = gql`
    type Query {
        hello: String
    }
`;
const resolvers = {
    Query: {
        hello: () => 'Hello World GraphQL'
    }
}
//Setup the Apollo server
const server = 
    new ApolloServer({typeDefs, resolvers});
//Apply the Appolo GraphQL middleware and set the path to /api
server.applyMiddleware({app, path: '/api'});

app.get('/', 
    (req, res) => res.send('Hello World!!!'));

app.listen(port, 
    () => console.log(`Server running at http://localhost:${port}${server.graphqlPath}!!!`));