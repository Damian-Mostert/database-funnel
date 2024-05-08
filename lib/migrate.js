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
export default migrate;

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
