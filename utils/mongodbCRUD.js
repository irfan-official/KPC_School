import connectDB from "../connections/mongodb.connection.js";
import { ObjectId } from "mongodb";

export async function createOne({ data, collectionName }) {
  const db = await connectDB();
  return db.collection(collectionName).insertOne(data);
}

export async function find({ data = {}, collectionName, options = {} }) {
  const db = await connectDB();
  return db.collection(collectionName).find(data, options).toArray();
}

export async function findOne({ data, collectionName }) {
  const db = await connectDB();
  return db.collection(collectionName).findOne(data);
}

export async function findById(id) {
  const db = await connectDB();
  return db.collection(collectionName).findOne({ _id: new ObjectId(id) });
}

export async function updateFood(id, updateObj) {
  const db = await connectDB();
  const result = await db
    .collection("foods")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateObj });
  return result;
}

export async function deleteFood(id) {
  const db = await connectDB();
  const result = await db
    .collection("foods")
    .deleteOne({ _id: new ObjectId(id) });
  return result;
}
