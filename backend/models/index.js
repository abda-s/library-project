'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// Ensure dotenv is loaded if it hasn't been already (e.g. when running migrations)
// server.js already calls this, but it's good practice for CLI usage.
if (process.env.NODE_ENV !== 'production') { // Avoid loading dotenv in production if vars are set directly
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

let sequelize;

// Prioritize environment variables, then fall back to config.json values
const dbConfig = {
  username: process.env.DB_USERNAME || config.username,
  password: process.env.DB_PASSWORD || config.password,
  database: process.env.DB_DATABASE || config.database,
  host: process.env.DB_HOST || config.host,
  dialect: process.env.DB_DIALECT || config.dialect,
  logging: config.logging === undefined ? false : config.logging, // Keep logging from config or default to false
  dialectOptions: config.dialectOptions || {} // Keep dialectOptions from config
};

// Add specific environment variables for test environment if needed
if (env === 'test') {
  dbConfig.username = process.env.DB_USERNAME_TEST || config.username;
  dbConfig.password = process.env.DB_PASSWORD_TEST || config.password;
  dbConfig.database = process.env.DB_DATABASE_TEST || config.database;
  dbConfig.host = process.env.DB_HOST_TEST || config.host;
  dbConfig.dialect = process.env.DB_DIALECT_TEST || config.dialect;
}


if (config.use_env_variable && process.env[config.use_env_variable]) {
  // This block handles if config.json specifies a single ENV VAR for the full connection string
  // e.g. "use_env_variable": "DATABASE_URL"
  sequelize = new Sequelize(process.env[config.use_env_variable], dbConfig); // Pass merged dbConfig for other options
} else {
  // This is the more common case: construct from individual parameters
  if (!dbConfig.dialect) {
    throw new Error('Database dialect is not defined. Please set DB_DIALECT in .env or config.json.');
  }
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
