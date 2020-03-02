const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
const mongoose = require('mongoose');
require('dotenv').config();
const gravatar = require('../util/gravatar');

const authenticationErrorText = 'You must be signed in to create a note';

module.exports = {
  newNote: async (parent, args, { models, user }) => {
    // if there is no user on the context, throw an authentication error.
    if (!user) {
      throw new AuthenticationError(authenticationErrorText);
    }

    return await models.Note.create({
      content: args.content,
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  updateNote: async (parent, { content, id }, { models }) => {
    return await models.Note.findOneAndUpdate(
      {
        _id: id
      },
      {
        $set: {
          content
        }
      },
      {
        new: true
      }
    );
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError(authenticationErrorText);
    }

    const note = await models.Note.findById(id);
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError(
        "You don't have permissions to delete that note."
      );
    }

    try {
      if (note) {
        await note.remove();
      }
      return true;
    } catch (err) {
      //If there is an error along the way, return false.
      return false;
    }
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    //Normalize the email address
    email = email.trim().toLowerCase();
    //Hash the password.
    const hashed = await bcrypt.hash(password, 10);
    //create the gravitar url
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      });

      // create and return the json web token.
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      throw new Error('There was a problem creating the account.');
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email = email.trim().toLowerCase();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    });

    //If no user is found, throw an authentication error.
    if (!user) {
      throw new AuthenticationError('Error signing in.');
    }

    //If the password is inorrect and does not match throw an authenication error.
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw AuthenticationError('Error signing in.');
    }

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  }
};
