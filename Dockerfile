FROM node:4.0

WORKDIR /opt
RUN mkdir -p /opt
ADD . /opt
RUN npm install

# Expose the ports that your app uses. For example:
EXPOSE 3000

CMD node bin/www