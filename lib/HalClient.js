"use strict";

var _ = require("lodash");
var Promise = require("bluebird");
var template = require("url-template");

module.exports = HalClient;

function HalClient(rootUrl, httpClient, resourceFactory) {
  this.rootUrl = rootUrl;
  this.httpClient = httpClient;
  this.resourceFactory = resourceFactory;
}

HalClient.prototype.navigate = function navigate(resource, relation, urlTemplateParameters) {
  var url, self;

  relation = relation || "self";
  url = this.rootUrl;
  self = this;

  if (!_.isUndefined(resource)) {
    url = resource.links[relation].href;

    if (resource.links[relation].templated) {
      url = parseTempletedUrl(url, urlTemplateParameters);
    }
  }

  // Try to load the resouce from the embedded resource.
  if (!_.isUndefined(resource) && _.has(resource, "embeddedResources." + relation + ".links.self.href")) {
    return Promise.resolve(resource.embeddedResources[relation]);
  }

  return this.httpClient.get(url)
    .then(function translateToResource(data) {
      return self.resourceFactory.createResource(data);
    });
};

HalClient.prototype.navigateRelations = function navigateRelations(relations, urlTemplateParameters) {
  var completeRelationData, self, finalResource, relationPath;

  self = this;
  completeRelationData = {};
  relationPath = "";

  return this.navigate()
    .then(function nextResource(resource) {
      _.merge(completeRelationData, _.clone(resource.data));

      return Promise.resolve(relations)
        .each(function followRelation(relation) {
          return self.navigate(resource, relation, urlTemplateParameters)
            .then(function nextResource(toResource) {
              relationPath = relationPath + "." + relation;
              relationPath = _.trim(relationPath, ".");
              _.set(completeRelationData, relationPath, _.clone(toResource.data));

              resource = toResource;
              finalResource = resource;

              finalResource.relationData = completeRelationData;
            });
        });
    })
    .then(function done() {
      return finalResource;
    });
};

function parseTempletedUrl(url, parameters) {
  var templatedUrl;

  templatedUrl = template.parse(url);

  return templatedUrl.expand(parameters);
}
