/* eslint-disable global-require */
import _ from 'lodash';

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  graphql: {
    port: 8000
  },
  google: {
    clientId: '642053553564-j60r998ufv2tntmcnl1ebc7nvdli0jdg.apps.googleusercontent.com',
    clientSecret: 'PzXfYgbDzQmVIRwjIl582Fby'
  },
  server: 'relay-passport-google.herokuapp.com'
};

export default _.extend(config, require(`./${config.env}`).default);
