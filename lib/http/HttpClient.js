"use strict";

var _ = require("lodash");
var Promise = require("bluebird");

module.exports = HttpClient;

function HttpClient(request) {
  request = request || Promise.promisifyAll(require("request"));
  this.request = request;
}

HttpClient.prototype.get = function get(url, headers) {
  if (_.isUndefined(url)) {
    throw new Error("Url should be defined.");
  }

  return this.request.getAsync({
    url: url,
    headers: convertHeaders(headers)
  })
    .then(function handleResponse(response) {
      return {
        statusCode: response[0].statusCode,
        body: response[1]
      };
    });
};

function convertHeaders(headers) {
  var convertedHeaders;

  convertedHeaders = [];

  _.forEach(headers, function convert(index, key) {
    convertedHeaders.push({
      name: key,
      value: headers[key]
    });
  });

  return convertedHeaders;
}
