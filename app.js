const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const ejs = require('ejs')
const path = require('path');
const fetch = require('node-fetch')


const app = express();



//Google sheet url
const GoogleSheetUrl = 'https://script.google.com/macros/s/AKfycbwsVYuYFAT1Vly6NeEm3HJMbgyzMeHFMaaZOwLbD7gBMVDqWHAq/exec'

//msg91 begings here
const SendOtp = require('sendotp');

const sendOtp = new SendOtp('142648A1sxGjfZUM58b0963e',
  "Hi, your OTP is {{otp}}, please don't share it with ANYBODY!");


const contactNumber = '9115490856';

const senderId = "BLUHKS";
//end of msg91



//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static('public'))

//Body parser
app.use(express.urlencoded({extended: false}));

//Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    // cookie: {secure: true}
}));

//passport middlewares
// app.use(passport.initialize());
// app.use(passport.session());

//Connect flash
app.use(flash());

//Global variables
app.use((req, res, next)=>{
    res.locals.session = req.session;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next()
})

var definedOtp = SendOtp.generateOtp();

// app.get('/', (req, res)=>{
//     res.render('register');
// });
app.get('/', (req, res)=>{
    res.render('form')
})

//register handler
app.post('/', (req, res)=>{
    const {name, email, number, otp} = req.body;
    let errors = [];

    //check required fields
    if(!name || !email || !number || !otp){
        errors.push({msg: 'Please fill in all details'});
    }

   

    //number number should be 10 digits long
    if(number.length < 10 || number.length > 10){
        errors.push({msg: 'Enter 10 phone number digits'});
    }

    if(otp != definedOtp){
        console.log(otp+' is the otp')
        errors.push({msg: 'The OTP value is incorect, please resend the otp'});
    }

    //now
    if(errors.length > 0){
        res.render('form',{
            errors,
            name,
            email,
            number,
            otp
        })
    }else{
        //after validation has passed send data to google sheet
        const Name = req.body.name;
        const Email = req.body.email;
        const Phone = req.body.number;
        const Check = req.body.check;
        const State = req.body.state;
        const otp = req.body.otp;
      
      
        
      
        //Google sheet business logic goes here!
        const url = `${GoogleSheetUrl}?Name=${encodeURIComponent(
            Name
          )}&Email=${encodeURIComponent(Email)}&Phone=${encodeURIComponent(
            Phone
          )}&Check=${encodeURIComponent(Check)}&State=${encodeURIComponent(
            State
          )}&otp=${encodeURIComponent(
            otp
          )}`
      
      
          fetch(url)
            .then(res => {
              return res.json()
            })
            .then(res => console.log("google sheet res", { res }))
            .catch(error => console.error(error))
          res.render('form')
            
    }
})

app.post('/sendotp', (req, res)=>{
    const {number} = req.body;
    console.log(number);
    sendOtp.send(number, senderId, definedOtp, (err, data, response) => {
        if(err) {
          console.log(err);
          return;
        }
      
        console.log(data); // Data object pertaining to MSG91 alone. With "message" and "type" keys
        console.log(response); // HTTP response object which also has above data
      
      });
      
})
app.post('/verifyotp', (req, res) => {

    const {otp, number} = req.body;
  
    console.log(otp, number)
    sendOtp.verify(number, otp, (error, data) => {
        console.log(data); // data object with keys 'message' and 'type'
        if(data.type == 'success'){
           
           console.log('OTP verified successfully')
          }
        if(data.type == 'error'){
         
           console.log('OTP verification failed')
          }
      });
})

const PORT = process.env.PORT || 3030;

app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`);
})