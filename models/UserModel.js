const Sequelize = require('sequelize');
const sequelize = require('../database');
const UserImage = require('./UsersImagesModel');

const User = sequelize.define('users', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  nickname: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true,
  },
  created_at: {
    type: Sequelize.NOW,
    defaultValue: new Date(),
    allowNull: false,
  },
  email_verified_at: {
    type: Sequelize.DATE,
  },
  deleted_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
}, {
  timestamps: false,
});

User.hasOne(UserImage, { foreignKey: "user_id"} )

User.belongsToMany(User, {
  as: 'followers', // Apelido para a associação de seguidores
  through: 'Followers', // Nome da tabela intermediária
  foreignKey: 'users_followed_id', // Campo que se refere ao usuário seguido
  otherKey: 'user_follower_id', // Campo que se refere ao seguidor
});

User.belongsToMany(User, {
  as: 'following', // Apelido para a associação de usuários seguidos
  through: 'Followers', // Nome da tabela intermediária
  foreignKey: 'user_follower_id', // Campo que se refere ao seguidor
  otherKey: 'users_followed_id', // Campo que se refere ao usuário seguido
});

module.exports = User;
