const config = {
  database: {
    mongodb: {
      uri: 'mongodb://localhost/req-tracker-sample',
      options: {
        config: {
          autoIndex: false
        }
      }
    }
  }
};

export default config;
