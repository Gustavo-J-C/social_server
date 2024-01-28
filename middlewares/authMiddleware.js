const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Recupere o token JWT do cabeçalho Authorization
  const token = req.header('Authorization');

  console.log(token);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verifique se o token é válido
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token expired or invalid' });
    }
    req.user = user; // Defina o usuário no objeto de solicitação para uso posterior
    next();
  });
}

module.exports = authenticateToken;
