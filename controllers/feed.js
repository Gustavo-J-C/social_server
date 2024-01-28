const Post = require("../models/PostModel");
const PostImage = require('../models/PostImageModel');
const PostLike = require('../models/PostLikeModel');
const Comment = require('../models/CommentModel');
const User = require("../models/UserModel");

exports.getPosts = async function (req, res) {
    try {

        const userId = req.query.userId | null;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 6;

        console.log(req.params);

        const offset = (page - 1) * pageSize;

        const posts = await Post.scope(['withLikeCount', 'withCommentCount', { method: ['withLikeByUser', userId] }]).findAll({
            offset: offset,
            limit: pageSize,
            include: [PostImage],
            order: [['id', 'DESC']],
            include: [
                PostImage,
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            userId
        })

        res.json({ page: page, pageSize: pageSize, posts: posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

exports.getPost = async function (req, res) {
    try {
        const postId = req.params.postId || ""

        const post = await Post.findByPk(postId, {
            include: [PostImage,
            {
                model: User,
                attributes: ['id', 'name', 'email']
            }]
        })

        res.send({
            message: "Post fetched successfully", data: { post }
        })
    } catch (error) {
        res.status(500).send({ error: error })
    }
}

exports.getUserPosts = async function (req, res) {
    try {

        const userId = req.params.userId;

        const posts = await Post.scope(['withLikeCount', 'withCommentCount', { method: ['withLikeByUser', userId] }]).findAll({
            include: [PostImage],
            where: {
                users_id: userId
            },
            order: [['created_at', 'DESC']],
            userId
        })

        res.json({ message: "user posts sucessfuly fetched", data: { posts: posts } });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

exports.deletePost = async function (req, res) {
    try {
        const postId = req.params.id;

        // Busque o post a ser excluído
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Busque todas as imagens associadas ao post
        const postImages = await PostImage.findAll({ where: { post_id: postId } });

        // Exclua todas as imagens associadas ao post
        for (const postImage of postImages) {
            await postImage.destroy();
        }

        // Exclua o post após excluir as imagens associadas
        await post.destroy();

        return res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Error deleting post' });
    }
};

exports.createPost = async function (req, res) {
    const { description } = req.body;

    console.log(req.body);
    console.log(req.user);
    try {
        // Crie o post no banco de dados usando o modelo Post
        const createdPost = await Post.create({
            description: description,
            users_id: req.user.userId,
        });

        res.status(201).json({
            message: 'Post created successfully',
            post: createdPost,
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post' });
    }
};

exports.uploadPostImages = async function (req, res) {
    try {
        // Verifique se o arquivo foi enviado no req.file
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // return
        const { originalname, mimetype, filename, size, key, location: url = '' } = req.file;

        // return

        // Crie o registro de imagem do post no banco de dados usando o modelo PostImage
        const createdImage = await PostImage.create({
            post_id: req.body.postId, // Substitua pelo ID do post ao qual a imagem está associada
            originalname,
            type: mimetype,
            path: req.file.path,
            filename: key,
            url,
            size,
        });

        res.status(201).json({
            message: 'Image uploaded successfully',
            data: {
                image: createdImage,
            }
        });
    } catch (error) {
        if (error instanceof multer.MulterError) {
            // Erro de Multer (por exemplo, tamanho de arquivo excedido)
            return res.status(400).json({ message: 'File size limit exceeded' });
        } else {
            console.error('Error uploading image:', error);
            res.status(500).json({ message: 'Error uploading image' });
        }
    }
};

exports.likePost = async function (req, res) {
    try {
        const postId = req.params.postId;
        const userId = req.user.userId;

        await PostLike.create({
            post_id: postId,
            user_id: userId,
        });

        res.json({ message: 'You liked the post.' });
    } catch (error) {
        console.log(error);
        if (error.parent?.sqlState === '23000') {

            if (error.index === 'fk_users_has_posts_posts1' && error.value === String(req?.params?.postId)) {
                return res.status(404).json({ message: 'The post does not exist.' });

            } else if (error.parent.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Post already liked previously.' });
            }
        } else {
            console.error('Error liking the post:', error);
            res.status(500).json({ message: 'Error liking the post.' });
        }
    }
};

exports.unlikePost = async function (req, res) {
    try {
        const postId = req.params.postId;
        const userId = req.user.userId;

        const deletedCount = await PostLike.destroy({
            where: {
                post_id: postId,
                user_id: userId,
            },
        });

        if (deletedCount === 0) {
            return res.status(400).json({ message: 'Post not liked previously.' });
        }

        res.json({ message: 'You unliked the post.' });
    } catch (error) {
        console.error('Error unliking the post:', error);
        res.status(500).json({ message: 'Error unliking the post.' });
    }
};


exports.getPostLikes = async function (req, res) {
    try {
        const postId = req.params.postId;
        const userId = req.query.userId || null; // userId é opcional, pode ser null se não estiver disponível

        // Consulta ao banco de dados para obter os likes do post
        const likes = await PostLike.findAll({
            where: {
                post_id: postId,
            },
        });

        const likedPost = userId
            ? await PostLike.findOne({
                where: {
                    post_id: postId,
                    user_id: userId,
                },
            })
            : null;

        res.json({ likes: likes.length, likedPost: likedPost !== null });
    } catch (error) {
        const postId = req.params.postId;

        console.error(`Error fetching likes for post ${postId}:`, error);
        res.status(500).json({ message: `Error fetching likes for the post ${postId}` });
    }
};

exports.checkLike = async function (userId, postId) {
    try {
        const postId = req.params.postId;
        const userId = req.query.userId;

        const likedPost = await PostLike.findOne({
            where: {
                post_id: postId,
                user_id: userId,
            },
        })

        res.json({ likedPost: likedPost });
    } catch (error) {

    }
}
