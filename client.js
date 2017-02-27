var request = require("request");
var ScheduleAsync = require("pid-async-class").ScheduledAsync

class Client extends ScheduleAsync{
  constructor(config){
    super();
    this.client = request;
    this.config = config;
    this.serverBaseUrl = config.serverBaseUrl;
    this.registeredPids = [];
    this.schedule(15000, "_runHeartBeats",[]);
  }

  async registerPid(pidInfo){

    var [status, result] = await this.a(["_putPidInfo", pidInfo]);
    pidInfo.pidTrueId = result;
    this.registeredPids.push(pidInfo);
    return this;
  }

  _putPidInfo(pidInfo){
    return new Promise((res, rej) => {
      this.client({method:"POST", url:this.serverBaseUrl + "/pids", json:pidInfo}, function(err, resp, body){
        if(err){
          rej(err)
          return;
        }
        res(body);
      });
    });
  }

  _getRegisteredPid(pidId){
    var [pid] = this.registeredPids.filter(function(pidInfo){
      return pidInfo.doc.pidId === pidId;
    })
    return pid;
  }

  getPid(pidId){
    var pidTrueId = this._getRegisteredPid(pidId).pidTrueId
    return new Promise((res, rej) => {
      this.client(this.serverBaseUrl + "/pids/" + pidTrueId, function(err, resp, body){
        if(err){
          rej(err)
          return;
        }
        res(body);
      });
    });
  }

  getPidsByClass(pidClass){
    return new Promise((res, rej) => {
      this.client(this.serverBaseUrl + "/classes/" + pidClass, function(err, resp, body){
        if(err){
          rej(err)
          return;
        }
        res(body);
      });
    });
  }

  removePid(pidId){
    for(var i = 0; i < this.registeredPids.length; i++){
      if(this.registeredPids[i].pidId === pidId){
        break;
      }
    }

    if(i < this.registeredPids.length){
      this.registeredPids.splice(i,i);
    }
  }

  _runHeartBeats(){
    for(var i in this.registeredPids){
      this.client(this.serverBaseUrl + "/pids/heartbeat/" + this.registeredPids[i].pidTrueId, function(err, resp, body){

      });
    }
  }
}

module.exports = Client;
