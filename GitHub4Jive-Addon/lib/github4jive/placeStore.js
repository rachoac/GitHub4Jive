/*
 * Copyright 2014 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var jive = require("jive-sdk");
var q = require("q");
var store = jive.service.persistence();
var JiveApi = require("./JiveApiFacade");
var JiveOauth = require("./JiveOauth");
var objectMerge = require("object-merge");

var STORE_NAME = "places";

/**
 * save will store the object with the given placeUrl as the key. If the object
 * already exists then it does a recursive overwrite of members. Meaning it only
 * overwrites members currently there at any level.
 * @param {string} placeUrl the key to identify the place
 * @param {object} set of members to place/overwrite on the record.
 * @param {boolean} dontStamp if this is true then the cache is not invalidated after save.
 * @return {promise} the new record is returned. External properties are not gathered to
 * allow client code to do validation.
 */
exports.save = function(placeUrl, newObject, dontStamp){
    if(!placeUrl || placeUrl === "" || typeof placeUrl !== "string"){
        throw Error("Invalid Place");
    }
    return store.findByID(STORE_NAME, placeUrl).then(function (found) {
        var record = found || {};
        record = objectMerge(JSON.parse(JSON.stringify(record)), newObject || {});
        var delimitter = "/";
        var tokens = placeUrl.split(delimitter);
        var domainTokens = tokens.slice(0, 3);

        record.jiveUrl =  domainTokens.join(delimitter);
        record.placeID =  tokens[tokens.length -1];
        record.placeUrl = placeUrl;
        record.invalidCache = !dontStamp;
        return store.save(STORE_NAME, placeUrl, record).then(function(){
            return record;
        });
    })
};

/**
 * refresh the cache for a given record. The cache is not left in an invalid state.
 * @param {string} placeUrl the key for the given place
 * @return {object} the record is returned with refreshed cache elements
 */
exports.invalidateCache = function(placeUrl){
    if(!placeUrl || placeUrl === "" || typeof placeUrl !== "string"){
        throw Error("Invalid Place");
    }
    var self = this;
    return self.save(placeUrl).then(function (record) {
        return pullExternalPropertiesIn(self, record);
    })
};

function pullExternalPropertiesIn(self,linked){
    if (
        linked &&
        linked.jive &&
        (linked.github && (!linked.github.repoOwner || !linked.github.repo) || linked.invalidCache)
     ){
        //cache repo information
        return jive.community.findByJiveURL(linked.jiveUrl).then(function (community) {
            var jauth = new JiveOauth(linked.placeUrl,linked.jive.access_token, linked.jive.refresh_token);
            var japi = new JiveApi(community, jauth);
            return japi.getAllExtProps("places/" + linked.placeID).then(function (extprops) {
                linked.github.repo = extprops.github4jiveRepo;
                linked.github.repoOwner = extprops.github4jiveRepoOwner;
                var githubReplacement = {"github": linked.github};
                return self.save(linked.placeUrl, githubReplacement, true);
            })
        });

    }else{
        return linked;
    }
}

/**
 * Get all place records out of the store
 * @return {[object]} returns array of all place records.
 */
exports.getAllPlaces = function(){
    var self = this;
    return store.find(STORE_NAME).then(function (linkedPlaces) {
        return q.all(linkedPlaces.map(function (linked) {
            return pullExternalPropertiesIn(self, linked);
        }));
    });
};

/**
 * Retrieve a record by its place api url
 * @param {string} placeurl the full api url for the place
 * @return {object} the record with hydrated cache elements.
 */
exports.getPlaceByUrl = function(placeUrl){
    var self = this;
    return store.findByID(STORE_NAME, placeUrl).then(function (linked) {
        return pullExternalPropertiesIn(self,linked);
    });
};
