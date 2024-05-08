import mysql from "mysql2/promise";
import migrate from "./migrate";

const mysqlConfig = {
  host: process.env.NEXT_PUBLIC_MYSQL_HOST,
  port: process.env.NEXT_PUBLIC_MYSQL_PORT,
  user: process.env.NEXT_PUBLIC_MYSQL_USER,
  password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD,
  database: process.env.NEXT_PUBLIC_MYSQL_DATABASE,
};
var connection = null;

export function init(config) {
  connection = mysql.createConnection(mysqlConfig);
}
export class Model {
  constructor(table, rules) {
    super();
    this.rules = rules;
    this.table = table;
    this.connection = null;
    this.init();
  }
  query = null;
  async init() {
    if (!this.connection) {
      this.connection = await connection;
    }
    migrate(this.table, this.rules, this.connection);
  }

  get = async () => {
    try {
      await this.init();
      const [results] = await this.connection.query(
        `SELECT * FROM \`${this.table}\` ${this.query ? this.query : ""}`
      );
      this.query = null;
      const res = results.map((res) => {
        for (let key of Object.keys(res)) {
          let bool = this.rules[key]?.[0] == "boolean";
          if (bool) {
            res[key] = Boolean(res[key]);
          }
        }
        return res;
      });
      console.log(res);
      return res;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  first = async () => {
    const docs = await this.get();
    return docs[0];
  };

  where = (column, operator, value) => {
    if (value === true || value === 1) value = "1";
    if (value === false || value === 0) value = "0";
    if (operator == "==") operator = "=";
    if (!this.query) {
      this.query = "WHERE " + column + " " + operator + " '" + value + "'";
    } else {
      this.query += " AND " + column + " " + operator + " '" + value + "'";
    }
    return this;
  };

  orderBy = (i, asc = "asc") => {
    this.query += " ORDER BY `" + i + "`" + asc.toUpperCase();
    return this;
  };

  update = async (data) => {
    for (let key of Object.keys(data)) {
      const [results] = await this.connection.query(
        "UPDATE " +
          key +
          " = " +
          "`" +
          data[key] +
          "`" +
          this.table +
          " SET " +
          built[this.table]
      );
    }
    this.query = null;
  };

  async delete() {
    const [results] = await this.connection.query(
      "DELETE FROM " + this.table + this.query
    );
    this.query = null;
  }

  make = async (data) => {
    const res = await this.connection.query(
      `INSERT INTO \`${this.table}\` (${Object.keys(data)
        .map((item) => `'${item}' `)
        .join(",")}) VALUES(${Object.keys(data)
        .map((item) => `\`${data[item]}\``)
        .join(",")})`
    );
    return res.id;
  };
}
