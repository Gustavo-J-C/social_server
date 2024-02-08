const express = require('express');
const User = require('../models/UserModel');
const Follower = require('../models/FollowerModel');
const Post = require('../models/PostModel');
const UserImage = require('../models/UsersImagesModel');
const { MulterError } = require('multer');
// const  User, Followers = require('../models'); // Importe os modelos

// Rota para exibir o perfil do usuário
exports.getProfile = async function (req, res) {
    try {
        const userId = req.params.userId;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const responseObj = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
            email_verified_at: user.email_verified_at,
        }
        // Aqui você pode retornar os detalhes do perfil do usuário para exibição
        return res.json(responseObj);
    } catch (error) {
        console.error('Erro ao buscar perfil de usuário:', error);
        res.status(500).json({ message: 'Erro ao buscar perfil de usuário' });
    }
};

exports.getProfileSummary = async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestUser = req.query.requestUser;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve followers count and check if the requestUser is a follower
        const followersCount = await Follower.count({
            where: { users_followed_id: userId },
        });

        let isFriend = false;
        
        requestUser ?  isFriend = await Follower.findOne({
            where: { users_followed_id: userId, user_follower_id: requestUser },
        }) : false;

        // Retrieve following count
        const followingCount = await Follower.count({
            where: { user_follower_id: userId },
        });

        // Retrieve posts with images
        const posts = await Post.scope(['withLikeCount', 'withCommentCount', { method: ['withLikeByUser', userId] }])
            .findAll({
                where: { users_id: userId },
                include: ['post_images'],
                order: [['created_at', 'DESC']],
            });

        const userImage = await UserImage.findOne({where: {user_id: userId}})
        // Build summary object
        const summary = {
            id: user.id,
            name: user.name,
            email: user.email,
            isFriend: !!isFriend,
            followers:  followersCount,
            following: followingCount,
            userImage,
            posts,
        };

        return res.json({ message: 'User summary fetched successfully', data: summary });
    } catch (error) {
        console.error('Error fetching user summary:', error);
        res.status(500).json({ message: 'Error fetching user summary' });
    }
};

exports.getFollowing = async function (req, res) {
    try {
        const userId = req.params.userId;

        const following = await Follower.findAll({
            where: { user_follower_id: userId },
            include: [{ model: User, as: 'followingUser' }],
        });

        const followingUsers = following.map((entry) => {
            const { id, name, email } = entry.followingUser
            return {
                id,
                name,
                email
            }
        });

        return res.json({
            count: followingUsers.length,
            following: followingUsers
        });
    } catch (error) {
        console.error('Erro ao buscar usuários seguidos:', error);
        res.status(500).json({ message: 'Erro ao buscar usuários seguidos' });
    }
}

exports.getFollowers = async function (req, res) {
    try {
        const userId = req.params.userId;

        const followers = await Follower.findAll({
            where: { users_followed_id: userId },
            include: [{ model: User, as: 'followerUser' }],
        });

        const followerUsers = followers.map((entry) => {
            const { id, name, email } = entry.followerUser
            return {
                id,
                name,
                email
            }
        });

        return res.json({
            count: followerUsers.length,
            followers: followerUsers
        });
    } catch (error) {
        console.error('Erro ao buscar seguidores:', error);
        res.status(500).json({ message: 'Erro ao buscar seguidores' });
    }
}

exports.follow = async function (req, res) {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;

        await Follower.create({
            user_follower_id: userId,
            users_followed_id: targetUserId,
        });

        return res.json({ message: 'Você está seguindo o usuário agora.' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('Usuário já está sendo seguido:', error);
            return res.status(400).json({ message: 'Você já está seguindo este usuário.' });
        } else {
            console.error('Erro ao seguir o usuário:', error);
            return res.status(500).json({ message: 'Erro ao seguir o usuário.' });
        }
    }
}

exports.unfollow = async function (req, res) {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;

        const result = await Follower.destroy({
            where: {
                user_follower_id: userId,
                users_followed_id: targetUserId,
            },
        });

        if (result === 0) {
            return res.status(400).json({ message: 'Você já havia deixado de seguir este usuário.' });
        }

        return res.json({ message: 'Você deixou de seguir o usuário.' });
    } catch (error) {
        console.error('Erro ao deixar de seguir o usuário:', error);
        res.status(500).json({ message: 'Erro ao deixar de seguir o usuário' });
    }
};

exports.editProfile = async function (req, res) {
    try {
        const userId = req.params.userId;
        const { name, nickname } = req.body;

        if (!name || !name.trim() || !nickname.trim() || !nickname) {
            return res.status(400).json({ message: 'Os campos "name" e "nickname" são obrigatórios' });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Update the profile fields with the provided data
        await user.update({ name, nickname });

        return res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar perfil de usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil de usuário' });
    }
};

exports.uploadProfileImage = async function (req, res) {
    try {
        // Verifique se o arquivo foi enviado no req.file
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.params.userId;

        const user = await User.findByPk(userId);
        
        // return
        const { originalname, mimetype, filename, size, key, location: url = '' } = req.file;


        // Crie o registro de imagem do post no banco de dados usando o modelo PostImage
        const createdImage = await UserImage.create({
            user_id: userId,
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
        if (error instanceof MulterError) {
            // Erro de Multer (por exemplo, tamanho de arquivo excedido)
            return res.status(400).json({ message: 'File size limit exceeded' });
        } else {
            console.error('Error uploading image:', error);
            res.status(500).json({ message: 'Error uploading image' });
        }
    }
};