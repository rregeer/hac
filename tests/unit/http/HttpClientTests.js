"use strict";

var assert = require("chai").assert;
var Promise = require("bluebird");
var sinon = require("sinon");

var HttpClient, requestStub, sandbox;

module.exports["Http Client GET"] = {
  beforeEach: function beforeEach() {
    sandbox = sinon.sandbox.create();
    HttpClient = require("../../../lib/http/HttpClient");
    requestStub = sandbox.stub({
      getAsync: function getAsync() {}
    });
  },
  afterEach: function afterEach() {
    sandbox.restore();
  },
  "Passes the url correctly to request request interface.": function passesUrlCorrectly() {
    var client, expectedRequestOptions, url;

    requestStub.getAsync.returns(Promise.resolve([{statusCode: 200}, "SomeBody"]));

    client = new HttpClient(requestStub);
    url = "http://www.example.com";

    expectedRequestOptions = {
      url: url,
      headers: []
    };

    return client.get(url, [])
      .then(function assertMethod(result) {
        assert.strictEqual(result.statusCode, 200);
        assert.strictEqual(result.body, "SomeBody");

        assert.strictEqual(requestStub.getAsync.callCount, 1);
        assert.deepEqual(requestStub.getAsync.firstCall.args[0], expectedRequestOptions);
      });
  }
};
