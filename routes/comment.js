const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comments');
const checkCommentExistence = require('../middlewares/commentMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create', authenticateToken, commentController.createComment);
router.get('/post/:postId', commentController.getPostComments);
router.get('/current/:commentId', checkCommentExistence, commentController.getComment);
router.put('/current/:commentId', authenticateToken, checkCommentExistence, commentController.updateComment);
router.delete('/current/:commentId', authenticateToken, checkCommentExistence, commentController.deleteComment);

router.get('/user/:userId', authenticateToken, commentController.getCommentsPerPerson);

module.exports = router;
