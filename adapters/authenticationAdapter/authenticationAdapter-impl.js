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
 *  Single-step adapter authentication.
 */
function onAuthRequired(headers, errorMessage){
	errorMessage = errorMessage ? errorMessage : null;
	
	return {
		authRequired: true,
		errorMessage: errorMessage
	};
}

// To simulate many users, accept any username that matches the password.
function submitAuthentication (username, password){
	if (username == password){
		var userIdentity = {
			userId: username,
			displayName: username, 
		};

		WL.Server.setActiveUser("myCustomRealm", userIdentity);
		
		return { 
			authRequired: false 
		};
	}

	return onAuthRequired(null, "Invalid credentials. Please try again.");
}

function onLogout(){
	WL.Logger.debug("Logged out");
}
