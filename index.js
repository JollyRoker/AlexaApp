/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

const SKILL_NAME = 'Il Signore degli Enigmi';
const WELCOME_MESSAGE = "Il signore degli enigmi ti da il benvenuto. Metti alla prova le tue capacità con indovinelli e rompicapi e spingi la tua mente agli estremi. Chiedi un nuovo indovinello o riprendi da dove hai lasciato.";
const WELCOME_REPROMPT = "Chiedi un nuovo indovinello o riprendi da dove hai lasciato.";"
const RIDDLE_REQUEST = "L'indovinello che devi risolvere è:<break time='0.9s'/>";
const HELP_MESSAGE = 'Puoi chiedere un indovinello, se non riesci a risolverlo puoi chiedere un indizio al giorno. Che posso fare per te?';
const HELP_REPROMPT = 'Che posso fare per te?';
const STOP_MESSAGE = 'Alla prossima!';
const INFO_REQUEST = 'Puoi dire ripeti per riascoltare la citazione, o dire voto per dare una tua valutazione.';
const ADDITIONAL_INFO = 'L\'autore della citazione è: ';
const FALLBACK_MESSAGE = 'Questa skill non può soddisfare la tua richiesta. Può ispirarti grazie a delle citazioni quando la apri. Cosa posso fare per te?';
const FALLBACK_REPROMPT = 'Che cosa posso fare per te?';

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/lambda/data
//=========================================================================================================================================

const data = [
    {
        riddle: "La mia vita può durare qualche ora, quello che produco mi divora. Sottile sono veloce, grossa sono lenta e il vento molto mi spaventa. Chi sono?",
        answer: ["candela","la candela"]
    }
]

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = WELCOME_MESSAGE;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(WELCOME_REPROMPT)
            .withSimpleCard('Il signore degli enigmi', speechText)
            .getResponse();
    },
};

const NewRiddleIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NewRiddleRequest';
    },
    handle(handlerInput) {
        let riddleIndex = Math.floor(Math.random() * data.length);
        const doneRiddleIndexes = handlerInput.attributesManager.getSessionAttributes().database.doneRiddles
        while (doneRiddleIndexes.indexOf(riddleIndex) != -1) {
            riddleIndex = Math.floor(Math.random() * data.length);
        }
        const randomRiddle = data[riddleIndex].riddle;
        const speechText = RIDDLE_REQUEST + randomRiddle;

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Il signore degli enigmi', speechText)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

const PersistenceGettingRequestInterceptor = {
    process(handlerInput) {
        return new Promise((resolve, reject) => {
            handlerInput.attributesManager.getPersistentAttributes()
                .then((attributes) => {
                    if (Object.keys(attributes).length === 0) {
                        const d = new Date().getTime();
                        attributes.database = {
                            'currentRiddle': '',
                            'doneRiddles': [],
                            'unsolvedRiddles': [],
                            'solvedRiddles': [],
                            'lastStartedAt': d
                        }
                    }
                    return handlerInput.attributesManager.setSessionAttributes(attributes);
                })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
        })
    }
}
const PersistenceSavingResponseInterceptor = {
    process(handlerInput) {
        return new Promise((resolve, reject) => {
            handlerInput.attributesManager.savePersistentAttributes()
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
        })
    }
}

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        NewRiddleIntentHandler
    )
    .addRequestInterceptors(PersistenceGettingRequestInterceptor)
    .addResponseInterceptors(PersistenceSavingResponseInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();
