// common error handler page 
const ErrorHandling = (err, req, res, next) =>{
    console.log(err.stack);
    res.status(500).json({
        status :500,message :"Something went Wrong",error:err.message,
    })
}

module.exports ={ErrorHandling};