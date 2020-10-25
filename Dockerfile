FROM balenalib/raspberry-pi-node

RUN install_packages git

RUN install_packages streamer
ADD https://api.github.com/repos/dfriedenberger/thing/git/refs/heads/master version.json
RUN git clone https://github.com/dfriedenberger/thing.git
RUN cd thing;npm i



