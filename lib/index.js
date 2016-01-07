"use strict";

var HttpClientFactory = require("./http/HttpClientFactory");

module.exports = {
  HalClient: require("./HalClient"),
  createHalClient: function createHalClient() {
    return HttpClientFactory.createHttpClient();
  }
};
