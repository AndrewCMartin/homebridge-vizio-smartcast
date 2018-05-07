//
// index.js
//

var smartcast = require('vizio-smart-cast');
var wol = require('wake_on_lan');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerAccessory("homebridge-vizio-smartcast", "VizioSwitch", VizioSwitch);
    homebridge.registerAccessory("homebridge-vizio-smartcast", "VizioVolume", VizioVolume)
}

VizioSwitch.prototype.volumeDown = function (on, callback) {
    sb.control.volume.down();
    callback();
}

VizioSwitch.prototype.volumeUp = function (on, callback) {
    sb.control.volume.up();
    callback();
}

function VizioVolume(log, config) {
    this.log = log;
    this.name = config.name;
    this.up = config.up;
    this.stateful = false;
    this.reverse = config.reverse;
    this._service = new Service.Switch(this.name);
    this.authToken = config["authToken"];
    this.ipAddress = config["ipAddress"];
    this.cacheDirectory = HomebridgeAPI.user.persistPath();
    //this.storage = require('node-persist');
    //this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});
    this.sb = new smartcast(this.ipAddress, this.authToken);
    this._service.getCharacteristic(Characteristic.On)
        .on('set', this._setOn.bind(this));

    if (this.reverse) this._service.setCharacteristic(Characteristic.On, true);



}


VizioVolume.prototype.getServices = function() {
    return [this._service];
}

VizioVolume.prototype._setOn = function(on, callback) {

    this.log("Setting switch to " + on);
    if ((!this.reverse && on) || (this.reverse && !on)) {
        if (this.up) {
            this.sb.control.volume.up()
        }
        else {
            this.sb.control.volume.down();
        }
    }


    if (on && !this.reverse && !this.stateful) {
        setTimeout(function() {
            this._service.setCharacteristic(Characteristic.On, false);
        }.bind(this), 200);
    }


    callback();
}

function VizioSwitch(log, config) {
    this.log = log;
    this.switchService = new Service.Switch(this.name);
    this.enabledServices = [];
    this.name = config["name"];
    this.authToken = config["authToken"];
    this.ipAddress = config["ipAddress"];
    this.mac = config["mac"];
    this.volumeControl = config["volumeControl"];
    if (typeof this.configIpAddress === "undefined") {
        this.discover();
    }

    // TODO: validate config before using it
    // TODO: find the IP from name discovery if it isn't specified

    this.tv = new smartcast(this.ipAddress, this.authToken);

    // TODO: what if this.tv is invalid?

    var informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Manufacturer, "Vizio Manufacturer")
        .setCharacteristic(Characteristic.Model, "TODO Fake Model")
        .setCharacteristic(Characteristic.SerialNumber, "TODO Serial Number");

    var switchService = new Service.Switch(this.name, "switchService");
    switchService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getPowerState.bind(this))
        .on('set', this.setPowerState.bind(this));
    this.enabledServices.push(switchService);

    var volumeUpService = new Service.StatelessProgrammableSwitch("VolUp", "volumeUpService");
    volumeUpService
        .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .addListener("set", this.volumeUp.bind(this));

    var volumeDownService = new Service.StatelessProgrammableSwitch("VolDown", "volumeDownService");
    volumeDownService
        .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .addListener("set", this.volumeDown.bind(this));

    if (this.volumeControl) {
        this.enabledServices.push(volumeDownService);
        this.enabledServices.push(volumeUpService);
    }

    this.enabledServices.push(informationService);
}

VizioSwitch.prototype.getPowerState = function (callback) {
    this.log("TODO: getPowerState");
    if (typeof this.configIpAddress === "undefined") {
        this.discover();
    }

    this.tv.power.currentMode().then((data) => {
        this.log("tv.power.currentMode() = ", data);
        callback(null, (data.ITEMS[0].VALUE == 1));
    });
}

VizioSwitch.prototype.setPowerState = function (powerOn, callback) {
    this.log("TODO: setPowerState ", powerOn);
    if (typeof this.configIpAddress === "undefined") {
        this.discover();
    }

    if (powerOn) {
        let powerOn = this.tv.control.power.on;
        wol.wake(this.mac, function (error) {
            if (error) {
                return callback(new Error('vizio wake on lan error'))
            }

            powerOn();

        })
        //this.tv.control.power.on()
    } else {
        this.tv.control.power.off()
    }
    callback(); // success
}

VizioSwitch.prototype.identify = function (callback) {
    this.log("identify");

    if (typeof this.configIpAddress === "undefined") {
        this.discover();
    }

    this.tv.control.volume.toggleMute();
    callback(); // success
}

VizioSwitch.prototype.discover = function () {
    // TODO: how do we handle more than one device found.
    smartcast.discover((device) => {
        if (this.name.localeCompare(device.name) == 0) {
            this.log("TODO: discover found IP", device.ip);
            this.tv = new smartcast(device.ip, this.authToken);
            this.model = device.model;
        } else {
            this.log("TODO: discover wrong name", device.name, "not", this.name);
        }
    });

    // Example output:
    // {
    //     ip: '192.168.0.131',
    //     name: 'Living Room',
    //     manufacturer: 'VIZIO',
    //     model: 'P65-C1'
    // }
}

VizioSwitch.prototype.getServices = function () {
    return this.enabledServices;
}

// tv.control.power.toggle();
