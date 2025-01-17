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
  updateNote: async (parent, { content, id }, { models, user }) => {
    // If there is no user, throw an AuthenticationError.
    if (!user) {
      throw new AuthenticationError(authenticationErrorText);
    }

    //Find the note
    const note = await models.Note.findById(id);
    //If the note owner and current user do not match, throw a forbidden error.
    if (note && String(note.author) != user.id) {
      throw new ForbiddenError(
        "You don't have permissions to delete that note."
      );
    }
    //Update the note in the database and return the updated note.
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
  toggleFavorite: async (parent, { id }, { models, user }) => {
    // if no user context is passed throw an auth error.
    if (!user) {
      throw new AuthenticationError();
    }

    // check to see if the user has already favorited the note.
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);

    // if the user existes in the list
    // pull them from the list and reduce
    // the favoriteCount by 1
    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // set the new to true to return the updated doc.
          new: true
        }
      );
    } else {
      // if the user doesn't exist in the list
      // add them to the list and increment the
      // favoriteCount by 1
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          new: true
        }
      );
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
