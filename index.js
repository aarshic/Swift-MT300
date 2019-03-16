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
// var xl = require('excel4node');
 
// Create a new instance of a Workbook class
// var wb = new xl.Workbook();
 

// Add Worksheets to the workbook
// var ws = wb.addWorksheet('SG Proposed Data for Sampling');
// var ws2 = wb.addWorksheet('Sheet 2');


var xlsx = require('node-xlsx');
// var fs = require('fs');
var obj = xlsx.parse(__dirname + '/NewSampleData_930PM/one_to_one/Sample/SG_one_to_one/sg.xlsx'); // parses a file
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

var obj1 = xlsx.parse(__dirname + '/NewSampleData_930PM/one_to_one/Sample/Client_one_to_one/client.xlsx'); // parses a file
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
var tblnm = 'Fa';
var csvf = 'test1.csv';
var dbn = 'swift';
var tbln = 'Fa4';

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
            // console.log(hdr);
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            fields += `${hdr} VARCHAR(255)`;
            fieldnms += `${hdr}`;
            // console.log(fieldnms);
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
            // console.log(hdr);
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



function function1() {}
function function2() {
    con.query('SELECT a82A, a87A, a77H, a30T, a30V, a36, a32B, a57A, a33B, a30V, a56, a57D, a58A, a24D FROM Fa', function(err, results) {
        if(err){
            console.log(err);
        }
        else{
            // console.log(results);
            con.query('SELECT a82A, a87A, a77H, a30T, a30V, a36, a32B, a57A, a33B, a30V, a56, a57D, a58A, a24D FROM Fa4', function(err1, results1) {
                if(err1){
                    console.log(err1);
                }
                else{
                    // console.log(results1);
                    // var obj = JSON.parse(data);
                    // var obj1 = JSON.parse(results);
                    // var obj2 = JSON.parse(results1);
                    var obj1 = results;
                    var obj2 = results1;

                    var flag=true;
                    var count=0;
                    var miscount=0;
                    // console.log("reached");    
                    // console.log(obj1[0]);
                    // console.log(obj2[0]);
                    // if(Object.keys(obj1).length==Object.keys(obj2).length){
                    for(var i=0; i<obj1.length; i++){
                        for(var j=0; j<obj2.length; j++){
                            // console.log("reached");
                            if(JSON.stringify(obj1[i].a82A) == JSON.stringify(obj2[j].a87A)) {
                                // console.log("reached");
                                if(JSON.stringify(obj1[i].a87A) == JSON.stringify(obj2[j].a82A)) {
                                    // console.log("reached");
                                    if(JSON.stringify(obj1[i].a77H) == JSON.stringify(obj2[j].a77H)) {
                                        // console.log("reached");
                                        if(JSON.stringify(obj1[i].a30T) == JSON.stringify(obj2[j].a30T)) {                                       
                                            // console.log("reached");
                                            if(JSON.stringify(obj1[i].a57A) == JSON.stringify(obj2[j].a57A)) {
                                                // console.log("reached");
                                                if(JSON.stringify(obj1[i].a56) == JSON.stringify(obj2[j].a56)) {
                                                    // console.log("reached");
                                                    if(JSON.stringify(obj1[i].a57D) == JSON.stringify(obj2[j].a57D)) {
                                                        // console.log("reached");
                                                        if(JSON.stringify(obj1[i].a58A) == JSON.stringify(obj2[j].a58A)) {
                                                            // console.log("reached");
                                                            if(JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) {                                       
                                                                if(JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) {                                                    
                                                                    if(JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a33B)) {
                                                                        if(JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a32B)) {
                                                                            // console.log("reached");
                                                                            count++;
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for(var i=0; i<obj1.length; i++){
                        for(var j=0; j<obj2.length; j++){
                            if(JSON.stringify(obj1[i].a82A) == JSON.stringify(obj2[j].a87A)) {
                                if(JSON.stringify(obj1[i].a87A) == JSON.stringify(obj2[j].a82A)) {
                                    if(JSON.stringify(obj1[i].a77H) == JSON.stringify(obj2[j].a77H)) {
                                        if(JSON.stringify(obj1[i].a30T) == JSON.stringify(obj2[j].a30T)) {                                       
                                            if(JSON.stringify(obj1[i].a57A) == JSON.stringify(obj2[j].a57A)) {
                                                if(JSON.stringify(obj1[i].a56) == JSON.stringify(obj2[j].a56)) {
                                                    if(JSON.stringify(obj1[i].a57D) == JSON.stringify(obj2[j].a57D)) {
                                                        if(JSON.stringify(obj1[i].a58A) == JSON.stringify(obj2[j].a58A)) {
                                                            if(((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36))) || ((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B))) || ((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B))) || ((JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) && (JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B))) || ((JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B))) || ((JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B))) || ((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) && (JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B))) || ((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B))) || ((JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) && (JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B))) || ((JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) && (JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B)))) {
                                                                miscount++;
                                                                break;
                                                            }
                                                            // if(((JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a32B)) && (JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a33B)))){
                                                            //     miscount++;
                                                            // }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    var z = Object.keys(obj1).length
                    z = z-miscount-count;
                    console.log("is object equal " + flag + " count=" + count + " miscount=" + miscount + " unmatched=" + z);
                }
            });
        }
    });
}
function1();
setTimeout(function2, 15000);











app.use(bodyParser.json());


app.use("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
    // res.end();
});


const PORT= 3000;

app.listen(PORT,()=>{console.log("Server started successfully")});