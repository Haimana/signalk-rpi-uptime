/*
 *  
 * Copyright 2024 SeB (sebba@end.ro) - S/V Haimana 264900475
 * 
 * Plugin page:
 * 
 * https://github.com/Haimana/signalk-rpi-uptime
 * 
 * 
 * ---------------------------------------------------------------------
 * 
 * This plugin has been inspired and based on:
 * 
 * https://github.com/sbender9/signalk-raspberry-pi-temperature
 * 
 * and
 * 
 * https://github.com/sberl/signalk-rpi-monitor
 * 
 * Many thanks to the authors: Scott Bender and Steve Berl
 * 
 * ---------------------------------------------------------------------
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
*/

const _ = require('lodash')
const spawn = require('child_process').spawn

const command = 'cat /proc/uptime'

module.exports = function(app) {
  var plugin = {};
  var timer

  plugin.id = "signalk-rpi-uptime"
  plugin.name = "RPi Uptime"
  plugin.description = "SignalK Node Server Plugin to provide Raspberry Pi Uptime"
  plugin.schema = {
    type: "object",
    description: "RPi Uptime",
    properties: {
      path_seconds: {
        title: "SignalK Path (seconds)",
        type: "string",
        default: "environment.rpi.uptime",
      },
      path_pretty: {
        title: "SignalK Path (pretty)",
        type: "string",
        default: "environment.rpi.uptimepretty",
      },
      rate: {
        title: "Sample Rate (in seconds)",
        type: 'number',
        default: 60
      }
     }
  }


  plugin.start = function(options) {

    app.handleMessage(plugin.id, {
        updates: [{
            meta: [
                {
                    path: options.path_seconds,
                    value: {
                        units: "s"
                    }
                },
            ]
        }]
    });
	
	
    function readUptimeSec() {
    var seconds = spawn('sh', ['-c', command ])

      seconds.stdout.on('data', (data) => {
          app.debug(`Output of "${command}":  ${data}`)
          var uptimeseconds = data.toString().split('.')[0];
          app.debug(`Processed string:  ${uptimeseconds}`)
          app.handleMessage(plugin.id, {
              updates: [
                {
                  values: [ 
                  {
                    path: options.path_seconds,
                    value: parseInt(uptimeseconds)
                  },
                  {
                    path: options.path_pretty,
                    value: secondsToDhms(uptimeseconds)
                  }
                ]
                }
              ]
            })
          }
        )

      seconds.on('error', (error) => { console.error(error.toString()) })
      seconds.stderr.on('data', function (data) { console.error(data.toString()) })
    }

    function secondsToDhms(seconds) {
      seconds = Number(seconds);
      var d = Math.floor(seconds / (3600*24));
      var h = Math.floor(seconds % (3600*24) / 3600);
      var m = Math.floor(seconds % 3600 / 60);
      var s = Math.floor(seconds % 60);
      
      var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return dDisplay + hDisplay + mDisplay + sDisplay;
      }

    readUptimeSec()
    setInterval(readUptimeSec, options.rate * 1000)
  }

  plugin.stop = function() {
    if ( timer ) {
      clearInterval(timer)
      timer =  null
    }
  }

  return plugin
}

