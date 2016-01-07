"use strict";

var assert = require("chai").assert;
var sinon = require("sinon");

var ResourceFactory, resourceFactory, sandbox;

module.exports["Resource factory testst"] = {
  beforeEach: function beforeEach() {
    sandbox = sinon.sandbox.create();
    ResourceFactory = require("../../../lib/hal/ResourceFactory");

    resourceFactory = new ResourceFactory();
  },
  afterEach: function afterEach() {
    sandbox.restore();
  },
  "Create resource withour relations": function createResourceWithoutRelations() {
    var body, resource;

    body = {
      _links: {
        self: {
          href: "http://accountaccount.example.com/accounts/1"
        }
      },
      accountId: "1",
      name: "test"
    };

    resource = resourceFactory.createResource(JSON.stringify(body));

    assert.deepEqual(resource.links, {
      self: {
        href: "http://accountaccount.example.com/accounts/1"
      }
    });
    assert.deepEqual(resource.data, {
      accountId: "1",
      name: "test"
    });
  },
  "Create resource with relations": function createResourceWithRelations() {
    var body, resource;

    body = {
      _links: {
        self: {
          href: "http://accountaccount.example.com/accounts/1"
        },
        "address": {
          href: "http://account.example.com/accounts/{accountId}/addresses/",
          templated: true
        }
      },
      accountId: "1",
      name: "test"
    };

    resource = resourceFactory.createResource(JSON.stringify(body));

    assert.deepEqual(resource.links, {
      self: {
        href: "http://accountaccount.example.com/accounts/1"
      },
      "address": {
        href: "http://account.example.com/accounts/{accountId}/addresses/",
        templated: true
      }
    });
    assert.deepEqual(resource.data, {
      accountId: "1",
      name: "test"
    });
  },
  "Create resource with a single embedded relation": function createWithOnceEmbeddedRelation() {
    var body, resource;

    body = {
      _links: {
        self: {
          href: "http://accountaccount.example.com/accounts/1"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      },
      _embedded: {
        "address": {
          _links: {
            self: {
              href: "http://account.example.com/accounts/1/addresses/"
            }
          },
          addressId: "10",
          street: "abcStreet"
        }
      },
      accountId: "1",
      name: "test"
    };

    resource = resourceFactory.createResource(JSON.stringify(body));

    assert.deepEqual(resource.embeddedResources["address"].links, {
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    });
    assert.deepEqual(resource.embeddedResources["address"].data, {
      addressId: "10",
      street: "abcStreet"
    });
  },
  "Create resource with nested embedded relations": function createWithNestedEmbeddedRelation() {
    var body, resource;

    body = {
      _links: {
        self: {
          href: "http://accountaccount.example.com/accounts/1"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      },
      _embedded: {
        "address": {
          _links: {
            self: {
              href: "http://account.example.com/accounts/1/addresses/"
            },
            "default": {
              href: "http://account.example.com/accounts/1/addresses/default"
            }
          },
          _embedded: {
            "default": {
              _links: {
                self: {
                  href: "http://account.example.com/accounts/1/addresses/default"
                }
              },
              addressId: "11",
              street: "defaultStreet"
            }
          },
          addressId: "10",
          street: "abcStreet"
        }
      },
      accountId: "1",
      name: "test"
    };

    resource = resourceFactory.createResource(JSON.stringify(body));

    assert.deepEqual(resource.embeddedResources["address"].embeddedResources["default"].links, {
      self: {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    });
    assert.deepEqual(resource.embeddedResources["address"].embeddedResources["default"].data, {
      addressId: "11",
      street: "defaultStreet"
    });
  },
  "Throw a error if _links is missing": function noLinks() {
    this.skip();
  },
  "Throw a error if self relation is missing": function noSelfLink() {
    this.skip();
  }
};
