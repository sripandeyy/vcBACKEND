const mongoose = require('mongoose');

// Instructions:
// 1. Paste your MongoDB Atlas connection string below in the 'uri' variable.
//    (It should look like: mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority)
// 2. Run this script with: node scripts/test-db-connection.js

const uri = "mongodb+srv://srijanpandey2969_db_user:LX9cADCzcE7iIFC5@cluster0.8zmbhxj.mongodb.net/?appName=Cluster0";

async function testConnection() {
    if (uri === "YOUR_ATLAS_CONNECTION_STRING_HERE") {
        console.error("❌ Error: Please edit this file and replace 'YOUR_ATLAS_CONNECTION_STRING_HERE' with your actual connection string.");
        console.log("   (Don't forget to replace the <password> part with your real password!)");
        process.exit(1);
    }

    console.log("⏳ Attempting to connect to MongoDB Atlas...");
    try {
        await mongoose.connect(uri);
        console.log("✅ SUCCESS! Connected to MongoDB Atlas successfully.");
        console.log("   --> This means your User/Password is correct.");
        console.log("   --> This means your Network Access (IP Whitelist) is configured correctly.");
        console.log("   --> You can now safely paste this URI into Render.");
    } catch (error) {
        console.error("❌ CONNECTION FAILED:");
        console.error(error.message);
        console.log("\nPossible causes:");
        console.log("1. Wrong Password (did you replace <password>?).");
        console.log("2. IP blocked (did you add 0.0.0.0/0 to Network Access in Atlas?).");
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
