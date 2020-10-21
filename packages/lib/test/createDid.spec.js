var expect    = require("chai").expect;
var assert    = require("chai").assert;
var createDid = require("../src/createDid");

describe("createDid", function() {
  
    it("not a public key", async function() {

        assert.throws(() => createDid('not-a-public-key'), Error, "Not an extended public key");
        
    });

    it("with valid public key", async function() {
    
        var result = createDid('xpub661MyMwAqRbcFm9UCFWxy8pwEC2TE6EsNhX6Mh3wUtPUkSnqAyb4xtZ2rFfEnsz7ZxBwSNyhKcnQYGHRXYhYjnGLRwoWHhxutMWtEbMEehK');
        expect(result).to.equal("did:dad:AhRhqds7f8FCyMhpqZSc6LXV3ZVa9MPK9HKftsy5M6Ti");
        
    });
});