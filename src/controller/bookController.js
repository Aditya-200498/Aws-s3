const bookModel= require("../models/bookModel")
const Validator= require("../validator/validation")
const aws= require("aws-sdk")

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    // this function will upload file to aws and return the link
    let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  //HERE
        Key: "abc/" + file.originalname, //HERE 
        Body: file.buffer
    }


    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        console.log(data)
        console.log("file uploaded succesfully")
        return resolve(data.Location)
    })

    // let data= await s3.upload( uploadParams)
    // if( data) return data.Location
    // else return "there is an error"

   })
}


const createBook = async function (req, res) {

    try {

        let data = req.body
        let files= req.files
        const {title, excerpt, ISBN, userId, category, subcategory} = data

        if(files && files.length>0){
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
         
        

        if (!Validator.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, msg: "please provide some data" })
        }

        if (!title) {
            return res.status(400).send({ status: false, msg: "please provide title field." })
        }

        if (!Validator.isValid(title)) {
            return res.status(400).send({ status: false, msg: "please provide valid title." })
        }

        const duplicateTitle = await bookModel.findOne({ title: title })

        if (duplicateTitle) {
            return res.status(400).send({ status: false, msg: "Title already exists." })
        }

        if (!excerpt) {
            return res.status(400).send({ status: false, msg: "please provide excerpt field." })
        }

        if (!Validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, msg: "please provide valid excerpt." })
        }

        if (!ISBN) {
            return res.status(400).send({ status: false, msg: "please provide ISBN field." })
        }

        if (!/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN)) {
            return res.status(400).send({ status: false, msg: "ISBN is not correct." })
        }

        const duplicateISBN = await bookModel.findOne({ ISBN: ISBN })

        if (duplicateISBN) {
            return res.status(400).send({ status: false, msg: "ISBN already exists" })
        }

        if (!userId) {
            return res.status(400).send({ status: false, msg: "please provide userId field." })
        }

        if (!Validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "please provide valid userId." })
        }

        const duplicateId = await userModel.findById({ _id: userId })

        if (!duplicateId) {
            return res.status(400).send({ status: false, msg: "userId doesn't exist" })
        }

        if (!category) {
            return res.status(400).send({ status: false, msg: "please provide category field." })
        }

        if (!Validator.isValid(category)) {
            return res.status(400).send({ status: false, msg: "please provide valid category." })
        }

        if (!subcategory) {
            return res.status(400).send({ status: false, msg: "please provide subcategory." })
        }

        if (subcategory) { 
            if (Array.isArray(subcategory)) {
                const uniqueSubcategoryArr = [...new Set(subcategory)];
                data["subcategory"] = uniqueSubcategoryArr; //Using array constructor here
            }
        }


        data.releasedAt = moment().format("YYYY-MM-DD")

        if (userId !== req.userId) {

            return res.status(400).send({
                status: false,
                message: 'Unauthorised Access. Please login again!',
            });
        }

         let uploadedFileURL= await uploadFile( files[0] )
          // return res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
        }
        // else{
        //   return  res.status(400).send({ msg: "No file found" })
        // }

        const newBook = await bookModel.create(data)
        return res.status(201).send({ status: true, msg: "successful", data:uploadedFileURL , Data:newBook })

    }catch (err){
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.createBook = createBook;