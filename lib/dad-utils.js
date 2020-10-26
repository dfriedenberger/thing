const HDKey = require('hdkey');
const fs = require('fs');
const path = require('path');
const request = require('request'); //deprecated

const crypto = require('crypto');
const ecKeyUtils = require('eckey-utils');
const curveName = 'secp256k1';
var {Base64Encode, Base64Decode}  = require('base64-stream');


const thingLib = require("@dfriedenberger/thing-lib");
const { resolve } = require('path');

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

    getOwnDID : function()
    {
        let config = this._readConfig();
        var hdkey = thingLib.readKeypair(config.credentialPath);
        return thingLib.createDid(hdkey.publicExtendedKey);
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

        let config = this._readConfig();
        var that = this;
        return new Promise(function(resolve,reject) {

            if(!fs.existsSync(config.workingPath))
            {
                console.log("Folder '"+config.workingPath+"' must exist.");
                return;
            }

            var hdkey = that.readHDKey(did);
            var derivedHdkey = hdkey.derive("m/"+chain);
            var ddid = thingLib.createDid(derivedHdkey.publicExtendedKey);

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
                    resolve();
                }
                
            });
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

    _loadDad : function(did,chain) {

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);

        let config = this._readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);
        return thingLib.parseMessage(data.toString());
    },

    _loadOwnDad : function(chain) {
        let config = this._readConfig();

        var hdkey = thingLib.readKeypair(config.credentialPath);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);

        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }

        var data = fs.readFileSync(file);
        return thingLib.parseMessage(data.toString());
    },

    verifyDAD : function(did,chain) {

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);

        let config = this._readConfig();
        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }



        var data = fs.readFileSync(file);
        var parsed = thingLib.parseMessage(data.toString());

        var valid = thingLib.verifyDocument(parsed.document,parsed.signature,derivedHdKey.publicExtendedKey);
        console.log("signatur valid:", valid);

    },

    recvFileEncrypted : function(did,chain) {

        let config = this._readConfig();

        var ownhdkey = thingLib.readKeypair(config.credentialPath);

        var hdkey = this.readHDKey(did);
        var derivedHdKey = hdkey.derive("m/"+chain);
        var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);

        var file = config.workingPath + "/" +ddid.replace(/did:dad:/, 'dad_')+".json";
        if(!fs.existsSync(file))
        {
            console.log("File '"+file+"' not exists.");
            return;
        }


        var data = fs.readFileSync(file);

        var parsed = thingLib.parseMessage(data.toString());

        var dad = JSON.parse(parsed.document);

        if(dad.payload)
        {
            var payload = dad.payload[0];
            console.log("payload",payload); //TODO test if file

            //get file
            let datafile = config.workingPath +"/" + payload.file;
            let datafileDec = config.workingPath +"/" + payload.file.slice(0, -4);

            let IV = Buffer.from(payload.iv,'hex');
            let sha256 = payload.sha256;

            const options = {
                method: "GET",
                url: config.server + "/files/"+payload.file,
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
                    fs.writeFileSync(datafile, body);

                    thingLib.hashFile(datafile).then((hash) => {
                        var valid = hash == sha256;
                        console.log("hash valid:", valid);

                        return thingLib.decryptFile(datafile,datafileDec,ownhdkey.privateKey,derivedHdKey.publicKey,IV);
                    }).then(()=> {
                        console.log("sucessful decoded");
                    });

                }
                
            });
        }

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

    sendFileChained : function(chain,priorDid,priorSignature,process,file)
    {
        let config = this._readConfig();
        return new Promise(function(resolve,reject) {

            var prior = { id : priorDid, sig : priorSignature };

            var hdkey = thingLib.readKeypair(config.credentialPath);
            var derivedHdKey = hdkey.derive("m/"+ chain);
            var ddid = thingLib.createDid(derivedHdKey.publicExtendedKey);


            let documentObj = {
                id : ddid,
                changed : new Date(),
                prior : prior,
                process : process,
            
            };

            function sendDad() {
                let document = JSON.stringify(documentObj,null,2);

                var signedMessage = thingLib.signDocument(document,derivedHdKey.privateExtendedKey);
                var fileDad = config.workingPath+"/"+ddid.replace(/did:dad:/, 'dad_')+".json";
                fs.writeFileSync(fileDad, signedMessage);

                var files = [ fs.createReadStream(fileDad) ];
                if(fs.existsSync(file))
                {
                    files.push(fs.createReadStream(file));
                }

                const options = {
                    method: "POST",
                    url: config.server + "/upload",
                    headers: {
                        //"Authorization": "Basic " + "xxx",
                        "Content-Type": "multipart/form-data"
                    },
                    formData : {
                        "files" : files
                    }
                };

            
                request(options, function (err, res, body) {
                    if(err) console.log(err);
                    console.log(body);
                    resolve();
                });
            }

            if(fs.existsSync(file))
            {
                thingLib.hashFile(file).then((hash) => {
                    documentObj.payload = [{
                        "file" : path.basename(file),
                        "sha256" : hash
                    }];
                    sendDad();
                });
            } else {
                sendDad();
            }

        });


    }
   
   
}