# DATABASE FUNNEl

A tool to use mysql with node.js

### install

```plain
npm i database-funnel
```

### initializing

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

### creating a model

Models will auto migrate to the database, use it as follows:

```js
new Model("table_name", {
  /*Schema*/
});
```

#### example

```js
export const User = new Model("users", {
  name: ["string"], //varchar(300)
  surname: ["string"], //varchar(300)
  email: ["string", "unique"], //adds unique
  male: ["boolean", null], //nullable
  female: ["boolean", null], //nullable
  details: ["text"], //Text
  age: ["number"], //int
  diff: ["double", "default:0.1"], //double with default 0.1
});
```

### using a model

#### get

gets whole table.

```js
await User.get();
```

#### first

gets first result.

```js
await User.first();
```

### make

makes data in table.

```js
await User.make({
  name: "Jhonny",
});
```

#### where

adds a where query; key, operator, value

```js
const users = await User.where("name", "=", "Jhon").get();
```

```js
const user = await User.where("name", "=", "Jhon").first();
```

#### orderBy
used to order results by values
```js
await User.where("name", "=", "Jhon")
  .orderBy("name" /*"asc" or "dsc" default is "asc"*/)
  .get();
```

### update
used to update all or with query
```js
await User.where("name", "=", "Jhon").update({ name: "Demi" });
```
