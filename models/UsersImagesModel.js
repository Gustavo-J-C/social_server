const Sequelize = require('sequelize');
const sequelize = require('../database');
const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const s3 = new aws.S3();

const UserImage = sequelize.define('users_images', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  originalname: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  path: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  url: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  filename: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: new Date(),
    allowNull: false,
  },
  deleted_at: {
    type: Sequelize.DATE,
  },
}, {
  timestamps: false,
  hooks: {
    beforeCreate: (postImageInstance) => {
      if (!postImageInstance.url) {
        if (process.env.STORAGE_TYPE == 's3') {
          postImageInstance.url = `${process.env.APP_URL}/files/profile/${postImageInstance.filename}`;
        }else {
          postImageInstance.url = `${process.env.LOCAL_URL}/files/profile/${postImageInstance.filename}`;
        }
      }
    },
    beforeDestroy: (postImageInstance) => {
      if (process.env.STORAGE_TYPE === 'S3') {
        return s3.deleteObject({
          Bucket: 'socialappstorage',
          Key: postImageInstance.filename
        }).promise()
      } else {
        return promisify(fs.unlink)(path.resolve(__dirname, '..', 'tmp', 'uploads', postImageInstance.filename))
      }
    }
  }
});

module.exports = UserImage;