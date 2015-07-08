/*
*
    COPYRIGHT LICENSE: This information contains sample code provided in source code form. You may copy, modify, and distribute
    these sample programs in any form without payment to IBM® for the purposes of developing, using, marketing or distributing
    application programs conforming to the application programming interface for the operating platform for which the sample code is written.
    Notwithstanding anything to the contrary, IBM PROVIDES THE SAMPLE SOURCE CODE ON AN "AS IS" BASIS AND IBM DISCLAIMS ALL WARRANTIES,
    EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, ANY IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, SATISFACTORY QUALITY,
    FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND ANY WARRANTY OR CONDITION OF NON-INFRINGEMENT. IBM SHALL NOT BE LIABLE FOR ANY DIRECT,
    INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR OPERATION OF THE SAMPLE SOURCE CODE.
    IBM HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS OR MODIFICATIONS TO THE SAMPLE SOURCE CODE.
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
