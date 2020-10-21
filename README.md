Background
==========

Todo

Build Docker-Image
==================

```
$ docker build -t frittenburger/thing .
``` 
Run Docker-Image
==================

```
$ docker run --rm -it --privileged frittenburger/thing bash
``` 

thing
=====
cd thing/
editor config.json
# server => 192.168.2.206
mkdir .credentials
mkdir tmp
node thing.js init

node thing.js get-did did:dad:A9X4PM1IAcoLlxdUwI_N92283ok3LAlcR0n-kFZcyiAt
node thing.js verify-did did:dad:A9X4PM1IAcoLlxdUwI_N92283ok3LAlcR0n-kFZcyiAt

//streamer -c /dev/video0 -f jpeg -o test.jpeg
streamer -c /dev/video0 -f rgb24 -t 00:00:03 -o out.avi

node thing.js send-file-enc out.avi 0/1 did:dad:A9X4PM1IAcoLlxdUwI_N92283ok3LAlcR0n-kFZcyiAt
node thing.js lsdid

service
=======
  node thing.js init
  node thing.js get-did did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6
  node thing.js verify-did did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6
  node thing.js get-dad did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6 0/1
  node thing.js verify-dad did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6 0/1
  node thing.js recv-file-enc did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6 0/1
  mv tmp/out.avi tmp/processed.avi
  node thing.js send-file-chain tmp/processed.avi did:dad:A_i0BTbPlz8RHw8PpM2V262qTshJYN_V9vvmCNRT7Xk6 0/1 0/2711

  curl http://192.168.2.206:3000/files/processed.avi --output x.avi