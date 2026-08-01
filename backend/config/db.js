const { Pool } = require("pg");
require("dotenv").config();

// This pool uses the DATABASE_URL password link you saved in your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This tells Supabase to allow a secure cloud connection
  },
});

pool.on("connect", () => {
  console.log(
    "ClassBridge is successfully connected to the Supabase Database!",
  );
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
