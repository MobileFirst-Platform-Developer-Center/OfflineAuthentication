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

// User credentials.
var username = null, password = null;

// Offline login state.
var offlineLoggedIn = false;

//JSONStore.
var collectionName = 'userCredentials';
var collections = {
	userCredentials : {
		searchFields : {
			collectionNotEmpty: 'string'
		}
	}
};

function wlCommonInit(){	
	$("#goToSecuredArea").bind("click", goToSecuredArea);
	$("#backToUnsecuredArea").bind("click", displayUnsecuredArea);
	$("#logout").bind("click", logout);
}

// Check for Internet connectivity to decide which authentication flow will be used.
function goToSecuredArea() {	
	WL.Device.getNetworkInfo(
		function (networkInfo) {
			if (networkInfo.isNetworkConnected == "true") {
				onlineAuthentication();
			} else {
				offlineAuthentication();
			}
		}
	);
}

// Handle the online authentication flow
function onlineAuthentication() {
	/*
	 * Check whether the user is already authenticated.
	 * true : Display the secured area
	 * false: Display the login form; start authentication via the challenge handler
	 */
	if (WL.Client.isUserAuthenticated("myCustomRealm")) {
		/*
		 * If connected to the Internet and the user is authenticated in the backend, but the username variable is empty, assume a logout was performed while offline
		 * Logout the user from the realm before trying to login again while online.
		 */
		if (username == null) {
			WL.Client.logout("myCustomRealm", {
				onSuccess: function() {
				    onlineAuthentication();
				},
				onFailure:function() {
					WL.SimpleDialog.show("Logout", "Unable to logout at this time. Try again later.", [{text: "OK", handler: function() { }}]); 
				}
			});
		// If connected to the Internet and the user is authenticated in the backend, and the username variable is not empty, display the secured area.
		} else {
			displaySecuredArea();	
		}
	// If logging-in while offline and Internet connectivity is then available, login to the realm without showing the login form.
	} else if (username) {
		var invocationData = {
			adapter : "authenticationAdapter",
			procedure : "submitAuthentication",
			parameters : [$("#username").val(), $("#password").val()]
		};
		
		myCustomRealmChallengeHandler.submitAdapterAuthentication(invocationData, {onSuccess:onlineAuthenticationSuccess, onFailure:onlineAuthenticationFailure });
	} else {
		// The user did not previously log-in in the current session, begin the challenge handler (in common\js\authenticationChallenge.js).
		WL.Client.login("myCustomRealm", {
			onSuccess: onlineAuthenticationSuccess,
			onFailure: onlineAuthenticationFailure
		});	
	}
}

function onlineAuthenticationFailure() {
	// If there is Internet connection, but MobileFirst Server is not reachable...
	offlineAuthentication();
}

// Handle a successful online authentication.
function onlineAuthenticationSuccess() {
	username = $("#username").val();
	password = $("#password").val();
	
	WL.JSONStore.init(collections, {password:password, username:username, localKeyGen:true})
	.then(function() {   		
		return WL.JSONStore.get(collectionName).findAll();
	})	
	.then(function(findAllResult) {
		if (findAllResult.length == 0) {
			// The 	JSONStore collection is empty, populate it.
			var data = [{collectionNotEmpty:"true"}];
			return WL.JSONStore.get(collectionName).add(data);
		}
		/* if findAllResult.length > 0 ...
		 * The user store is already populated, don't add again.
		 * This is required in order to verify the user when logging-in offline.
		 * 
		 * Also helps in keeping the JSONStore collection at just 1 record in case of repeated online authentications 
		 * so to not unnecessarily populate it with additional records.
		 */ 
	})
	.then(function() {
		displaySecuredArea();
	})	
}

/*
 * Handle offline authentication.
 * If already logged in, display the secure area, otherwise:
 * Try to open the JSONStore with the used password 
 * If successful, display the secured area
 */
function offlineAuthentication() {
	$("#username").val('');
	$("#password").val('');
	$("#authInfo").empty();
	
	// Don't show the login form  if already offline-logged-in via JSONStore, or previously logged-in online (but have yet logged-out).
	if (offlineLoggedIn === true || username) {
		offlineLoggedIn = true;
		displaySecuredAreaOffline();
	} else {
		// Prepare the login form.
	    $("#unsecuredDiv").hide();
	    $("#authDiv").show();
		$("#offlineLoginButton").show();
		$("#onlineLoginButton").hide();
		$("#offlineLoginButton").unbind("click");
	    $("#offlineLoginButton").bind("click", function() {
	  	
			// Don't allow empty username/password field.
	    	if (($("#username").val() == '') || ($("#password").val() == '')) {
				$("#authInfo").html("Invalid credentials. Please try again.");
			} else {
		    	WL.JSONStore.init(collections, {password:$("#password").val(), username:$("#username").val(), localKeyGen:true})	
		    	.then(function() {
		    		/*
					 * Need to handle the case where logging in when offline for the first time, in which case logging in cannot be done as there wouldn't be a
					 * JSONStore available yet.
					 */
		    		WL.JSONStore.get(collectionName).count()
		    		.then(function(countResult) {
		    			if (countResult == 0) {
		    				WL.JSONStore.destroy($("#username").val());
			                $("#authInfo").html("First time login must be done when Internet connection is available.");
						    $("#username").val('');
						    $("#password").val('');
					    } else {
					    	// Preserve the username and password, set the offline-logged-in flag and dislay the secured area.
		                    offlineLoggedIn = true;
		                    username = $("#username").val();
		        	    	password = $("#password").val();
		                    displaySecuredAreaOffline();
					    }
		    		})
		    	})
		    	.fail(function() {
		    		$("#authInfo").html("Invalid credentials. Please try again.");
		    		$("#username").val('');
		    		$("#password").val('');
		    	})
			}
		});
	}
}

/*
 * Handle logging out from the secured area.
 * If online, logout from the realm and display the unsecured area
 * If offline, set the "offline-logged-in" flag to false, close the JSONStore and display the unsecured area
 */
function logout() {
	password = null;
	username = null;
	WL.JSONStore.closeAll();
	offlineLoggedIn = false;
	
	WL.Device.getNetworkInfo(
		function (networkInfo) {
			if (networkInfo.isNetworkConnected == "true") {
				WL.Client.logout("myCustomRealm", {onSuccess:displayUnsecuredArea, onFailure:displayUnsecuredArea});
			}
		}
	);
	
	displayUnsecuredArea();
}

// Display the secured and unsecured areas.
function displaySecuredArea() {
	$("#authDiv").hide();
	$("#unsecuredDiv").hide();
	$("#securedDiv").show();
	$("#offlineAccess").hide();
}

function displaySecuredAreaOffline() {
	$("#offlineAccess").show();
	$("#securedDiv").addClass("displaySecuredAreaOffline");
	$("#authDiv").hide();
	$("#unsecuredDiv").hide();
	$("#securedDiv").show();
}

function displayUnsecuredArea() {
	$("#offlineAccess").hide();
	$("#securedDiv").removeClass("displaySecuredAreaOffline");
    $("#securedDiv").hide();
    $("#unsecuredDiv").show();
}
