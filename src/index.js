// This code sample shows how to call and receive external rest service data, within your skill Lambda code.
// var http = require('http');
var quickMeditationSSML = '<speak>Let\'s begin. Before starting, sit comfortably or lie down. Close your eyes and focus on keeping your mind blank.<break time="3s"/>Take a deep breath in through your nose. Hold it... <break time ="2s"/>Now breathe out. Good. Pay attention to the sensations you\'re feeling.<break time = "2s"/> Let\'s start with your lower body. I want you to stretch out your legs and point your toes. Squeeze your muscles and imagine them tensing up. Keep your eyes closed.<break time = "2s"/> Now, move to your torso and arms. Feel your muscles tightening and squeeze. Imagine your hands are holding lemons and try to squeeze them as much as you can. Keep your body tightened as much as possible.<break time = "3s"/> Finally, move to your head. Tighten your neck muscles and pull your shoulders to your ears. Wrinkle up your face, nose, eyes, and mouth. Notice how tight your whole body feels. Inhale...<break time = "3s"/>And exhale, relaxing every muscle in your body. Imagine your arms are spaghetti noodles. Let them hang at your side. Relax your toes and your stomach. Notice how good you feel, how relaxed and calm.<break time = "2s"/> Take deep breaths in and out. Feel the sensations of relaxation. When you are ready, you can slowly open your eyes.<break time = "2s"/> Thank you for taking the time from your busy schedule to destress yourself. See you next time!</speak>';

var http = require('http');

var BASE_URL = "http://aba8c5a2.ngrok.io";

exports.handler = function(event, context) {
    var say = "";
    var shouldEndSession = false;
    var sessionAttributes = {};

    if (event.session.attributes) {
        sessionAttributes = event.session.attributes;
    }

    if (event.request.type === "LaunchRequest") {
        http.get(BASE_URL+"/lastScore", function(response) {
            console.log(response);
            var lastScore = "";
            response.on('data', function(d) {
                lastScore += d;
                console.log("asdf3 " + lastScore);
            });
            response.on('end', function() {
                console.log(lastScore);
                lastScore = parseInt(lastScore);
                if(lastScore.toString() != "NaN"){
                    say = "Hello, <phoneme alphabet=\"ipa\" ph=\"'ruːʃi\">Rushi</phoneme>. Welcome to your meditation session. Your last session made you feel like a " + lastScore + " out of 10: are you ready to make this one even better?";
                }
                else{
                    say = "Hello, <phoneme alphabet=\"ipa\" ph=\"'ruːʃi\">Rushi</phoneme>. Welcome to your meditation session. Are you ready to have a great session?";
                }
                console.log(say);
                console.log(lastScore);
                context.succeed({
                    sessionAttributes: sessionAttributes,
                    response: buildSpeechletResponse(say, shouldEndSession)
                });
            });
        }).end(); // .end() was in the wrong fucking place
    } else {
        var IntentName = event.request.intent.name;

        if (IntentName === "QuickStartMeditationIntent") {
            shouldEndSession = true;
            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildResponse(quickMeditationSSML, shouldEndSession)
            });
        } else if (IntentName === "AddLengthIntent") {
            say = "How many minutes would you like to meditate for?";
            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildSpeechletResponse(say, shouldEndSession)
            });
        } else if (IntentName === "AddMeditationIntent") {
            var time = event.request.intent.slots.Length.value;
            sessionAttributes["length"] = time;
            say = "Would you prefer to do breathing meditation or music meditation?";
            context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
        }
        else if (IntentName === "BeginMeditationIntent") {
            say = "Let's begin: please close your eyes and sit comfortably. ";
            sessionAttributes.meditation = event.request.intent.slots.Meditation.value;

            if (sessionAttributes.meditation == "breathing") {
                var firstN = parseInt(sessionAttributes.length) * 6;
                say += "Now, ";
                for(var i = 0; i < firstN; i++){
                    say += ' Slowly inhale. <break time="3s"/> Slowly exhale. <break time="3s"/>';
                }
            } else {
                say += " Kick back, relax, and flow along with some of this music!";
                var secondN = parseInt(sessionAttributes.length);
                if (secondN > 5) {
                    secondN = 5;
                }
                for(var counter = 0; counter < secondN; counter++){
                    say += '<audio src="https://raw.githubusercontent.com/bhavingpt/alexa-meditate/master/music/60s_fade.mp3" />';
                    //say += '<audio src="https://raw.githubusercontent.com/bhavingpt/alexa-meditate/master/music/cafe_generic.mp3" />';
                }
            }
            say += "Perfect, I hope you enjoyed your session. On a scale of one to ten, how good do you feel right now?";
            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildSpeechletResponse(say, shouldEndSession)
            });
        } 
        else if (IntentName === "EndMeditationIntent") {
            sessionAttributes.score = event.request.intent.slots.Score.value;
            shouldEndSession = true;
            say = "Great! Stay chill until next time.";

            http.get(BASE_URL+"/session_rating?rating="+sessionAttributes.score, function(response) {
                console.log(response);
                var lastScore = "";
                response.on('data', function(d) {
                    lastScore += d;
                });
                response.on('end', function() {
                    context.succeed({
                        sessionAttributes: sessionAttributes,
                        response: buildSpeechletResponse(say, shouldEndSession)
                    });
                });
            }).end(); // .end() was in the wrong fucking place

            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildSpeechletResponse(say, shouldEndSession)
            });
        }
        else if (IntentName === "AMAZON.StopIntent" || IntentName === "AMAZON.CancelIntent") {
            say = "You asked for " + sessionAttributes.requestList.toString() + ". Thanks for playing!";
            shouldEndSession = true;
            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildSpeechletResponse(say, shouldEndSession)
            });
        } 
        else if (IntentName === "AMAZON.HelpIntent") {
            say = "Just chill out, dude."
            context.succeed({
                sessionAttributes: sessionAttributes,
                response: buildSpeechletResponse(say, shouldEndSession)
            });
        }
    }

};

function buildResponse(ssmlValue, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: ssmlValue
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>Please try again.</speak>"
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildSpeechletResponse(say, shouldEndSession) {
    return buildResponse("<speak>" + say + "</speak>", shouldEndSession);
}