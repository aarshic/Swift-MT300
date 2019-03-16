var SwiftParser = require('swift-parser').SwiftParser;

// const Swift = require('swift-mock');
// const swift = new Swift();
var parser = new SwiftParser();

const eol = require('eol');

// var fs = require('fs');
// var path = require('path');
// var filePath = path.join(__dirname, 'file.txt');

// fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
//     if (err) {
//         console.log(err);
//     }
//     else {
//         tst = eol.crlf(data)
//         parser.parse(tst, function(err, res) {
//             if(err){
//                 console.log(err);
//             }
//             else{
//                 console.log(res);
//             }
//         });
//     }
// });


var fs = require('fs');
var path = require('path');

var process = require("process");

var x = "Sample_data/ProposedDataforSampleData/ClientProposedDataforSampleData";

fs.readdir(x, function (err, files) {
    if (err){
        console.log(err);
    }
    files.forEach(function (file, index) {
        console.log(file);
        // console.log(index);
        fs.readFile(x + "/" + file, 'utf8', function(error, content) {
            if (error) {
               console.log(error);
            }
            else{
                console.log('OK: ' + file);
                console.log(content);
            }
        });
        // fs.readFile(file, {encoding: 'utf-8'}, function(er,data){
        //     if (er) {
        //         console.log(er);
        //     }
        //     else {
        //         // parser.parse(data, function(err, res) {
        //         //     if(err){
        //         //         console.log(err);
        //         //     }
        //         //     else{
        //         console.log(data);
        //             // }
        //         // });    
        //     }
        // });
    });
});