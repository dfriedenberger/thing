var dadUtils = require('./lib/dad-utils');




if(process.argv.length == 2)
{
    console.log("node thing.js <command> <parameter>");
    console.log("Use following commands:");
    console.log(" init                                      - create keys and publish public key");
    console.log(" lsdid                                     - list did");
    console.log(" get-did <did>                             - get document");
    console.log(" get-dad <did> <chain>                     - get dad document");
    console.log(" verify-did <did>                          - verify local document");
    console.log(" verify-dad <did> <chain>                  - verify local dad document");
    console.log(" send-file-enc <file> <chain> <enc-did>    - send file encrypted");
    console.log(" recv-file-enc <did> <chain>               - recv file and decrypt");
    console.log(" send-file-chain <file> <prior-did> <prior-chain> <chain>");
    process.exit(0);
}


switch(process.argv[2])
{
    case "init":
        dadUtils.createKeypair();
        dadUtils.publishPublicKey();
        break;
    case "lsdid":
        dadUtils.listDID();
        break;
    case "get-did":
       if(process.argv.length == 4)
       {
         dadUtils.getDID(process.argv[3]);
       }
       break;
    case "get-dad":
        if(process.argv.length == 5)
        {
          dadUtils.getDAD(process.argv[3],process.argv[4]);
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
            dadUtils.verifyDAD(process.argv[3],process.argv[4]);
        }
        break;
    case "send-file-enc":
        if(process.argv.length == 6)
        {
          dadUtils.sendFileEncrypted(process.argv[3],process.argv[4],process.argv[5]);
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



