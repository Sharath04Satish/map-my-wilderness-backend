require('dotenv').config();
const axios = require("axios");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@primary-cluster.vjeq4.mongodb.net/?retryWrites=true&w=majority&appName=primary-cluster`;

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
        console.log("Pinged mongo-db server");
        console.log(data[4]);
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
        if (response.status == 200) {
            if (response?.data?.data) {
                handleResponseData(response.data.data);
            }
        }
    }
}).catch((error) => {
    console.log(error);
});

const handleResponseData = (data) => {
    responseData = []
    np_data = data.forEach(site => {
        if (site?.fullName?.includes("National Park")) {
            trimmedSite = {
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

