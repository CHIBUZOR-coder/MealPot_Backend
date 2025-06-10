// import pg from "pg";
// import dotenv from "dotenv";
// dotenv.config();
// const pool = new pg.Pool({
//   user: "postgres",
//   password: process.env.DB_PASSWORD,
//   host: "localhost",
//   port: 5432,
//   database: "mealpot",
// });

// //named export
// // export {pool}
// // Test the database connection with try-catch
// const testDbConnection = async () => {
//   try {
//     await pool.connect();
//     console.log("Connected to the database successfully.");
//   } catch (err) {
//     console.error("Error connecting to the database:", err);
//   }
// };

// // Call the test function
// testDbConnection();
// //default export
// export default pool;
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USERNAME, // Use the username from the environment variable
  password: process.env.DB_PASSWORD, // Ensure no quotes are included
  host: process.env.DB_HOST, // Host from environment variable
  port: process.env.DB_PORT, // Port from environment variable
  database: process.env.DB_DATABASE, // Database name from environment variable
});

// Test the database connection with try-catch
const testDbConnection = async () => {
  try {
    await pool.connect();
    console.log("Connected to the database successfully.");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  } finally {
    await pool.end(); // Close the pool to prevent hanging connections
  }
};

// Call the test function
testDbConnection();

// Default export

export default pool;
