module.exports = {
  // resolve the list of notes for a single user when requested.
  author: async (note, args, { models }) => {
    return await models.User.findById(note.author);
  },
  // resolve the favoritedBy infor for the note when requestd.
  favoritedBy: async (note, args, { models }) => {
    return await models.User.find({ _id: { $in: note.favoritedBy } });
  }
};
