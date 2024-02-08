const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Para gerar tokens JWT
const User = require('../models/UserModel'); // Importe o modelo de usuário

const register = async function (req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const existingUser = await User.findOne({ where: { email: email } });

    if (existingUser) {
      return res.status(402).json({ message: 'Email already in use' });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({ message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Use uma salto de 10 rounds

    // Crie um novo usuário com a senha criptografada
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    res.status(201).json({
      data: {
        message: 'User registered successfully',
        token: accessToken,
        refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).json({ message: 'Invalid reset token or user not found' });
    }

    bcrypt.hash(newPassword, 10, async (hashErr, hashedPassword) => {
      if (hashErr) {
        return res.status(500).json({ message: 'Error hashing the new password' });
      }

      user.password = hashedPassword;
  
      await user.save();

      res.status(200).json({ message: 'Password reset successful' });
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Adicione a função resetPassword aos


const login = async function (req, res, next) {
  try {
    const { email, password } = req.body;

    // Verifique se o usuário com o email fornecido existe
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).json({ message: "User account does not exist." });
    }

    // Verifique se a senha fornecida corresponde à senha armazenada (comparando hashes)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      data: {
        message: 'Login successful',
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          nickname: user.nickname
        }
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

const refreshToken = async (req, res) => {
  const refresh_token = req.headers["refresh_token"] || "";
  if (!refresh_token) {
    return res.status(401).send({ message: "Invalid refresh token" });
  }

  try {
    const decodedRefreshToken = jwt.verify(refresh_token, process.env.JWT_REFRESH_KEY)

    if (!decodedRefreshToken) {
      return res.status(401).send({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findByPk(decodedRefreshToken.userId);

    const { accessToken, refreshToken } = generateTokens(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error });
  }
};

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_KEY, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

module.exports = {
  generateTokens,
  login,
  register,
  resetPassword,
  refreshToken,
};
