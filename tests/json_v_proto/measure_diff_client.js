import axios from "axios";
import { performance } from "node:perf_hooks";
import protobuf from "protobufjs";

const root = protobuf.loadSync("./proto_schema/national_park.proto");
const NationalParksList = root.lookupType("nationalParkPackage.NationalParksList");

async function testJsonResponseTime() {
    const startTime = performance.now();
    const response = await axios.get("http://localhost:3000/json");
    console.log(`JSON Size: ${JSON.stringify(response.data).length} bytes`);
    const endTime = performance.now();

    return endTime - startTime;
}

async function testProtoBufResponseTime() {
    const startTime = performance.now();
    const response = await axios.get("http://localhost:3000/protobuf", { responseType: 'arraybuffer' });

    const buffer = Buffer.from(response.data);
    const responseData = NationalParksList.decode(buffer);
    console.log(`Protobuf Size: ${buffer.length} bytes`);
    const endTime = performance.now();

    return endTime - startTime;
}

const jsonResponseTime = await testJsonResponseTime();
console.log(jsonResponseTime);

const protobufResponseTime = await testProtoBufResponseTime();
console.log(protobufResponseTime);
