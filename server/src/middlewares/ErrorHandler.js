// common error handler page 
const ErrorHandling = (err, req, res, next) =>{
    console.log(err.stack);
    res.status(500).json({
        status :500,message :"Something went Wrong",error:err.message,
    })
}
// PGHOST=localhost
// PGPORT=5432
// PGUSER=postgres
// PGPASSWORD=mysecretpassword
// PGDATABASE=banti

export default ErrorHandling;