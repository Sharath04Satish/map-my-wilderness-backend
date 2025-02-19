import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import protobuf from "protobufjs";

const PORT = 3000;
const app = express();
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = `${process.env.MONGO_DB_URI}`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function fetchData() {
    try {
        await client.connect();
        console.log("Connected to database");

        const database = client.db(`${process.env.MONGO_DB_NAME}`);
        const collection = database.collection(`${process.env.MONGO_DB_COLLECTION_1}`);

        const result = await collection.find().toArray();
        return result;
    } finally {
        await client.close();
    }
}

let nationalParks = await fetchData().catch(console.dir);
nationalParks = nationalParks.map((park) => {
    return {
        ...park,
        _id: park._id.toString()
    }
});

app.get("/json", (req, res) => {
    res.json(nationalParks);
});

const root = protobuf.loadSync("./proto_schema/national_park.proto");
const NationalParksList = root.lookupType("nationalParkPackage.NationalParksList");
const nationalParksList = NationalParksList.create({ nationalParks });
const buffer = NationalParksList.encode(nationalParksList).finish();

app.get('/protobuf', (req, res) => {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(buffer);
});
