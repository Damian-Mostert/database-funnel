import { DatabaseModel } from "./lib/database-model";
import mysql from "mysql2/promise";

const mysqlConfig = {
  host: process.env.NEXT_PUBLIC_MYSQL_HOST,
  port: process.env.NEXT_PUBLIC_MYSQL_PORT,
  user: process.env.NEXT_PUBLIC_MYSQL_USER,
  password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD,
  database: process.env.NEXT_PUBLIC_MYSQL_DATABASE,
};
const connection = mysql.createConnection(mysqlConfig);

export class MysqlModel extends DatabaseModel {
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

const migrate = (table, rules, connection) => {
  connection
    //try make the table;
    .query(`CREATE TABLE ${table} (id INT AUTO_INCREMENT, PRIMARY KEY (id))`)
    .then(async (s) => {
      //migrate
      (await buildRules(rules, table, connection)).map((q) => {
        connection.query(`${q}`).catch((e) => {
          connection.query(q.replace("ADD", "MODIFY")).catch((r) => {
            console.warn(r);
          });
        });
      });
    })
    .catch(async (e) => {
      //table probably exists, migrate;
      (await buildRules(rules, table, connection)).map((q) => {
        connection.query(`${q}`).catch((e) => {
          connection.query(q.replace("ADD", "MODIFY")).catch((r) => {
            console.warn(r);
          });
        });
      });
    });
};


const buildRules = async (rules, table, connection) => {
  try {
    // Describe the table to get existing column names
    const [res] = await connection.query("DESCRIBE `" + table + "`");
    const fields = res?.map((x) => x.Field) || [];

    // Find old keys (columns not included in rules and not the primary key)
    const oldKeys = fields.filter(
      (i) => !Object.keys(rules).includes(i) && i !== "id"
    );

    // Drop old keys (columns)
    for (const k of oldKeys) {
      await connection.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${k}\``);
    }

    // Build ALTER TABLE statements for new columns based on rules
    const alterTableStatements = Object.keys(rules).map((key) => {
      const rule = rules[key];
      let type, nullable, unique, def;

      if (Array.isArray(rule)) {
        type = rule[0];
        nullable = rule.includes(null);
        unique = rule.includes("unique");
        def =
          rule
            .find((r) => typeof r === "string" && r.startsWith("default:"))
            ?.split("default:")[1] || null;
      } else {
        throw new Error("invalid rule", rule);
      }

      let options =
        (nullable ? " NULL" : " NOT NULL") + (def ? " DEFAULT " + def : "");

      // If unique is true, add unique constraint; otherwise, drop existing unique index if any

      if (!unique)
        connection
          .query(`ALTER TABLE \`${table}\` DROP INDEX \`unique_${key}\``)
          .catch((e) => {
            //console.log(e)
          });
      else
        connection
          .query(
            `ALTER TABLE \`${table}\` ADD CONSTRAINT  \`unique_${key}\` UNIQUE (\`${key}\`)`
          )
          .catch((e) => {
            //console.log(e)
          });

      switch (type) {
        case "text":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` TEXT${options}`;
        case "string":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` VARCHAR(300)${options}`;
        case "number":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` INT${options}`;
        case "double":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` DOUBLE${options}`;
        case "boolean":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` BOOLEAN${options}`;
        case "object":
        case "array":
          return `ALTER TABLE \`${table}\` ADD COLUMN \`${key}\` JSON${options}`;
        default:
          throw new Error("invalid rule type", rule);
      }
    });
    return alterTableStatements;
  } catch (error) {
    console.error("Error in buildRules:", error);
    throw error;
  }
};

