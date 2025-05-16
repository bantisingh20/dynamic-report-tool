// common error handler page 
// const ErrorHandling = (err, req, res, next) =>{
//     console.log(err.stack);
//     res.status(500).json({
//         status :500,message :"Something went Wrong",error:err.message,
//     })
// }

const handleError = (err, req, res, next) => {
  
  if (err.status === 400) {
    // 400 Bad Request
    console.log('Bad Request:', err);
    return res.status(400).json({
      status: 400,
      message: err.message || 'Bad Request',
      error: err.error || 'Invalid input or data.'
    });
  }
   console.error(500);
  // 500 Internal Server Error (fallback for other errors)
  console.error(err.stack);
  return res.status(500).json({
    status: 500,
    message: 'Something went wrong.',
    error: err.message || 'Unknown error occurred.'
  });
};

//export  {handleError};
module.exports = { handleError };

 