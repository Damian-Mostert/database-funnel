# Database Funnel

Database Funnel is a lightweight Node.js library designed to simplify MySQL database operations within Node.js applications. With Database Funnel, you can effortlessly integrate MySQL databases into your Node.js projects, making tasks like CRUD operations, data retrieval, and schema management more intuitive and efficient.

## Installation

You can install Database Funnel via npm:

```bash
npm install database-funnel
```

## Getting Started

To begin using Database Funnel in your Node.js application, you need to initialize it with your MySQL database connection details. Here's how:

```javascript
import database from "database-funnel";

database.init({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
```## Getting started

To begin using Database Funnel in your Node.js application, you need to initialize it with your MySQL database connection details. Here's how:

```js
import database from "database-funnel";

database.init({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
```

### Creating Models

In Database Funnel, models represent database tables. Defining a model automatically creates the corresponding table in the database. Here's an example of how to create a model:

```js
import { Model } from "database-funnel";

const User = new Model("users", {
  name: ["string"],      // VARCHAR(300)
  surname: ["string"],   // VARCHAR(300)
  email: ["string", "unique"], // Adds uniqueness constraint
  male: ["boolean", null],    // Nullable
  female: ["boolean", null],  // Nullable
  details: ["text"],          // TEXT
  age: ["number"],            // INT
  diff: ["double", "default:0.1"], // DOUBLE with default value 0.1
});

```


## Basic Operations

Database Funnel provides methods for performing basic CRUD operations:

### Retrieve Data

- **get:** Retrieve all records from the table.
- **first:** Retrieve the first record from the table.

```javascript
await User.get();
await User.first();
```

### Create Data

- **make:** Create a new record in the table.

```javascript
await User.make({
  name: "Johnny",
});
```

### Filter Data

- **where:** Filter records based on conditions.

```javascript
const users = await User.where("name", "=", "John").get();
const user = await User.where("name", "=", "John").first();
```

### Sort Data

- **orderBy:** Sort records based on a specified column.

```javascript
await User.where("name", "=", "John").orderBy("name", "asc").get();
```

### Update Data

- **update:** Update records that match specified conditions.

```javascript
await User.where("name", "=", "John").update({ name: "Demi" });
```

## Contribution

Contributions to Database Funnel are welcome! Feel free to open issues for feature requests, bug fixes, or general improvements.

## License

Database Funnel is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
