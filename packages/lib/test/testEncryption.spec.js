var expect    = require("chai").expect;
const encryptFile = require("../src/encryptFile");
const decryptFile = require("../src/decryptFile");
const crypto = require('crypto');
const fs = require('fs');




var alicePublic = Buffer.from("02682600126f2e2a1a66ff9b888e0c9376fdf5843ff6b9eee584a2b48a60d7b24b","hex");
var alicePrivate = Buffer.from("4cd93523820f573bd92aaf9830ccefa86808f306f7d79d977b8b1980bb91cf8f","hex");

var bobPublic = Buffer.from("02c6819e74ba4490e4638af9a13d704b1318b0ff304552ef448f48f9e0b854ca50","hex");
var bobPrivate = Buffer.from("ffdbf4bd5dccf948d0bf46ca80caf0fd181ab43da30fe1c3a6b657e29063753e","hex");

describe("testEnryption", function() {
  
    it("encrypt and decrypt", async function() {
    
        var tmpdir = "mocha-test-"+new Date().getTime();

        var file = tmpdir+"/test.txt";
        var fileEnc = tmpdir+"/test.txt.enc";
        var fileDec = tmpdir+"/test.txt.dec";

        fs.mkdirSync(tmpdir);
        fs.writeFileSync(file,"hello world");

        const IV = crypto.randomBytes(16); // set random initialisation vector Buffer 16

        await encryptFile(file,fileEnc,alicePrivate,bobPublic,IV);
        await decryptFile(fileEnc,fileDec,bobPrivate,alicePublic,IV);

        var text = fs.readFileSync(fileDec,'ascii');
      
        expect(text).to.be.equal("hello world");

        fs.unlinkSync(file);
        fs.unlinkSync(fileEnc);
        fs.unlinkSync(fileDec);
        fs.rmdirSync(tmpdir);

    });

});