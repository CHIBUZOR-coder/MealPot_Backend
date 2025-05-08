import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const pool = new pg.Pool({
  user: "postgres",
  password: process.env.DB_PASSWORD,
  host: "localhost",
  port: 5432,
  database: "mealpot",
});

//named export
// export {pool}
// Test the database connection with try-catch
const testDbConnection = async () => {
  try {
    await pool.connect();
    console.log("Connected to the database successfully.");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

// Call the test function
testDbConnection();
//default export
export default pool;
