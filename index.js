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
    description: "RPi Uptime in seconds",
    properties: {
      path: {
        title: "SignalK Path",
        type: "string",
        default: "environment.rpi.uptime",
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
                    path: options.path,
                    value: {
                        units: "s"
                    }
                },
            ]
        }]
    });
	
	
    function readUptime() {
    var process = spawn('sh', ['-c', command ])

    process.stdout.on('data', (data) => {

        app.debug(`Output of "${command}":  ${data}`)

	      var uptimeseconds = data.toString().split('.')[0];
	
        app.debug(`Processed string:  ${uptimeseconds}`)
	
        app.handleMessage(plugin.id, {
            updates: [
              {
                values: [ {
                  path: options.path,
                  value: parseInt(uptimeseconds)
                }]
              }
            ]
          })
        }
      )

      process.on('error', (error) => {
        console.error(error.toString())
      })

      process.stderr.on('data', function (data) {
        console.error(data.toString())
      })
    }
    readUptime()
    setInterval(readUptime, options.rate * 1000)
  }

  plugin.stop = function() {
    if ( timer ) {
      clearInterval(timer)
      timer =  null
    }
  }

  return plugin
}

