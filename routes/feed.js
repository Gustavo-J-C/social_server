const routes = require('express').Router();
const multer = require('multer');
const multerConfig = require('../config/multer');

const feedController = require('../controllers/feed');
const authenticateToken = require('../middlewares/authMiddleware');

routes.get('/posts', feedController.getPosts)

routes.get('/post/:postId', feedController.getPost)
routes.delete('/post/:id', authenticateToken, feedController.deletePost)

routes.get('/user/:userId/posts', authenticateToken, feedController.getUserPosts);

routes.post('/post', authenticateToken, feedController.createPost)
routes.post('/post/image', authenticateToken, multer(multerConfig).single('file'), feedController.uploadPostImages);

routes.post('/post/:postId/like', authenticateToken, feedController.likePost);
routes.delete('/post/:postId/unlike', authenticateToken, feedController.unlikePost);

routes.get('/post/:postId/likes', authenticateToken, feedController.getPostLikes);
routes.get('/post/:postId/user/:userId/like', authenticateToken, feedController.checkLike);

module.exports = routes;