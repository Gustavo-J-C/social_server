// commentMiddleware.js
const Comment = require('../models/CommentModel');

async function checkCommentExistence(req, res, next) {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comentário não encontrado.' });
    }
    req.comment = comment;
    next();
  } catch (error) {
    console.error('Erro ao verificar a existência do comentário:', error);
    res.status(500).json({ message: 'Erro ao verificar a existência do comentário.' });
  }
}

module.exports = checkCommentExistence;
