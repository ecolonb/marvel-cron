const { Client } = require("pg");

class Database {
  client;

  constructor() {}

  async connect() {
    const dataBaseConfig = {
      user: process.env.dbUser,
      host: process.env.host,
      database: process.env.dbName,
      password: process.env.userSecret,
      port: Number(process.env.port),
      statement_timeout: 10000
    };
    this.client = new Client({ ...dataBaseConfig });
    this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async query(sql) {
    return await this.client.query(sql);
  }
}

module.exports = Database;
