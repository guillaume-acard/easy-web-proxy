# Easy web proxy

This simple server alows to easily proxy request to multiple back-end servers and host multiple static websites under the same domain. 

## Installation

```
npm install
```

## Run server

```
npm run start <optional-config-file-path>
```

## Configuration

By default the server will look for the `config.json`. 

You can use a custom configuration file to adapt to different environment and situations by providing a configuration file path: 

```
npm run start config.prod.json
```

Example configuration file for `http` & `https`:
```json
[
    {
        "port": 8080, // Listening port (can have more than one)
        // REST call proxy
        "proxy": [
            {
                "path": "/api/admin", // Listening path
                "target": "http://admin.myapp.com/api" // Request will be redirected here 
            },
            {
                "path": "/api", // First matching path is redirected
                "target": "http://myapp.com/api"
            }
        ],
        // Static website hosting
        "static": [
            {
                "path": "/home",
                "target": "C:\\website\\build",
                "default": true // Will be used if path does not match any routes
            },
            {
                "path": "/files/",
                "target": "C:\\website\\files",
                "strict": true // Will only match files located under this folder
            }
        ]
    },
    {
        "port": 443,
        "ssl": {
            "key": "./server.key", // Your own cert files need to be provided for https
            "cert": "./server.cert"
        },
        "proxy": [
            {
                "path": "/api/admin",
                "target": "https://admin.myapp.com/api" 
            },
            {
                "path": "/api", 
                "target": "https://myapp.com/api"
            }
        ],
        "static": [
            {
                "path": "/home",
                "target": "C:\\website\\build",
                "default": true 
            },
            {
                "path": "/files/",
                "target": "C:\\website\\files",
                "strict": true 
            }
        ]
    }
]
```