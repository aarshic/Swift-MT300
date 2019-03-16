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


var csvfn = 'test.csv';
var dbnm = 'swift';
var tblnm = 'p';

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
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            fields += `${hdr} VARCHAR(255)`;
            fieldnms += `${hdr}`;
            qs += ' ?';
        });
        context.qs = qs;
        context.fieldnms = fieldnms;
        // console.log(`( ${fields} )`);
        // context.db.query(`CREATE TABLE ${tblnm} ( ${fields} );`,
        // context.db.query(`CREATE TABLE IF NOT EXISTS ${tblnm}`,
        var a = `CREATE TABLE ${tblnm} ( a20 VARCHAR(255),a22A VARCHAR(255),a22C VARCHAR(255),a30T VARCHAR(255),a52A VARCHAR(255),a82A VARCHAR(255),a87A VARCHAR(255),a77H VARCHAR(255),a30V VARCHAR(255),a36 VARCHAR(255),a32B VARCHAR(255),a57A VARCHAR(255),a33B VARCHAR(255),a53A VARCHAR(255),a56 VARCHAR(255),a57D VARCHAR(255),a58A VARCHAR(255),a24D VARCHAR(255) );`;
        // console.log(a);
        context.db.query(a,
        [ ],
        err => {
            if (err)
            // {
                // console.log(err);
            // } 
            reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        // console.log("yoyo");
        fs.createReadStream(csvfn).pipe(parse({
            delimiter: ',',
            columns: true,
            relax_column_count: true
        }, (err, data) => {
            console.log(data);
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
                    console.log(`( ${context.fieldnms} )`);
                
                    // context.db.query(`INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} );`, d,
                    var a = `INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} );`;
                    console.log(a);
                    context.db.query(a,
                    err => {
                        if (err) { console.error(err); next(err); }
                        else setTimeout(() => { next(); });
                    });
                    console.log("second");
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