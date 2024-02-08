const Sequelize = require('sequelize');
const sequelize = require('../database');
const PostImage = require('./PostImageModel');
const Comment = require('./CommentModel');
const PostLike = require('./PostLikeModel');
const User = require('./UserModel');

const Post = sequelize.define('posts', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  users_id: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  deleted_at: {
    type: Sequelize.DATE,
  },
}, {
  timestamps: false,
});

Post.hasMany(PostImage, { foreignKey: 'post_id' });
Post.hasMany(Comment, { foreignKey: 'post_id' });
Post.hasMany(PostLike, { foreignKey: 'post_id' });
Post.belongsTo(User, { foreignKey: 'users_id' });

Post.addScope('withLikeCount', {
  attributes: {
    include: [
      [
        Sequelize.literal('(SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id)'),
        'like_count',
      ],
    ],
  },
});

Post.addScope('withCommentCount', {
  attributes: {
    include: [
      [
        Sequelize.literal('(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)'),
        'comment_count',
      ],
    ],
  },
});

Post.addScope('withLikeByUser', (userId) => ({
  attributes: {
    include: [
      [
        Sequelize.literal(`EXISTS (SELECT 1 FROM post_likes WHERE post_likes.post_id = posts.id AND post_likes.user_id = ${userId})`),
        'user_liked',
      ],
    ],
  },
}));

module.exports = Post;
