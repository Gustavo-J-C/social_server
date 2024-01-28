const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE, process.env.MYSQL_USER , process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_HOST,
  dialect: 'mysql',
  port: process.env.MYSQL_PORT,
  define: { 
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
   }
});

// Testar a conexão com o banco de dados
sequelize
  .authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

module.exports = sequelize;