const createKeypair = require("./createKeypair");
const readKeypair = require("./readKeypair");
const createDid = require("./createDid");
const signDocument = require("./signDocument");
const parseMessage = require("./parseMessage");
const verifyDocument = require("./verifyDocument");
const encryptFile = require("./encryptFile");
const hashFile = require("./hashFile");
const decryptFile = require("./decryptFile");

module.exports = {

  createKeypair,

  readKeypair,

  createDid,

  signDocument,

  parseMessage,

  verifyDocument,

  encryptFile,

  hashFile,

  decryptFile

};