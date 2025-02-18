require('dotenv').config();
const axios = require("axios");

const responseLimit = 500;

axios.get(`https://developer.nps.gov/api/v1/parks?limit=${responseLimit}`, {
    headers: {
        "x-api-key": `${process.env.API_KEY}`
    }
}).then((response) => {
    if (response) {
        if (response.status == 200) {
            if (response.data && response.data.data) {
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
}

