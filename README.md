# Ronabot 🤖

**Only Supports Giant Eagle as of now**

# Config

| Property        	| Value   	| Default                                                      	| Description                                             	|
|-----------------	|---------	|--------------------------------------------------------------	|---------------------------------------------------------	|
| headless        	| Boolean 	| `false`                                                      	| Not yet fully automated so headless is not recommended. 	|
| pushoverAPIKey  	| String  	| `""`                                                         	| Pushover app API Key                                    	|
| pushoverUser    	| String  	| `""`                                                         	| Pushover user API Key                                   	|
| repeatCheckTime 	| Number  	| `10000`                                                      	| Time, in milliseconds, between checks.                  	|
| url             	| String  	| `"https://sr.reportsonline.com/sr/gianteagle/immunizations"` 	| URL to check for Giant Eagle                            	|
| zip             	| Number  	| `15201`                                                      	| Zip Code you want to check for availability.            	|
