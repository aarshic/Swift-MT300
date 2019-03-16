'use strict';
var http = require('http');
var express = require('express');
var SwiftParser = require('swift-parser').SwiftParser;
var mysql = require('mysql');
var fs = require('fs');

const csvHeaders = require('csv-headers');
const bodyParser=require('body-parser');
const app=express();

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






var xlsx = require('node-xlsx');
// var fs = require('fs');
var obj = xlsx.parse(__dirname + '/Sample_data/ProposedDataforSampleData/ProposedDataforSample.xlsx'); // parses a file
var rows = [];
var writeStr = "";

//looping through all sheets
for(var i = 0; i < obj.length; i++)
{
    var sheet = obj[i];
    //loop through all rows in the sheet
    for(var j = 0; j < sheet['data'].length; j++)
    {
        //add the row to the rows array
        rows.push(sheet['data'][j]);
    }
}

//creates the csv string to write it to a file
for(var i = 0; i < rows.length; i++)
{
    writeStr += rows[i].join(",") + "\n";
}

//writes to a file, but you will presumably send the csv as a      
//response instead
fs.writeFile(__dirname + "/test.csv", writeStr, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("test.csv was saved in the current directory!");
});





var csvfn = 'test.csv';
var dbnm = 'swift';
var tblnm = 'client';
var q = `SELECT * FROM ${tblnm}`;

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
        console.log("Begin");
        context.headers.forEach(hdr => {
            hdr = hdr.replace(' ', '_');
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            fields += ` ${hdr} TEXT`;
            fieldnms += ` ${hdr}`;
            qs += ' ?';
        });
        context.qs = qs;
        context.fieldnms = fieldnms;
        // console.log(`about to create CREATE TABLE IF NOT EXISTS ${tblnm} ( ${fields} )`);
        context.db.query(`CREATE TABLE IF NOT EXISTS ${tblnm} ( ${fields} )`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
        console.log("done");

    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvfn).pipe(parse({
            delimiter: ',',
            columns: true,
            relax_column_count: true
        }, (err, data) => {
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
                    if(flag==1){
                        setTimeout((function() {  
                            return process.exit(22);
                        }), 1000);
                    }
                    context.db.query(`INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} )`, d,
                    err => {
                        if (err) { console.error(err); next(err); }
                        else setTimeout(() => { next(); });
                    });
                    var y = count/133;
                    con.query(q, function(err, respond){
                        if(err){
                            throw err;
                        }
                        else{
                            // console.log(respond);
                            x++;
                            if(y==x){
                                x=0;
                                var stop = readline.question("If you want to stop and delete this table them press 0: ");
                                if(stop==0){
                                    con.query(`DROP TABLE IF EXISTS ${tblnm}`, function(err, respond){
                                        if(err){
                                            throw err;
                                        }
                                        else{
                                            flag=1;
                                            console.log("Table Deleted");
                                            process.exit();
                                        }
                                    });
                                }   
                            }
                        }
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






var server = http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('SGC');
    console.log("Connected to server");
});
server.listen(3000);





