"use strict";

var _ = require("lodash");
var Resource = require("./Resource");

module.exports = ResourceFactory;

function ResourceFactory() {}

ResourceFactory.prototype.createResource = function createResource(jsonBody) {
  var jsonObject, resource;

  jsonObject = JSON.parse(jsonBody.toString("utf8"));

  resource = create(jsonObject);

  return resource;
};

function create(jsonObject) {
  var resource, data, embeddedResources;

  data = _.clone(jsonObject);
  delete data._links;
  delete data._embedded;

  embeddedResources = createEmbeddedResources(jsonObject._embedded);
  resource = new Resource(jsonObject._links, undefined, data, embeddedResources);

  return resource;
}

function createEmbeddedResources(embeddedObjects) {
  var embeddedResources;

  embeddedResources = {};

  _.forEach(embeddedObjects, function createResouceFromEmbedded(embeddedObject, relation) {
    var resource;

    resource = create(embeddedObject);
    embeddedResources[relation] = resource;
  });

  return embeddedResources;
}
