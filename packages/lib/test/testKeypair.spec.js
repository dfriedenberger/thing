var expect    = require("chai").expect;
const fs = require("fs");
const createKeypair = require("../src/createKeypair");
const readKeypair = require("../src/readKeypair");

describe("createKeypair", function() {
  
    it("with not existing folder", async function() {
    
        var result = createKeypair('not-existing-folder');
        expect(result).to.false;
        
    });

    it("create and read", async function() {
    
        var tmpdir = "mocha-test-"+new Date().getTime();

        fs.mkdirSync(tmpdir);
        var result = createKeypair(tmpdir);
        expect(result).to.true;

        var keys = readKeypair(tmpdir);
        expect(keys.publicExtendedKey.indexOf("xpub")).to.be.equal(0);
        expect(keys.privateExtendedKey.indexOf("xprv")).to.be.equal(0);
        
        fs.unlinkSync(tmpdir+"/key.xprv");
        fs.unlinkSync(tmpdir+"/key.xpub");
        fs.rmdirSync(tmpdir);
        
    });

    it("do not overwrite key", async function() {
    
        var tmpdir = "mocha-test-"+new Date().getTime();

        fs.mkdirSync(tmpdir);
        fs.writeFileSync(tmpdir+"/key.xprv");

        var result = createKeypair(tmpdir);
        expect(result).to.false;

        fs.unlinkSync(tmpdir+"/key.xprv");
        fs.rmdirSync(tmpdir);
        
    });

  });