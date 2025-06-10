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
  user: "postgres",
  password: process.env.DB_PASSWORD,
  host: "localhost", // Change this if necessary
  port: 5432,
  database: "mealpot",
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
