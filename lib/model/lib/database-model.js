export class DatabaseModel {
  constructor(name, blueprint) {
    this.collection_name = name;
    this.blueprint = blueprint;
  }
  query = null;
  reset = () => {};
  where = (a, b, c) => {
    /*Make query*/
    return this;
  };
  update = async (data) => {
    if (!this.query) throw new Error("No query called before update.");

    return this;
  };
  make = async (data) => {
    if (this.query) throw new Error("There was a query called before make.");
    //return id
    //return document.id;
  };
  delete = async () => {
    if (!this.query) throw new Error("No query called before delete.");
  };
  get = async () => {
    return [];
  };
  first = async () => {
    const data = await this.get();
    return data[0];
  };
}
