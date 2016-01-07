"use strict";

module.exports = Resource;

function Resource(links, curries, data, embeddedResources) {
  this.links = links;
  this.curries = curries;
  this.data = data;
  this.embeddedResources = embeddedResources;
  this.relationData = undefined;
}
