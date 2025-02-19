import dotenv from 'dotenv';
dotenv.config();
import axios from "axios";

import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = `${process.env.MONGO_DB_URI}`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run(data) {
    try {
        await client.connect();
        console.log("Connected to database");
        const database = client.db(`${process.env.MONGO_DB_NAME}`);
        const collection = database.collection(`${process.env.MONGO_DB_COLLECTION_1}`);

        const del_result = await collection.deleteMany({});
        if (del_result?.acknowledged === true) {
            const options = { ordered: true };
            const result = await collection.insertMany(data, options);
            console.log(`${result.insertedCount} documents were inserted`);
        } else {
            console.log("Delete failed");
        }
    } finally {
        await client.close();
    }
}

const responseLimit = 500;
axios.get(`https://developer.nps.gov/api/v1/parks?limit=${responseLimit}`, {
    headers: {
        "x-api-key": `${process.env.API_KEY}`
    }
}).then((response) => {
    if (response) {
        if (response.status === 200) {
            if (response?.data?.data) {
                handleResponseData(response.data.data);
            }
        }
    }
}).catch((error) => {
    console.log(error);
});

const handleResponseData = (data) => {
    let responseData = []
    data.forEach(site => {
        if (site?.fullName?.includes("National Park")) {
            const trimmedSite = {
                "id": site.id,
                "url": site.url,
                "name": site.fullName,
                "parkCode": site.parkCode,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "states": site.states
            }
            responseData.push(trimmedSite);
        }
    });

    run(responseData).catch(console.dir);
}

