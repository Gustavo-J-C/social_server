const Comment = require('../models/CommentModel');
const User = require('../models/UserModel');
const UserImage = require('../models/UsersImagesModel');

exports.createComment = async function(req, res) {
    try {
        const postId = req.body.postId;
        const user_id = req.user.userId;

        if (!postId) {
            return res.status(400).json({ message: 'O campo post_id é obrigatório para criar um comentário.' });
        }

        // Obtém o usuário e sua imagem associada
        const user = await User.findByPk(user_id, {
            attributes: ["id", "name", "nickname", "email"],
            include: UserImage
        });

        // Crie um novo comentário associado ao post com base no postId e ao usuário
        const newComment = await Comment.create({
            user_id: user_id,
            post_id: postId,
            description: req.body.description,
        });

        res.status(201).json({
            message: "comment created successfully",
            data: {
                comment: newComment,
                user
            }
        });
    } catch (error) {
        console.error('Erro ao criar um novo comentário:', error);
        res.status(500).json({ message: 'Erro ao criar um novo comentário.' });
    }
}

exports.getPostComments = async function (req, res) {
    try {
        const postId = req.params.postId;

        const comments = await Comment.findAll({
            where: {
                post_id: postId,
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'nickname', 'email'],
                    include: UserImage
                }
            ]
        });

        res.status(200).json({
            data: {
                count: comments.length,
                comments: comments,
            },
            message: 'Comments fetched successfully.',
        });
    } catch (error) {
        console.error('Erro ao buscar todos os comentários:', error);
        res.status(500).json({
            message: 'Error fetching comments.',
            error: error.message,
        });
    }
};

exports.getComment = async function (req, res) {
    try {
        const commentId = req.params.commentId; // Obtém o ID do comentário a partir dos parâmetros da rota
        const comment = await Comment.findByPk(commentId);

        res.json(comment);
    } catch (error) {
        console.error('Erro ao buscar o comentário:', error);
        res.status(500).json({ message: 'Erro ao buscar o comentário.' });
    }
};

exports.updateComment = async function (req, res) {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.userId;

        const existingComment = req.comment;

        if (existingComment.user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Você não tem permissão para atualizar este comentário.' });
        }

        existingComment.description = req.body.description;

        const updatedeComment = await existingComment.save();

        res.json({ message: 'Comentário atualizado com sucesso.', comment: updatedeComment})
    } catch (error) {
        
    }
};

exports.deleteComment = async function (req, res) {
    try {
        const commentId = req.params.commentId; // Obtém o ID do comentário a partir dos parâmetros da rota

        // Exclui o comentário por ID
        await Comment.destroy({
            where: {
                id: commentId,
            },
        });

        res.json({ message: 'Comentário excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir o comentário:', error);
        res.status(500).json({ message: 'Erro ao excluir o comentário.' });
    }
};

exports.getCommentsPerPerson = async function (req, res) {
    try {
        const userId = req.params.userId; // Obtém o ID do usuário a partir dos parâmetros da rota

        // Busque todos os comentários associados a um usuário específico
        const comments = await Comment.findAll({
            where: {
                user_id: userId,
            },
        });

        res.json(comments);
    } catch (error) {
        console.error('Erro ao buscar os comentários do usuário:', error);
        res.status(500).json({ message: 'Erro ao buscar os comentários do usuário.' });
    }
};
