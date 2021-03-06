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
var gitHubFacade = require("../gitHubFacade");
var q = require("q");


/**
 * This is an abstract class that should be overridden to be used in a strategy set builder.
 * In all cases the name and setup function needs to be overridden and only in rare cases does
 * the teardown need to be overridden.
 *
 * Those rare cases being when teardown needs to do more than unregister from the GitHubFacade.
 * Be careful, when overriding it you are responsible for unsubscribing with the teardownOptions.eventToken
 * as it is below.
 *
 * The Setup function should call the GitHubFacade subscribeToRepoEvent by extracting the required
 * parameters from setupOptions. There is no guarantee that the correct options are present because the client
 * is responsible for hydrating the options as well as using them here.
 *
 */

/**
 * The name is used to differentiate strategies. It should be unique from all other strategies.
 */
exports.name = "THIS SHOULD BE OVERRIDDEN WITH A UNIQUE STRING AND NOT CONTAIN WHITESPACE";

/**
 * When overriding this function IT MUST return a promise.
 */
exports.setup = function(setupOptions) {
    throw Error("Not Implemented");
    return q("SOME_TOKEN");
};

/**
 * When overriding this function(And you normally wouldn't) IT MUST return a promise.
 */
exports.teardown = function(teardownOptions){
    var token = teardownOptions.eventToken;
    var auth = gitHubFacade.createOauthObject(teardownOptions.gitHubToken);
    return gitHubFacade.unSubscribeFromRepoEvent(token,auth);
};