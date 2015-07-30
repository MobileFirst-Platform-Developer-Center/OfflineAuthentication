/**
* Copyright 2015 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/ 

/*
 * Challenge handler for single-step adapter authentication.
 */
var myCustomRealmChallengeHandler = WL.Client.createChallengeHandler("myCustomRealm");

myCustomRealmChallengeHandler.isCustomResponse = function(response) {
	if (!response || !response.responseJSON	|| response.responseText === null) {
		return false;
	}
	if (typeof(response.responseJSON.authRequired) !== 'undefined'){
		return true;
	} else {
		return false;
	}
};

myCustomRealmChallengeHandler.handleChallenge = function(response){
	var authRequired = response.responseJSON.authRequired;

	// Authentication required, display the login form and the online login button.
	if (authRequired == true){
		if (!($("#authDiv").is(":visible"))) { 
			$("#unsecuredDiv").hide();
			$("#authDiv").show();
			$("#offlineLoginButton").hide();
			$("#onlineLoginButton").show();
		}
		
		$("#username").val('');
		$("#password").val('');
		$("#authInfo").empty();

		if (response.responseJSON.errorMessage) {
	    	$("#authInfo").html(response.responseJSON.errorMessage);
		}
		
	} else if (authRequired == false){
		myCustomRealmChallengeHandler.submitSuccess();
	}
};

$("#onlineLoginButton").bind('click', function () {
	var invocationData = {
		adapter : "authenticationAdapter",
		procedure : "submitAuthentication",
		parameters : [$("#username").val(), $("#password").val()]
	};

	myCustomRealmChallengeHandler.submitAdapterAuthentication(invocationData, {});
});

$("#cancelLoginButton").bind('click', function () {
	myCustomRealmChallengeHandler.submitFailure();
	$("#authDiv").hide();
    $("#unsecuredDiv").show();
});
