FROM balenalib/raspberry-pi-node

RUN install_packages git
RUN git clone https://github.com/dfriedenberger/thing.git
RUN cd thing;npm i



