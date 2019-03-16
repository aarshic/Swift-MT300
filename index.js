'use strict';
var async = require('async');
const parse = require('csv-parse/lib/es5');
// const fs = require('fs');
var http = require('http');
var express = require('express');
// var SwiftParser = require('swift-parser').SwiftParser;
var mysql = require('mysql');
var fs = require('fs');
const util = require('util');
const csvHeaders = require('csv-headers');
const app=express();
const mongoose=require("mongoose");
const bodyParser=require('body-parser');
// var parser = new SwiftParser();

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'asdfjkl',
    database: 'swift'
});

con.connect(function(err){
    if(err) {
        throw err;
    }
    console.log("Connected to the database!");
});





// con.query("CREATE DATABASE provider", function (err, result) {  
//     if (err) throw err;  
//     console.log("Database created");  
// });  

// const eol = require('eol');

// var fs = require('fs');
// var path = require('path');

// var process = require("process");

// var x = "Sample_data/ProposedDataforSampleData/ClientProposedDataforSampleData";

// fs.readdir(x, function (err, files) {
//     if (err){
//         console.log(err);
//     }
//     files.forEach(function (file, index) {
//         console.log(file);
//         fs.readFile(x + "/" + file, 'utf8', function(error, content) {
//             if (error) {
//                console.log(error);
//             }
//             else{
//                 console.log('OK: ' + file);
//                 console.log(content);
//                 // con.query("CREATE DATABASE client", function (err, result) {  
//                 //     if (err) throw err;  
//                 //     console.log("Database created");  
//                 // });
//             }
//         });
//     });
// });





// Require library
var xl = require('excel4node');
 
// Create a new instance of a Workbook class
var wb = new xl.Workbook();
 

// Add Worksheets to the workbook
var ws = wb.addWorksheet('SG Proposed Data for Sampling');
var ws2 = wb.addWorksheet('Sheet 2');


var xlsx = require('node-xlsx');
// var fs = require('fs');
var obj = xlsx.parse(__dirname + '/Sample_data/ProposedDataforSampleData/ProposedDataforSample.xlsx'); // parses a file
// onj = obj.sheet('SG Proposed Data for Sampling');
var rows = [];
var writeStr = "";

for(var i = 0; i < obj.length; i++){
    var sheet = obj[i];
    for(var j = 0; j < sheet['data'].length; j++){
        rows.push(sheet['data'][j]);
    }
}
for(var i = 0; i < rows.length; i++){
    writeStr += rows[i].join(",") + "\n";
}
fs.writeFile(__dirname + "/test.csv", writeStr, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("test.csv was saved in the current directory!");
});

var obj1 = xlsx.parse(__dirname + '/Sample_data/ProposedDataforSampleData/Server.xlsx'); // parses a file
// onj = obj.sheet('SG Proposed Data for Sampling');
var rows = [];
var writeStr = "";

for(var i = 0; i < obj1.length; i++){
    var sheet1 = obj1[i];
    for(var j = 0; j < sheet1['data'].length; j++){
        rows.push(sheet1['data'][j]);
    }
}
for(var i = 0; i < rows.length; i++){
    writeStr += rows[i].join(",") + "\n";
}
fs.writeFile(__dirname + "/test1.csv", writeStr, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("test1.csv was saved in the current directory!");
});



var csvfn = 'test.csv';
var dbnm = 'swift';
var tblnm = 'Fr';
var csvf = 'test1.csv';
var dbn = 'swift';
var tbln = 'Fr4';

new Promise((resolve, reject) => {
    csvHeaders({
        file      : csvfn,
        delimiter : ','
    }, function(err, headers) {
        if (err) reject(err);
        else resolve({ headers });
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        context.db = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'asdfjkl',
            database : dbnm
        });
        context.db.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                reject(err);
            } else {
                resolve(context);
            }
        });
    })
})
.then(context => {
    return new Promise((resolve, reject) => {
        context.db.query(`DROP TABLE IF EXISTS ${tblnm}`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        var fields = '';
        var fieldnms = '';
        var qs = '';
        context.headers.forEach(hdr => {
            hdr = hdr.replace(' ', '_');
            hdr = hdr.replace(':', 'a');
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            fields += `${hdr} VARCHAR(255)`;
            fieldnms += `${hdr}`;
            qs += ' ?';
        });
        context.qs = qs;
        context.fieldnms = fieldnms;
        context.db.query(`CREATE TABLE ${tblnm} ( ${fields} );`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvfn).pipe(parse({
            delimiter: ',',
            columns: true,
            relax_column_count: true
        }, (err, data) => {
            // console.log(data);  
            if (err) return reject(err);
            async.eachSeries(data, (datum, next) => {
                var d = [];
                try {
                    context.headers.forEach(hdr => {
                        d.push(datum[hdr]);
                    });
                } catch (e) {
                    console.error(e.stack);
                }
                if (d.length > 0) {
                    context.db.query(`INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} );`, d,
                    err => {
                        if (err) { console.error(err); next(err); }
                        else setTimeout(() => { next(); });
                    });
                } else { console.log(`empty row ${util.inspect(datum)} ${util.inspect(d)}`); next(); }
            },
            err => {
                if (err) reject(err);
                else resolve(context);
            });
        }));
    });
})
.then(context => { 
    console.log("Task Completed");
    context.db.end();
})
.catch(err => { 
    console.error(err.stack); 
});



new Promise((resolve, reject) => {
    csvHeaders({
        file      : csvf,
        delimiter : ','
    }, function(err, headers) {
        if (err) reject(err);
        else resolve({ headers });
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        context.db = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'asdfjkl',
            database : dbn
        });
        context.db.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                reject(err);
            } else {
                resolve(context);
            }
        });
    })
})
.then(context => {
    return new Promise((resolve, reject) => {
        context.db.query(`DROP TABLE IF EXISTS ${tbln}`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        var fields = '';
        var fieldnms = '';
        var qs = '';
        context.headers.forEach(hdr => {
            hdr = hdr.replace(' ', '_');
            hdr = hdr.replace(':', 'a');
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            fields += `${hdr} VARCHAR(255)`;
            fieldnms += `${hdr}`;
            qs += ' ?';
        });
        context.qs = qs;
        context.fieldnms = fieldnms;
        context.db.query(`CREATE TABLE ${tbln} ( ${fields} );`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvf).pipe(parse({
            delimiter: ',',
            columns: true,
            relax_column_count: true
        }, (err, data) => {
            // console.log(data);  
            if (err) return reject(err);
            async.eachSeries(data, (datum, next) => {
                var d = [];
                try {
                    context.headers.forEach(hdr => {
                        d.push(datum[hdr]);
                    });
                } catch (e) {
                    console.error(e.stack);
                }
                if (d.length > 0) {
                    // if(flag==1){
                    //     setTimeout((function() {  
                    //         return process.exit(22);
                    //     }), 1000);
                    // }
                    context.db.query(`INSERT INTO ${tbln} ( ${context.fieldnms} ) VALUES ( ${context.qs} );`, d,
                    err => {
                        if (err) { console.error(err); next(err); }
                        else setTimeout(() => { next(); });
                    });
                    // console.log("second");
                } else { console.log(`empty row ${util.inspect(datum)} ${util.inspect(d)}`); next(); }
            },
            err => {
                if (err) reject(err);
                else resolve(context);
            });
        }));
    });
})
.then(context => { 
    console.log("Task Completed");
    context.db.end();
})
.catch(err => { 
    console.error(err.stack); 
});





// new Promise((resolve, reject) => {
//     setTimeout((function() {  
//         return process.exit(1);
//     }), 100);
// })
// .then(context => {
//     return new Promise((resolve, reject) => {
//         con.query('SELECT a82A, a87A FROM Fr', function(err, results) {
//             if(err){
//                 console.log(err);
//             }
//             else{
//                 console.log(results);
//             }
//         });
//     })
// })



function function1() {
    // stuff you want to happen right away
    // console.log('Welcome to My Console,');
}
function function2() {
    // all the stuff you want to happen after that pause
    con.query('SELECT a82A, a87A FROM Fr', function(err, results) {
        if(err){
            console.log(err);
        }
        else{
            console.log(results);
        }
    });
}
// call the first chunk of code right away
function1();
// call the rest of the code and have it execute after 3 seconds
setTimeout(function2, 20000);





// var myInt = setInterval(function () {
//     // console.log("Hello");
// }, 500);

// con.query('SELECT a82A, a87A FROM Fr', function(err, results) {
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log(results);
//     }
// });
















app.use(bodyParser.json());


app.use("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
    // res.end();
});


const PORT= 3000;

app.listen(PORT,()=>{console.log("Server started successfully")});