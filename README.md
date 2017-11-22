# doag17-alexa-demo
Demo-Anwendung für die Verbindung einer Oracle Apex-Anwendung mit Alexa zum Betrieb auf AWS Lambda.
Diese einfache Anwendung wurde in Node.JS 6.10.3 geschrieben. Die API die hier auf Oracle Apex Seite angenommen wird ist hier nicht beschrieben ergibt sich aber relativ einfach aus dem Source-Code. 

* [Manuskript](https://www.doag.org/formes/pubfiles/9473622/2017-DEV-Franziska_Hoecker-Dank_Alexa_auf_Bildschirm_Maus_und_Tastatur_verzichten-Manuskript.pdf)

## Benötigte Accounts
* [Amazon Developer](https://developer.amazon.com/edw/home.html#/skill/amzn1.ask.skill.c8b33e0f-0f0e-46a4-8e51-c706f0af5fd0/de_DE/info)
* [AWS Amazon](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions)

## Verwendete Libraries
* [Alexa-Sdk](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
* [Request Library](https://github.com/request/request)
* [Claudia.JS](https://claudiajs.com/)

## Aufbau des Codes
### Funktionen zum Aufrufen der API in Richtung Apex
Diese Funktionen sind einfach aufgebaut und rufen den Webservice für Apex auf. Nach dem Aufruf wird die Antwort bzw. der Fehler dem Callback übergeben.
* getEntryByFirstnameAndCity(vname, stadt, callback)
* getEntryByFirstname(vname, callback)
* getEntrybyId(id, callback)
* saveNewEntry(fields, callback)

### Intents, welche als Handler am Alexa-SDK registriert werden
Diese werden einfach als Handler an das Alexa-SDK weitergegeben. Mehr Informationen dazu auf der Seite vom Alexa-SDK.
#### CancelIntent und StopIntent
Dies ist ein Standard Intent von Amazon zum Abbrechen oder Beenden der Anwendung.
#### SaveIntent
Dieser Intent ist zum Speichern eines neuen Datensatzes in Apex. Er nimmt alle Slots von Alexa entgegen die der Benutzer vorher angibt. Mit diesen ruft er die Funktion *saveNewEntry()* auf. Bei einem Fehler im Speichern wird dieser zurückgespielt und Alexa gibt diesen aus.
#### GetDatabyIDIntent
Einfacher Intent der einfach nur eine Id als Slot entgegennimmt und diese Abfrage entsprechend an die API über die Funktion *getEntrybyId()* weitergibt. Sollte es kein Ergebnis geben wird ein Fehler zurückgespielt und Alexa gibt diesen aus.
#### GetPhoneByQuery
Komplexer Intent zum Abfragen eines Eintrages anhand eines Namens und Stadt. Sollte zunächst nur ein Name vom Benutzer an Alexa gegeben worden sein, so wird versucht nur mit dem Namen per API-Call an Apex die Telefonnumer abzufragen, dies erfolgt in der Funktion *getEntryByFirstname()*. Sollten hierbei von Apex mehrere Einträge mit unterschiedlichen Städten als Ergebnis zurückkommen, so wird Alexa angewiesen dem Benutzer diese Städte vorzutragen und den Benutzer aus diesen wählen zu lassen. Nach Wahl des Benutzers wird diese Stadt als Slot übergeben und innerhalb der Funktion *getEntryByFirstnameAndCity()* dann die Telefonnummer abgefragt. Im Falle von einer Stadt wird diese als bereits gegebene Antwort angeommen. Bei keinem Ergebnis wird hier schon ein Fehler zurückgespielt und Alexa gibt diesen aus.
#### LaunchRequest
Intent der beim Einfachen Start der Anwendung verwendet wird.
