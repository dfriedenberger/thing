const HDKey = require('hdkey');
const fs = require('fs');
const path = require('path');
const request = require('request'); //deprecated

const crypto = require('crypto');
const ecKeyUtils = require('eckey-utils');
const curveName = 'secp256k1';
var {Base64Encode, Base64Decode}  = require('base64-stream');


const thingLib = require("@dfriedenberger/thing-lib");

module.exports = {

  

    _readConfig : function() {

        if(!fs.existsSync('config.json'))
        {
            console.log("Config file 'config.json' must exist.");
            return;
        }

        var data = fs.readFileSync('config.json');
        return JSON.parse(data);

    },

    createKeypair : function() {

        let config = this._readConfig();
        thingLib.createKeypair(config.credentialPath);

    },

    readHDKey : function(did) {

        let config = this._readConfig();
        var file = config.workingPath + "/" +did.replace(/did:dad:/, 'did_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);
        var parsed = thingLib.parseMessage(data.toString());

        var keys = JSON.parse(parsed.document);

        return HDKey.fromExtendedKey(keys.keys[0]); //Public extended Keys

    },

    listDID : function()
    {
        let config = this._readConfig();
        var hdkey = thingLib.readKeypair(config.credentialPath);
        var did = thingLib.createDid(hdkey.publicExtendedKey);
        console.log("did",did);
    },


    publishPublicKey : function() {

        let config = this._readConfig();
        var hdkey = thingLib.readKeypair(config.credentialPath);
        var did = thingLib.createDid(hdkey.publicExtendedKey);

        //Key Document
        var keys = {
            "id" : did,
            "changed" : new Date(),
            "keys" : [hdkey.publicExtendedKey.toString()]
        }
        
        var document = JSON.stringify(keys, null, 2);
        var message = thingLib.signDocument(document,hdkey.privateExtendedKey);

        var file = config.workingPath+"/"+did.replace(/did:dad:/, 'did_')+".json";
        
        console.log("write and send:",file);
        fs.writeFileSync(file, message);

        const options = {
            method: "POST",
            url: config.server + "/upload",
            headers: {
                //"Authorization": "Basic " + "xxx",
                "Content-Type": "multipart/form-data"
            },
            formData : {
                "files" : [fs.createReadStream(file)]
            }
        };

        request(options, function (err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });
    
    },

    getDID : function(did) {

        let config = this._readConfig();

        return new Promise(function(resolve,reject) {

            if(!fs.existsSync(config.workingPath))
            {
                console.log("Folder '"+config.workingPath+"' must exist.");
                return;
            }

            var document = did.replace(/did:dad:/, 'did_')+".json";
            var file = config.workingPath + "/" +document;
            if(fs.existsSync(file))
            {
                console.log("Cannot create '"+document+"'. It already exists.");
                return;
            }

            const options = {
                method: "GET",
                url: config.server + "/files/"+document,
                headers: {
                    //"Authorization": "Basic " + "xxx",
                }
            };

            request(options, function (err, res, body) {
                if(err) 
                {
                    console.log(err);
                    reject();
                }
                else
                {
                    console.log("received and write:",file);
                    fs.writeFileSync(file, body);
                    resolve();
                }
                
            });
        })
    },

    getDAD : function(did,chain) {

        let config = this.readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        var hdkey = this.readHDKey(did);
        var derivedHdkey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdkey.publicExtendedKey);

        var document = ddid.replace(/did:dad:/, 'dad_')+".json";
        var file = config.workingPath + "/" +document;
        if(fs.existsSync(file))
        {
            console.log("Cannot create '"+document+"'. It already exists.");
            return;
        }

        const options = {
            method: "GET",
            url: config.server + "/files/"+document,
            headers: {
                //"Authorization": "Basic " + "xxx",
            }
        };

        request(options, function (err, res, body) {
            if(err) 
            {
                console.log(err);
            }
            else
            {
                console.log("received and write:",file);
                fs.writeFileSync(file, body);
            }
            
        });
    },
    
    verifyDID : function(did) {

        let config = this._readConfig();
        var file = config.workingPath + "/" +did.replace(/did:dad:/, 'did_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);


        var parsed = thingLib.parseMessage(data.toString());
        var keys = JSON.parse(parsed.document);

        var valid = thingLib.verifyDocument(parsed.document,parsed.signature,keys.keys[0]);
        console.log("signatur valid:", valid);
        var didValid = keys.id == did;
        console.log("did valid:", didValid);

    },

    verifyDAD : function(did,chain) {

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }


        var data = fs.readFileSync(file);
        var parsed = this.parse(data.toString());
        var valid = this.verifyMessage(parsed.message,derivedHdKey.publicExtendedKey,parsed.signature);
        console.log("signatur valid:", valid);

    },
    

    sendFileEncrypted(chain,encDid,file) {

        let config = this._readConfig();
        if(!fs.existsSync(config.workingPath))
        {
            console.log("Folder '"+config.workingPath+"' must exist.");
            return;
        }

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }        

      
        var hdkey = thingLib.readKeypair(config.credentialPath);
        var derivedHdKey = hdkey.derive("m/"+ chain);
        var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);
        var encodeKey = this.readHDKey(encDid);

        //Encrypt File
        const IV = crypto.randomBytes(16); // set random initialisation vector Buffer 16
        const filenameEncoded =  path.basename(file)+".enc"
        const fileEnc = config.workingPath+"/"+filenameEncoded;

        thingLib.encryptFile(file,fileEnc,derivedHdKey.privateKey,encodeKey.publicKey,IV)
            .then(() => thingLib.hashFile(fileEnc))
            .then((hash) => {

                let documentObj = {
                    id : ddid,
                    changed : new Date(),
                    payload : [{
                        "file" : filenameEncoded,
                        "iv" : IV.toString('hex'),
                        "sha256" : hash
                    }]
                };

                let document = JSON.stringify(documentObj,null,2);
                
                var signedMessage = thingLib.signDocument(document,derivedHdKey.privateExtendedKey);
                var fileDad = config.workingPath+"/"+ddid.replace(/did:dad:/, 'dad_')+".json";
                fs.writeFileSync(fileDad, signedMessage);

                const options = {
                    method: "POST",
                    url: config.server + "/upload",
                    headers: {
                        //"Authorization": "Basic " + "xxx",
                        "Content-Type": "multipart/form-data"
                    },
                    formData : {
                        "files" : [
                            fs.createReadStream(fileDad), 
                            fs.createReadStream(fileEnc)
                        ]
                    }
                };
        
                request(options, function (err, res, body) {
                    if(err) console.log(err);
                    console.log(body);
                });




            });


    },

    sendFileChained : function(file,priorDid,priorChain,chain)
    {

        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }        

        var priorHdkey = this.readHDKey(priorDid);
        var priorDerivedHdKey = priorHdkey.derive("m/"+priorChain);
        var priorDdid = this.createDid(priorDerivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var priorFileDad = config.workingPath + "/" +priorDdid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(priorFileDad))
        {
            console.log("File '"+priorFileDad+"' not exists.");
            return;
        }


        var data = fs.readFileSync(priorFileDad);

        var parsed = this.parse(data.toString());

        var valid = this.verifyMessage(parsed.message,priorDerivedHdKey.publicExtendedKey,parsed.signature);
        if(!valid)
        {
            console.log("DAD not valid.");
            return;
        }

        var prior = { id : priorDdid, sig : parsed.signature };

        var hdkey = thingLib.readKeypair(config.credentialPath);
        var derivedHdKey = hdkey.derive("m/"+ chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);



        let document = {
            id : ddid,
            changed : new Date(),
            payload : [{
                "file" : path.basename(file),
            }],
            prior : prior
        };

        var signedMessage = this.signDocument(document,derivedHdKey.privateExtendedKey);
        var fileDad = config.workingPath+"/"+ddid.replace(/did:dad:/, 'dad_')+".json";
        fs.writeFileSync(fileDad, signedMessage);

        const options = {
            method: "POST",
            url: config.server + "/upload",
            headers: {
                //"Authorization": "Basic " + "xxx",
                "Content-Type": "multipart/form-data"
            },
            formData : {
                "files" : [
                    fs.createReadStream(fileDad), 
                    fs.createReadStream(file)
                ]
            }
        };

        request(options, function (err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });





    },
    recvFileEncrypted : function(did,chain) {

        var ownhdkey = thingLib.readKeypair(config.credentialPath);

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = this.createDid(derivedHdKey.publicExtendedKey);

        let config = this.readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }


        var data = fs.readFileSync(file);

        var parsed = this.parse(data.toString());

        var valid = this.verifyMessage(parsed.message,derivedHdKey.publicExtendedKey,parsed.signature);
        if(!valid)
        {
            console.log("DAD not valid.");
            return;
        }


        //get file
        let datafile = parsed.document.payload[0].file;
        let IV = Buffer.from(parsed.document.payload[0].iv,'hex');

        const options = {
            method: "GET",
            url: config.server + "/files/"+datafile,
            headers: {
                //"Authorization": "Basic " + "xxx",
            }
        };

        request(options, function (err, res, body) {
            if(err) 
            {
                console.log(err);
            }
            else
            {
                console.log("received and write:",datafile);
                fs.writeFileSync(config.workingPath +"/" + datafile, body);

                //Decrypt
                const ec = crypto.createECDH(curveName);
                ec.setPrivateKey(ownhdkey.privateKey);

                //Create secret with Diffie Hellman
                var secret = ec.computeSecret(derivedHdKey.publicKey);

                // Encrypt file
                const ENC_KEY = Buffer.from(secret,'hex'); // set random encryption key, Buffer 32
                let decipher = crypto.createDecipheriv('aes-256-cbc',ENC_KEY, IV);

                const input = fs.createReadStream(config.workingPath +"/" + datafile); 
                const output = fs.createWriteStream(config.workingPath +"/" + datafile.slice(0, -4));

                input.pipe(new Base64Decode()).pipe(decipher).pipe(output).on("close",() => {

                        console.log("sucessful decoded");
                });

            }
            
        });

    }
   
}