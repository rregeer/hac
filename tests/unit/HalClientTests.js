"use strict";

var assert = require("chai").assert;
var Promise = require("bluebird");
var Resource = require("../../lib/hal/Resource");
var sinon = require("sinon");

var HalClient, halClient, httpClientStub, resourceFactoryStub, sandbox;

module.exports["Hal client navigate relation testst"] = {
  beforeEach: function beforeEach() {
    sandbox = sinon.sandbox.create();
    HalClient = require("../../lib/HalClient");

    httpClientStub = sandbox.stub({
      get: function get() {}
    });

    resourceFactoryStub = sandbox.stub({
      createResource: function createResource() {}
    });

    halClient = new HalClient("http://example.com", httpClientStub, resourceFactoryStub);
  },
  afterEach: function afterEach() {
    sandbox.restore();
  },
  "Navigate to the root resource": function testNavigateToRootResource() {
    var rootResourceStub;

    rootResourceStub = new Resource();
    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/accounts/1"
        }
      }
    })));
    resourceFactoryStub.createResource.returns(rootResourceStub);

    return halClient.navigate()
      .then(function navigateToRoot(resource) {
        assert.deepEqual(resource, rootResourceStub);
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.strictEqual(httpClientStub.get.firstCall.args[0], "http://example.com");
      });
  },
  "Navigate to the default self relation of the given resource": function testNavigateToSelfRelation() {
    var responseResource, rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://account.example.com"
      }
    });

    responseResource = new Resource({
      self: {
        href: "/"
      }
    });

    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "/"
        }
      }
    })));
    resourceFactoryStub.createResource.returns(responseResource);

    return halClient.navigate(rootResourceStub)
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.strictEqual(httpClientStub.get.firstCall.args[0], "http://account.example.com");
        assert.deepEqual(resource, responseResource);
      });
  },
  "Navigate to the given relation": function testNavigateToRelation() {
    var responseResource, rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "authorize": {
        href: "http://account.example.com/authorize"
      }
    });

    responseResource = new Resource({
      self: {
        href: "/authorize"
      }
    });

    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "/authorize"
        }
      }
    })));
    resourceFactoryStub.createResource.returns(responseResource);

    return halClient.navigate(rootResourceStub, "authorize")
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.strictEqual(httpClientStub.get.firstCall.args[0], "http://account.example.com/authorize");
        assert.deepEqual(resource, responseResource);
      });
  },
  "Navigate to the given nested sub relation using promises": function testNavigateToSubRelation() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    });

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      }
    })));

    httpClientStub.get.onCall(1).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      }
    })));

    httpClientStub.get.onCall(2).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/accounts/1/addresses/"
        },
        "default": {
          href: "http://account.example.com/accounts/1/addresses/default"
        }
      }
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigate()
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.getCall(0).args[0], "http://example.com");
        assert.deepEqual(resource, rootResourceStub);

        return halClient.navigate(resource, "account");
      })
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.getCall(1).args[0], "http://account.example.com/");
        assert.deepEqual(resource, accountResponse);

        return halClient.navigate(resource, "address");
      })
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 3);
        assert.strictEqual(httpClientStub.get.getCall(2).args[0], "http://account.example.com/accounts/1/addresses/");
        assert.deepEqual(resource, accountAddressesResponse);
      });
  },
  "Follow the given relations from the root url and return the resource": function followeRelations() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    });

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      }
    })));

    httpClientStub.get.onCall(1).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      }
    })));

    httpClientStub.get.onCall(2).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/accounts/1/addresses/"
        },
        "default": {
          href: "http://account.example.com/accounts/1/addresses/default"
        }
      }
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigateRelations(["account", "address"])
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.getCall(0).args[0], "http://example.com");
        assert.strictEqual(httpClientStub.get.getCall(1).args[0], "http://account.example.com/");
        assert.strictEqual(httpClientStub.get.getCall(2).args[0], "http://account.example.com/accounts/1/addresses/");
        assert.strictEqual(httpClientStub.get.callCount, 3);
        assert.deepEqual(resource, accountAddressesResponse);
      });
  },
  "Follow the link relation from the embeddedResource if available": function followRelationFromEmbeddedResource() {
    var accountResponse, rootResourceStub;

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    });

    rootResourceStub = new Resource({
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      undefined,
      undefined, {
        "account": accountResponse
      });

    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      _embedded: {
        "account": {
          _links: {
            self: {
              href: "http://account.example.com/"
            },
            "address": {
              href: "http://account.example.com/accounts/1/addresses/"
            }
          }
        }
      }
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);

    return halClient.navigate()
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.getCall(0).args[0], "http://example.com");
        assert.deepEqual(resource, rootResourceStub);

        return halClient.navigate(resource, "account");
      })
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.deepEqual(resource, accountResponse);
      });
  },
  "Follow the link relations using embeddedResources if available": function followRelationUsingEmbeddedResources() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    });

    accountResponse = new Resource({
        self: {
          href: "http://account.example.com/"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      },
      undefined,
      undefined, {
        "address": accountAddressesResponse
      });

    rootResourceStub = new Resource({
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      undefined,
      undefined, {
        "account": accountResponse
      });

    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      _embedded: {
        "account": {
          _links: {
            self: {
              href: "http://account.example.com/"
            },
            "address": {
              href: "http://account.example.com/accounts/1/addresses/"
            }
          },
          _embedded: {
            _links: {
              self: {
                href: "http://account.example.com/accounts/1/addresses/"
              },
              "default": {
                href: "http://account.example.com/accounts/1/addresses/default"
              }
            }
          }
        }
      }
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigateRelations(["account", "address"])
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.deepEqual(resource, accountAddressesResponse);
      });
  },
  "Retrieve data from resource": function retrieveDataFromResource() {
    var rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    }, undefined, {
      welkom: "This is the root"
    });

    httpClientStub.get.returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      welkom: "This is the root"
    })));
    resourceFactoryStub.createResource.returns(rootResourceStub);

    return halClient.navigate()
      .then(function navigateToRoot(resource) {
        assert.deepEqual(resource.data, {
          welkom: "This is the root"
        });
      });
  },
  "Retrieve data from relation": function retrieveDataFromRelation() {
    var accountResponse, rootResourceStub;

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    }, undefined, {
      welkom: "This is the root"
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    }, undefined, {
      accountId: "1",
      name: "testAccount"
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      welkom: "This is the root"
    })));

    httpClientStub.get.onCall(1).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/"
        },
        "address": {
          href: "http://account.example.com/accounts/1/addresses/"
        }
      },
      accountId: "1",
      name: "testAccount"
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);

    return halClient.navigateRelations(["account"])
      .then(function navigateNextRelation(resource) {
        assert.deepEqual(resource.data, {
          accountId: "1",
          name: "testAccount"
        });
      });
  },
  "Retrieve data from embeddedResources": function retrieveDataFromEmbeddedResources() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    }, undefined, {
      addressId: "10",
      street: "abcStreet"
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    }, undefined, {
      accountId: "1",
      name: "testAccount"
    }, {
      "address": accountAddressesResponse
    });

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    }, undefined, {
      welkom: "This is the root"
    }, {
      "account": accountResponse
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      _embedded: {
        "account": {
          _links: {
            self: {
              href: "http://account.example.com/"
            },
            "address": {
              href: "http://account.example.com/accounts/1/addresses/"
            }
          },
          _ebbedded: {
            "address": {
              _links: {
                self: {
                  href: "http://account.example.com/accounts/1/addresses/"
                },
                "default": {
                  href: "http://account.example.com/accounts/1/addresses/default"
                }
              },
              addressId: "10",
              street: "abcStreet"
            }
          },
          accountId: "1",
          name: "testAccount"
        }
      },
      welkom: "This is the root"
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigateRelations(["account", "address"])
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.deepEqual(resource.data, {
          addressId: "10",
          street: "abcStreet"
        });
      });
  },
  "Retrieve complete data responce from embeddedResources": function retrieveCompleteDataFromEmbeddedResources() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    }, undefined, {
      addressId: "10",
      street: "abcStreet"
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/1/addresses/"
      }
    }, undefined, {
      accountId: "1",
      name: "testAccount"
    }, {
      "address": accountAddressesResponse
    });

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    }, undefined, {
      welkom: "This is the root"
    }, {
      "account": accountResponse
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      _embedded: {
        "account": {
          _links: {
            self: {
              href: "http://account.example.com/"
            },
            "address": {
              href: "http://account.example.com/accounts/1/addresses/"
            }
          },
          _ebbedded: {
            "address": {
              _links: {
                self: {
                  href: "http://account.example.com/accounts/1/addresses/"
                },
                "default": {
                  href: "http://account.example.com/accounts/1/addresses/default"
                }
              },
              addressId: "10",
              street: "abcStreet"
            }
          },
          accountId: "1",
          name: "testAccount"
        }
      },
      welkom: "This is the root"
    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigateRelations(["account", "address"])
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.deepEqual(resource.relationData, {
          "account": {
            accountId: "1",
            name: "testAccount",
            "address": {
              addressId: "10",
              street: "abcStreet"
            }
          },
          welkom: "This is the root"
        });
      });
  },
  "Follow the given relations with templated links and parameters from the root url": function followeTemplatedRelations() {
    var accountResponse, accountAddressesResponse, rootResourceStub;

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    }, undefined, {
      addressId: "10",
      street: "abcStreet"
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/{accountId}/addresses/",
        templated: true
      }
    }, undefined, {
      accountId: "1",
      name: "testAccount"
    });

    rootResourceStub = new Resource({
      self: {
        href: "http://example.com/"
      },
      "account": {
        href: "http://account.example.com/"
      }
    }, undefined, {
      welkom: "This is the root"
    }, {
      "account": accountResponse
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://example.com/"
        },
        "account": {
          href: "http://account.example.com/"
        }
      },
      _embedded: {
        "account": {
          _links: {
            self: {
              href: "http://account.example.com/"
            },
            "address": {
              href: "http://account.example.com/accounts/{accountId}/addresses/",
              templated: true
            }
          },
          accountId: "1",
          name: "testAccount"
        }
      },
      welkom: "This is the root"
    })));

    httpClientStub.get.onCall(1).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/accounts/1/addresses/"
        },
        "default": {
          href: "http://account.example.com/accounts/1/addresses/default"
        }
      },
      addressId: "10",
      street: "abcStreet"

    })));

    resourceFactoryStub.createResource.onCall(0).returns(rootResourceStub);
    resourceFactoryStub.createResource.onCall(1).returns(accountResponse);
    resourceFactoryStub.createResource.onCall(2).returns(accountAddressesResponse);

    return halClient.navigateRelations(["account", "address"], {
        accountId: "1"
      })
      .then(function navigateNextRelation() {
        assert.strictEqual(httpClientStub.get.callCount, 2);
        assert.strictEqual(httpClientStub.get.getCall(1).args[0], "http://account.example.com/accounts/1/addresses/");
      });
  },
  "Navigate to a templated url relation": function followeTemplatedUrlRelation() {
    var accountResponse, accountAddressesResponse;

    accountAddressesResponse = new Resource({
      self: {
        href: "http://account.example.com/accounts/1/addresses/"
      },
      "default": {
        href: "http://account.example.com/accounts/1/addresses/default"
      }
    });

    accountResponse = new Resource({
      self: {
        href: "http://account.example.com/"
      },
      "address": {
        href: "http://account.example.com/accounts/{accountId}/addresses/",
        templated: true
      }
    });

    httpClientStub.get.onCall(0).returns(Promise.resolve(JSON.stringify({
      _links: {
        self: {
          href: "http://account.example.com/accounts/1/addresses/"
        },
        "default": {
          href: "http://account.example.com/accounts/1/addresses/default"
        }
      },
      addressId: "10",
      street: "abcStreet"
    })));

    resourceFactoryStub.createResource.onCall(0).returns(accountAddressesResponse);

    return halClient.navigate(accountResponse, "address", {
        accountId: "1"
      })
      .then(function navigateNextRelation(resource) {
        assert.strictEqual(httpClientStub.get.callCount, 1);
        assert.strictEqual(httpClientStub.get.getCall(0).args[0], "http://account.example.com/accounts/1/addresses/");
        assert.deepEqual(resource, accountAddressesResponse);
      });
  },
  "Use other resource as starting point to navigate relations": function changeStartingPointNavigateToRelations() {
    this.skip();
  },
  "Should throw a argument error if resource is invalid": function invalidResourceGiven() {
    this.skip();
  },
  "Should throw a argument error if relations array is invalid": function invalidRelationArray() {
    this.skip();
  },
  "If the relation contains a templated url a url parameter is expected": function expectUrlTemplateVariable() {
    this.skip();
  },
  "Should throw a error if url variable is not given when expected": function noUrlVariableGiven() {
    this.skip();
  },
  "Should throw a error if the relation does not exists in the resource": function test() {
    this.skip();
  },
  "Should throw a error if the relation link is templated and no data is provided": function noDataToTemplatedLink() {
    this.skip();
  },
  "Should throw a error if the relation link is templated and incorect data is provided": function invalidTemplatedLink() {
    this.skip();
  }
};
