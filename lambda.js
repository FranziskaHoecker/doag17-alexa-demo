var Alexa = require('alexa-sdk');
var request = require('request');

var regExp = /(ORA[\-0-9]+): *(.*)/;
function parseError(res) {
    var errorReason = decodeURIComponent(res.headers['error-reason']);
    if(regExp.test(errorReason)) {
      var args = regExp.exec(errorReason);
      return {'code': args[1], 'reason': args[2]};
    }
    return {'code': -1, 'reason': 'Leider gab es einen unbekannten Fehler.'};
}

function saveNewEntry(fields, callback) {
    var json = JSON.stringify(fields);
    request.post({
      url: 'https://apex.oracle.com/pls/apex/test_projects/adressdata/data/',
      headers: {'JSON_OBJ' : json}},
      function(err, res, content) {
          if(res.statusCode == 500) {
              return callback(parseError(res));
          }
          var resObj = JSON.parse(content);
          var id = resObj['V_ID'];
          callback(null, id);
      });
}


/*getEntryByFirstnameAndCity('agaga', 'bonn', function(err, rows) {
  console.log(err);
});
*/
/*
getEntryByFirstname('horst', function(err, rows) {
  console.log(rows.length);
});
*/

//console.log(joinArrayPretty(['Berlin','Bonn','Innsbruck'], ', ', ' und '));

function joinArrayPretty(arr, separator, lastSeparator) {
    var str = '';
    arr.forEach(function(item, i) {
        var sep = (i == arr.length-2) ? lastSeparator : separator;
        str += item + sep;
    });
    return str.slice(0, str.lastIndexOf(separator));
}



function getEntryByFirstnameAndCity(vname,stadt,callback){
  request.get(
    'https://apex.oracle.com/pls/apex/test_projects/adressdata/data?name='+vname+'&city='+stadt,
    function(err, res, content) {
        if(res.statusCode == 404) {
            return callback({code: 404});
        }
        callback(null, JSON.parse(content));
    });
}

function getEntryByFirstname(vname,callback){
  request.get(
    'https://apex.oracle.com/pls/apex/test_projects/adressdata/data?name='+vname,
    function(err, res, content) {
        if(res.statusCode == 404) {
            return callback({code: 404});
        }
        callback(null, JSON.parse(content).items);
    });
}

function getEntrybyId(id,callback){
  request.get(
    'https://apex.oracle.com/pls/apex/test_projects/adressdata/data/'+id,
    function(err, res, content) {
        if(res.statusCode == 404) {
            return callback({code: 404});
        }
        callback(null, JSON.parse(content));
    });
}

function emitError(alexa, err) {
    alexa.emit(':tell', 'Oh, Es ist ein Fehler aufgetreten. ' + err.reason);
}

function cancelIntentHandler() {
    return function() {
      this.emit(':tell', 'Einen schönen Tag noch. Ich geh jetzt schlafen.');
    }
}

var handlers = {
    'AMAZON.StopIntent': cancelIntentHandler(),
    'AMAZON.CancelIntent': cancelIntentHandler(),
    'SaveIntent': function () {
        if (this.event.request.dialogState !== 'COMPLETED'){
            this.emit(':delegate');
        } else {
            // All the slots are filled (And confirmed if you choose to confirm slot/intent)
	         var slots = this.event.request.intent.slots;
           var that = this;
           saveNewEntry({ 'VNAME': slots.Firstname.value,
                          'STADT': slots.City.value,
                          'TELEFON': slots.Phonenumber.value},
                          function(err, id) {
                              if(err) {
                                  return emitError(that, err);
                              }
                              that.emit(':tell', 'Der neue Eintrag hat die ID ' + id);
                          }
           );
        }
    },
    'GetDatabyIDIntent': function() {
        if(this.event.request.dialogState !== 'COMPLETED') {
          return this.emit(':delegate');
        }

        var slots = this.event.request.intent.slots;
        var id = slots.Id.value;
        var that = this;
        getEntrybyId(id,function(err, datarow){
            if(err && (err.code == 404)) {
                return that.emit(':tell', 'Datensatz mit der Nummer ' + id + ' nicht existent.');
            }
            that.emit(':tell', 'Datensatz mit der Nummer '+ datarow.id + ', Vorname: '+ datarow.vname + ', Stadt: '+ datarow.stadt + ', Telefon: ' + datarow.telefon)
        })
    },
    'GetPhonebyQuery': function() {
        var that = this;
        var slots = this.event.request.intent.slots;

        if(this.event.request.dialogState !== 'COMPLETED') {
            // Name vorhanden aber keine Stadt
            if(slots.Firstname.value && !slots.City.value) {
                var vname = slots.Firstname.value;
                return getEntryByFirstname(vname, function(err, datarows) {
                    if(datarows.length == 1) {
                        var updatedIntent = that.event.request.intent;
                        updatedIntent.slots.City.value = datarows[0].stadt;
                        return that.emit(':delegate', updatedIntent);
                    } else if (datarows.length > 1) {
                        var towns = joinArrayPretty(datarows.map(function(item) { return item.stadt; }), ', ', ' und ');
                        return that.emit(':elicitSlot', 'City', vname + ' gibt es in den Städten ' + towns +'. Welche willst Du?', 'Na los! Sag schon! Welche Stadt, du Sau!');
                    } else {
                        return that.emit(':tell', 'Den Namen ' + vname + ' kann ich nirgendwo finden.');
                    }
                });
             }
             return this.emit(':delegate');
        }

        var vname = slots.Firstname.value;
        var stadt = slots.City.value;

        getEntryByFirstnameAndCity(vname, stadt, function(err, datarow) {
            if(err) {
                return that.emit(':tell', 'Sowas habe ich nicht.');
            }
            that.emit(':tell', 'Alles klar. Die Telefonnummer von '+datarow.vname+' aus ' + datarow.stadt + ' lautet ' + datarow.telefon.split('').join(' '));
        });
    },
    'LaunchRequest': function() {
        var optionsText = 'Sie haben die folgenden Möglichkeiten: Eintrag hinzufügen, Eintrag mit einer bestimmten Nummer lesen, Telefonnummer für eine bestimmte Person abfragen. Was soll ich tun?';
        this.emit(':ask', 'Guten Tag, ich bin eine App die mit Oracle Apex verbunden ist. ' + optionsText, optionsText);
    }
};

exports.handler = function(event, context, callback) {
      var alexa = Alexa.handler(event, context, callback);
      alexa.registerHandlers(handlers);
	    alexa.execute();
};
