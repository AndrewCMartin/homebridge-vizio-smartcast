# homebridge-vizio-smartcast

Supports Vizio Smartcast devices on HomeBridge Platform

# Disclaimer

I'm no JavaScript programmer.  Use at your own risk.

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-vizio-smartcast
3. Update your configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

The "ipAddress" property is optional: if omitted, the plugin will try to find 
a device with a name matching the "name" property.

I'm not sure there is a way to get the "authToken" yet.

 ```
    "accessories": [
        {
            "accessory": "VizioSwitch",
            "name": "Living Room TV",
            "ipAddress": "192.168.1.210",
            "authToken": "NOPE8675390"
        }
    ]

 ```
# homebridge-vizio-smartcast
