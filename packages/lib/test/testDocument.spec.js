var expect    = require("chai").expect;
const signDocument = require("../src/signDocument");
const parseMessage = require("../src/parseMessage");
const verifyDocument = require("../src/verifyDocument");

var xprikey = "xprv9s21ZrQH143K3H516DyxbztCgABxpdX21UbVZJeKvYrVseTgdSGpR6EYzzgBZ8PjuCic46eebXt8JswK7xmGo7cC8NH7W9cPRhzJZyTtfhd";
var xpubkey = "xpub661MyMwAqRbcFm9UCFWxy8pwEC2TE6EsNhX6Mh3wUtPUkSnqAyb4xtZ2rFfEnsz7ZxBwSNyhKcnQYGHRXYhYjnGLRwoWHhxutMWtEbMEehK";

describe("testDocument", function() {
  
    it("sign and verify", async function() {
    

        var document = JSON.stringify({ test : "test" },null,2);

        var message = signDocument(document,xprikey);
        expect(message).not.to.be.undefined;

        var parsed = parseMessage(message);

        var valid = verifyDocument(parsed.document,parsed.signature,xpubkey);
        expect(valid).to.be.true;

    });

});