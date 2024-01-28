const routes = require('express').Router();
const authenticateToken = require('../middlewares/authMiddleware');

const feedController = require('../controllers/feed');

routes.get('/:userId/posts', feedController.getUserPosts);

module.exports = routes;