/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

const SKILL_NAME = 'Il Signore degli Enigmi';
const WELCOME_MESSAGE = "Il signore degli enigmi ti da il benvenuto. Metti alla prova le tue capacità con indovinelli e rompicapi e spingi la tua mente agli estremi. Chiedi un nuovo indovinello o riprendi da dove hai lasciato.";
const WELCOME_REPROMPT = "Chiedi un nuovo indovinello o riprendi da dove hai lasciato.";
const RIDDLE_REQUEST = "L'indovinello che devi risolvere è:<break time='0.9s'/>";
const INFO_ANSWER = "Puoi rispondere direttamente ora all'indovinello, o chiedere al signore degli enigmi di rispondere se ti verrà in mente più tardi.";
const ANSWER_REQUEST1 = "L'indovinello a che stai cercando di risolvere è:<break time='0.9s'/> ";
const ANSWER_REQUEST2 = "<break time='0.9s'/>Qual'è la tua risposta?";
const RIGHT_ANSWER = "La risposta è corretta. Complimenti!";
const WRONG_ANSWER = "Mi dispiace. La risposta è sbagliata";
const HINT_REJECT = "Non puoi avere un indizio perchè devono passare almeno 24 ore da quando hai cominciato l'indovinello o da quando hai sentito l'ultimo indizio."
const HELP_MESSAGE = 'Puoi chiedere un indovinello, se non riesci a risolverlo puoi chiedere un indizio al giorno. Che posso fare per te?';
const HELP_REPROMPT = 'Che posso fare per te?';
const STOP_MESSAGE = 'Alla prossima!';
const ADDITIONAL_INFO = 'L\'autore della citazione è: ';
const FALLBACK_MESSAGE = 'Questa skill non può soddisfare la tua richiesta. Può ispirarti grazie a delle citazioni quando la apri. Cosa posso fare per te?';
const FALLBACK_REPROMPT = 'Che cosa posso fare per te?';

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/lambda/data
//=========================================================================================================================================

const data = [
    {
        riddle: "La mia vita può durare qualche ora, quello che produco mi divora. Sottile sono veloce, grossa sono lenta, e il vento molto mi spaventa. Chi sono?",
        answer: "candela"
    },
    {
        riddle: "Questo è un indovinello di prova",
        answer: "test"
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
        console.log("Inside NewRiddleIntentHandler");
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NewRiddleRequest';
    },
    handle(handlerInput) {
        console.log("Inside NewRiddleRequest");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const response = handlerInput.responseBuilder;

        if (!attributes.database.currentRiddle) {
            console.log("Looking for a new riddle");
            console.log(attributes.database.currentRiddle);

            var riddle = getRiddle(handlerInput);
            const speechText = RIDDLE_REQUEST + riddle;
            const d = new Date().getTime();
            attributes.database.lastStartedAt = d;
                    
            return response
                .speak(speechText)
                .reprompt(INFO_ANSWER)
                .withSimpleCard('Il signore degli enigmi', riddle)
                .getResponse();
        } else {
            console.log("Repeating the current riddle");
            const riddle = data[attributes.database.currentRiddle].riddle;
            const speechText = RIDDLE_REQUEST + riddle;

            return response
                .speak(speechText)
                .reprompt(INFO_ANSWER)
                .withSimpleCard('Il signore degli enigmi', riddle)
                .getResponse();
        }    
    },
};

const AnswerRiddleRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside AnswerRiddleRequestHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();

        return attributes.database.currentRiddle
            && handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerRiddleRequest';
    },
    handle(handlerInput) {
        console.log("Inside AnswerRiddleRequest");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const riddle = data[attributes.database.currentRiddle].riddle;
        const speechText = ANSWER_REQUEST1 + riddle + ANSWER_REQUEST2;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(ANSWER_REQUEST2)
            .withSimpleCard('Il signore degli enigmi', speechText)
            .getResponse();
    },
};

const AnswerRiddleIntentHandler = {
    canHandle(handlerInput) {
        console.log("Inside AnswerRiddleIntentHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return attributes.database.currentRiddle
            && handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerRiddleIntent';
    },
    handle(handlerInput) {
        console.log("Inside AnswerRiddleIntent");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const answer = data[attributes.database.currentRiddle].answer;
        const isCorrect = isTheRightAnswer(handlerInput.requestEnvelope.request.intent.slots, answer);

        if (isCorrect) {
            const speechText = RIGHT_ANSWER;
            attributes.database.solvedRiddles.push(attributes.database.currentRiddle);
            attributes.database.doneRiddles.push(attributes.database.currentRiddle);

            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Il signore degli enigmi', speechText)
                .getResponse();
        } else {
            const speechText = WRONG_ANSWER;
            attributes.database.unsolvedRiddles.push(attributes.database.currentRiddle);
            attributes.database.doneRiddles.push(attributes.database.currentRiddle);

            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Il signore degli enigmi', speechText)
                .getResponse();
        }
    },
};

const HintRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside HintRequestHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();

        return attributes.database.currentRiddle
            && handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HintRequest';
    },
    handle(handlerInput) {
        console.log("Inside HintRequest");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const currentIndex = attributes.database.currentRiddle;
        const hintsCounter = attributes.database.hintsCounter;
        const lastStart = attributes.database.lastStartedAt;
        const d = new Date().getTime();
        const timePassed = d - lastStart;

        if (timePassed > 86400000) {
            if (hintsCounter === 0) {
                const speechText = firstHint(handlerInput, currentIndex);

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(INFO_ANSWER)
                    .withSimpleCard('Il signore degli enigmi', speechText)
                    .getResponse();
            } 
            if (hintsCounter === 1) {
                const speechText = secondHint(handlerInput, currentIndex);

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(INFO_ANSWER)
                    .withSimpleCard('Il signore degli enigmi', speechText)
                    .getResponse();
            } 
            if (hintsCounter === 2) {
                const speechText = thirdHint(handlerInput, currentIndex);

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(INFO_ANSWER)
                    .withSimpleCard('Il signore degli enigmi', speechText)
                    .getResponse();
            }
        } else {
            console.log("Hint request rejected");
            const speechText = HINT_REJECT;

            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Il signore degli enigmi', speechText)
                .getResponse();
        }
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
                            'lastStartedAt': d,
                            'hintsCounter':0
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

function getRandom(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function getRiddle(handlerInput) {
    console.log("I'm in getRiddle()");
    //GET A RIDDLE
    const riddleIndex = getRandom(0, data.length - 1);
    const randomRiddle = data[riddleIndex].riddle;

    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    //SET RIDDLE AS CURRENT
    attributes.database.currentRiddle = riddleIndex;

    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    return randomRiddle;
}

function isTheRightAnswer(slots, value) {
    for (const slot in slots) {
        if (Object.prototype.hasOwnProperty.call(slots, slot) && slots[slot].value !== undefined) {
            if (slots[slot].value.toString().toLowerCase() === value.toString().toLowerCase()) {
                return true;
            }
        }
    }

    return false;
}

function firstHint(handlerInput, index) {
    console.log("I'm in firstHint()");
    const answer = data[index].answer;
    const length = answer.length;

    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    //SET RIDDLE AS CURRENT
    attributes.database.hintsCounter += 1;

    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    const speechText = `La soluzione è una parola singola composta da ${length} caratteri`;
    return speechText
}
function secondHint(handlerInput, index) {
    console.log("I'm in secondHint()");
    const answer = data[index].answer;
    const length = answer.length;
    const firstCar = answer.charAt(0);

    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    //SET RIDDLE AS CURRENT
    attributes.database.hintsCounter += 1;

    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    const speechText = `La soluzione è una parola singola composta da ${length} caratteri. La prima lettere è la ${firstCar}`;
    return speechText
}
function thirdHint(handlerInput, index) {
    console.log("I'm in thirdHint()");
    const answer = data[index].answer;
    const length = answer.length;
    const firstCar = answer.charAt(0);
    const secCar = answer.charAt(1);

    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    //SET RIDDLE AS CURRENT
    attributes.database.hintsCounter += 1;

    //SAVE ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

    const speechText = `La soluzione è una parola singola composta da ${length} caratteri. La prima lettere è la ${firstCar}. La seconda lettera è la ${secCar}`;
    return speechText
}

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        NewRiddleIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        AnswerRiddleRequestHandler,
        AnswerRiddleIntentHandler,
        HintRequestHandler
    )
    .addRequestInterceptors(PersistenceGettingRequestInterceptor)
    .addResponseInterceptors(PersistenceSavingResponseInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withAutoCreateTable(true)
    .withTableName('Database1Enigmi')
    .lambda();
