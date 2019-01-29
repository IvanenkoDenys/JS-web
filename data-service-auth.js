const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

var Schema = mongoose.Schema; 
//mongodb://<Denys>:<123qwerty>@ds115352.mlab.com:15352/web322_a6     NEW CONNECTION 
//mongoose.createConnection("mongodb://divanenko:123qwerty@ds115352.mlab.com:15352/web322_a6"); OLD ONE 

var userSchema = new Schema({
    "userName" : {
        "type": String,
        "unique": true
    },
    "password" : String,
    "email" : String,
    "loginHistory" : [{
        "dateTime" : Date,
        "userAgent" : String
    }]
});

let User;

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
         let db = mongoose.createConnection('mongodb://Denys:123qwerty@ds115352.mlab.com:15352/web322_a6');//unable to sync the database? ? ?
         //let db = mongoose.createConnection('mongodb://localhost:27017/web322_week8'); 
         db.on('error', (err)=>{
             reject(err); // reject the promise with the provided error
    });
      db.once('open', ()=>{
              User = db.model("users", userSchema);
             resolve();
        });
    });
   };
   
   module.exports.registerUser = function(userData) {
        return new Promise(function(resolve,reject){
            if (userData.password != userData.password2){
                reject("Passwords do not match!");
            }
            else {
                let newUser  = new User(userData);
                bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
                bcrypt.hash(userData.password, salt, function(err, hash) { // encrypt the password: "myPassword123"
                newUser.password = hash;
                if(err){
                    reject("There was an error encrypting the password");
                };
                newUser.save().then(() => {
                }).catch((err) => {
                    if (err = 11000){
                        reject("User Name already taken");
                    }
                    else {
                        reject("There was an error creating the user: " + err);
                    }
                }).then(()=>{
                    resolve();
                });
                    })             
            });
            };         
        });
   };

   module.exports.checkUser = function(userData) {
        return new Promise(function(resolve,reject){
            User.find({ userName: userData.userName })
            .exec()
            .then((users)=>{
                if (users == ""){
                    reject("Unable to find user: " +  userData.userName);
                };
                bcrypt.compare(userData.password, users[0].password).then((res) => {
                    if (res=== true){
                        users[0].loginHistory.push(
                                {dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                                //saves data but does not print in html ?? 
                            User.update(
                                {userName : users[0].userName},
                                {$set : {loginHistory: users[0].loginHistory} },
                                { multi: false})
                                .exec()
                                .then(()=> {
                                    resolve(users[0])
                                }).catch((err) =>{
                                    reject("There was an error verifying the user: " +err); 
                                });                        
                    }
                    else {
                        reject("Incorrect password for user: " +  userData.userName);
                    }
                   });
            }).catch((err) =>{
                reject("Something went wrong!");
            });
        });
   };
   
   