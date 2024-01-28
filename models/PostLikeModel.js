const Sequelize = require('sequelize');
const sequelize = require('../database');
const Post = require('./PostModel');

const PostLike = sequelize.define('post_likes', {
  user_id: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  post_id: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: new Date(),
    allowNull: false,
  },
  deleted_at: {
    type: Sequelize.DATE,
  }
}, {
  timestamps: false,
});


PostLike.removeAttribute('id');
module.exports = PostLike;
