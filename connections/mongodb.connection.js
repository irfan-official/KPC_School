import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "dotenv";
config({ path: "./config/.env", debug: false });

export let db;
const uri = String(process.env.DB_URL);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export default async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("Food_Lover");
      await db.command({ ping: 1 });

      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!"
      );
    } else {
      return db;
    }
  } catch (error) {
    console.log("Mongodb connection Error => ", error.message);
  }
}
