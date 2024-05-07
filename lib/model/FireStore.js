import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { getApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { DatabaseModel } from "./lib/database-model";
import { AuthModel } from "./lib/auth-class";

const validate = (data, blueprint) => {
  /*  Object.keys(data).map(() => {
      throw new "Invalid key "();
    }); */
  return data;
};

//init db;
var app;
try {
  //try get app;
  app = getApp();
} catch (e) {
  //if failed make app;
  app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}

export class FireStoreModel extends DatabaseModel {
  constructor(name, blueprint) {
    super(name, blueprint);
  }
  database = getFirestore(app);

  reset = () => {
    //reset query;
    this.query = null;
    return this;
  };
  orderBy = (a) => {
    let last_query = this.query ? this.query : (collection) => collection;
    let new_query = (collection) =>
      query(last_query(collection), orderBy(a));
    let instance = new FireStoreModel(this.collection_name, this.blueprint);
    instance.query = new_query;
    //return a new instance
    return instance;
  };
  where = (a, b, c) => {
    //if there is a query else make blank;
    let last_query = this.query ? this.query : (collection) => collection;
    //create new query with data
    let new_query = (collection) =>
      query(last_query(collection), where(a, b, c));
    let instance = new FireStoreModel(this.collection_name, this.blueprint);
    instance.query = new_query;
    //return a new instance
    return instance;
  };

  update = async (data) => {
    //throw error if no query
    if (!this.query) throw new Error("No query called before update.");
    //validate input
    data = validate(data, this.blueprint);
    //get docs from query;
    const docs = await this.get();
    //make batch;
    const batch = writeBatch(this.database);
    //update each document;
    for (const document of docs)
      batch.update(doc(this.database, this.collection_name, document.id), data);
    //commit batch;
    await batch.commit();
    return this;
  };
  make = async (data) => {
    //throw a error if a query was called;
    if (this.query) throw new Error("There was a query called before make.");
    //validate data;
    data = validate(data, this.blueprint);
    //add document;
    const document = await addDoc(
      collection(this.database, this.collection_name),
      data
    );
    //update document, force id;
    const batch = writeBatch(this.database);
    batch.update(doc(this.database, this.collection_name, document.id), {
      id: document.id,
    });
    //commit batch;
    await batch.commit();
    //reset query;
    this.reset();
    //return new documents id;
    return document.id;
  };
  delete = async () => {
    const docs = await this.get();
    for (const document of docs)
      await deleteDoc(
        doc(this.database, "/" + this.collection_name, document.id)
      );
    return this;
  };
  get = async () => {
    //get docs by query if there is a query, else just get docs;
    const docs = await getDocs(
      this.query
        ? this.query(collection(this.database, this.collection_name))
        : collection(this.database, this.collection_name)
    );
    //reset query;
    this.reset();
    //return clean data;
    return docs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  first = async () => {
    const docs = await this.get();
    return docs[0];
  };
}

export class FireStoreAuthModel extends AuthModel {
  constructor(blueprint, config) {
    super(blueprint, config);
  }
  auth = getAuth(app);
  user = async (token) => {};
  login = async (credentials) => {};
  logout = async (token) => {};
  register = async (credentials) => {};
  resetPassword = async (credentials) => {};
}
