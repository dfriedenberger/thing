var dadUtils = require('./lib/dad-utils');




if(process.argv.length == 2)
{
    console.log("node thing.js <command> <parameter>");
    console.log("Use following commands:");
    console.log(" init                                      - create keys and publish public key");
    console.log(" lsdid                                     - list did");
    console.log(" get-did <did>                             - get document");
    console.log(" get-dad <did> <chain>                     - get dad document");
    console.log(" send-file-enc <chain> <enc-did> <file>    - send file encrypted");
    console.log(" recv-file-enc <did> <chain>               - recv file and decrypt");
    console.log(" send-file-chain <chain> <prior-did> <prior-chain> <file>");
    process.exit(0);
}


switch(process.argv[2])
{
    case "init":
        dadUtils.createKeypair();
        dadUtils.publishPublicKey();
        break;
    case "lsdid":
        {
          var did = dadUtils.getDID();
          console.log("did",did);
        }
        break;
    case "get-did":
       if(process.argv.length == 4)
       {
         let did = process.argv[3];
         dadUtils.getDID(did).then(() => {

            //verify
            dadUtils.verifyDID(did);
            
         });
       }
       break;
    case "get-dad":
        if(process.argv.length == 5)
        {
          var did = process.argv[3];
          var chain = process.argv[4];
          dadUtils.getDAD(did,chain).then(() => {
            //verify
            dadUtils.verifyDAD(did,chain);
            dadUtils.recvFileEncrypted(did,chain);

         });
        }
        break;
    case "verify-did":
        if(process.argv.length == 4)
        {
          dadUtils.verifyDID(process.argv[3]);
        }
        break;
    case "verify-dad":
        if(process.argv.length == 5)
        {
          var did = process.argv[3];
          var chain = process.argv[4];
          dadUtils.verifyDAD(did,chain);
        }
        break;
    case "send-file-enc":
        if(process.argv.length == 6)
        {
          var chain = process.argv[3];
          var encDid = process.argv[4];
          var file = process.argv[5];
          dadUtils.sendFileEncrypted(chain,encDid,file);
        }
        break;
    case "send-file-chain":
        if(process.argv.length == 7)
        {
          dadUtils.sendFileChained(process.argv[3],process.argv[4],process.argv[5],process.argv[6]);
        }
        break;
    case "recv-file-enc":
        if(process.argv.length == 5)
        {
          dadUtils.recvFileEncrypted(process.argv[3],process.argv[4]);
        }
        break;
    default:
        console.log("unknown command:",process.argv[2]);
        break;

}



