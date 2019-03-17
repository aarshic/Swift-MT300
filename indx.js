'use strict';
var async = require('async');
const parse = require('csv-parse/lib/es5');
// const fs = require('fs');
// var http = require('http');
var express = require('express');
// var request = require('request');
// var SwiftParser = require('swift-parser').SwiftParser;
var mysql = require('mysql');
var fs = require('fs');
const util = require('util');
const csvHeaders = require('csv-headers');
const app=express();
// const mongoose=require("mongoose");
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

var xlsx = require('node-xlsx');
var obj = xlsx.parse(__dirname + '/NewSampleData_930PM/one_to_one/Sample/SG_one_to_one/sg.xlsx'); // parses a file
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
var tblnm = 'Fe';
var csvf = 'test1.csv';
var dbn = 'swift';
var tbln = 'Fe4';

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

app.use(bodyParser.json());

// request.get('http://localhost:3000', (err, res, data)=>{
// });

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
    var count=0;
    var miscount=0;
    var y=0;
    // var y=new Promise((resolve, reject) => {
    //     function(err, response){
    //         if (err) reject(err);
    //         else resolve({ response });
    
    //     };
    // })
    var g=[];
    var h=[];
    var data=[];
    var total=0;
    var w=0;
    function function1() {}
    function function2() {
        con.query('SELECT a82A, a87A, a77H, a30T, a30V, a36, a32B, a57A, a33B, a30V, a56, a57D, a58A, a24D FROM Fe', function(err, results) {
            if(err){
                console.log(err);
            }
            else{
                // console.log(results);
                con.query('SELECT a82A, a87A, a77H, a30T, a30V, a36, a32B, a57A, a33B, a30V, a56, a57D, a58A, a24D FROM Fe4', function(err1, results1) {
                    if(err1){
                        console.log(err1);
                    }
                    else{
                        var obj1 = results;
                        var obj2 = results1;
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
                                                                if(JSON.stringify(obj1[i].a30V) == JSON.stringify(obj2[j].a30V)) {                                       
                                                                    if(JSON.stringify(obj1[i].a36) == JSON.stringify(obj2[j].a36)) {                                                    
                                                                        if(JSON.stringify(obj1[i].a32B) == JSON.stringify(obj2[j].a33B)) {
                                                                            if(JSON.stringify(obj1[i].a33B) == JSON.stringify(obj2[j].a32B)) {
                                                                                count++;
                                                                                break;
                        }   }    }   }   }   }   }   }   }   }   }   }   }   }
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
                                                                    g.push(i);
                                                                    h.push(j);
                                                                    break;
                                }   }   }   }   }   }   }   }   }   
                            }
                        }
                        var z = Object.keys(obj1).length;
                        z = z-miscount-count;
                        y = z;
                        total = y+miscount+count;
                        console.log("Matched=" + count + " Miscount/Closefit=" + miscount + " Unmatched=" + z);
                    }
                });
            }
        });
    }    
    function1();
    setTimeout(function2, 1000);
    miscount=1;
    y=10-miscount-count;
    // var total = m[0]+m[1]+m[2];
    // var l;
    var total = y+miscount+count;
    // var w = function(){};
    // w(l, function(error, m) {
    //     if (error) return next(error);
    //     console.log(m[2]);
    //     var total = m[0]+m[1]+m[2];    
    //     return response.render('index', {matched: m[0], mismatched: m[1], unmatched: m[2], total: total});
    //   });
    // var e = function processData() {   
    //     let data = fetchDataInAFarAwayAndMysticDatabase();   
    //     data += 1;   
    //     return data; 
    // }
    // console.log(y);
    // for(var t=0; t<g.length; t++){
        // console.log(g[t]);
    // }
    res.render('index', {matched: count, mismatched: miscount, unmatched: y, total: total});
});
app.use(express.static(__dirname + '/public'));

const PORT= 3000;

app.listen(PORT,()=>{console.log("Server started successfully")});