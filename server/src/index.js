const express = require('express');
const cors = require('cors');
const pool = require('./config/db.js');
const { default: ErrorHandling } = require('./middlewares/ErrorHandler.js');
const metadataRoutes = require('./routes/metadata.routes'); 
require('dotenv').config(); 
const app = express();
const PORT = 3000;
 

//middleware
app.use(express.json());
app.use(cors());

//routes


//error handling middleware
app.use(ErrorHandling);

//connection test
app.get("/",async(req,res)=>{
    console.log(res);
    const result = await pool.query("select current_database()");
    res.send(`The database name is : ${result.rows[0].current_database}`);
})


// GET /api/metadata/tables
app.use('/api/metadata', metadataRoutes);
 

//server running 

app.listen(PORT,() =>{
   // console.log(process.env.PGHOST);
    console.log(`Server is running on localhost :${PORT}`);
})