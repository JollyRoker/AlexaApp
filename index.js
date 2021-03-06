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
const RIGHT_ANSWER = "La risposta è corretta. Complimenti! Ma la sfida non è finita. Chiedi un nuovo indovinello per continuare a ragionare.";
const WRONG_ANSWER = "Mi dispiace. La risposta è sbagliata. Ricorda che puoi chiedere fino a 3 indizi.";
const HINT_REJECT = "Non puoi avere un indizio perchè devono passare almeno 24 ore da quando hai cominciato l'indovinello o da quando hai sentito l'ultimo indizio."
const HINT_OLD = "Per il prossimo indizio, devi aspettare almeno 24 ore."
const GET_ANSWER = "La soluzione all'indovinello corrente è: "
const HELP_MESSAGE = 'Puoi chiedere un indovinello, se non riesci a risolverlo puoi chiedere un indizio al giorno. Che posso fare per te?';
const HELP_REPROMPT = 'Che posso fare per te?';
const STOP_MESSAGE = 'Torna ad allenarti quando vuoi. Se questa skill ti piace, lascia una recensione positiva. Grazie!';
const FALLBACK_MESSAGE = 'Questa skill non può soddisfare la tua richiesta. Può ispirarti grazie a delle citazioni quando la apri. Cosa posso fare per te?';
const FALLBACK_REPROMPT = 'Che cosa posso fare per te?';

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/lambda/data
//=========================================================================================================================================

const data = require('./data');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = WELCOME_MESSAGE;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(WELCOME_REPROMPT)
            .withSimpleCard(SKILL_NAME, speechText)
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
                .withSimpleCard(SKILL_NAME, riddle)
                .getResponse();
        } else {
            console.log("Repeating the current riddle");
            const riddle = data[attributes.database.currentRiddle].riddle;
            const speechText = RIDDLE_REQUEST + riddle;

            return response
                .speak(speechText)
                .reprompt(INFO_ANSWER)
                .withSimpleCard(SKILL_NAME, riddle)
                .getResponse();
        }    
    },
};

const HintRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside HintRequestHandler");

        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HintRequest';
    },
    handle(handlerInput) {
        console.log("Inside HintRequest");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const currentIndex = attributes.database.currentRiddle;
        const lastStart = attributes.database.lastStartedAt;
        const d = new Date().getTime();
        const timePassed = d - lastStart;
        const currentHint = attributes.database.currentHint

        if (timePassed > 86400000) {
            const speechText = getHint(handlerInput, currentIndex);

            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(INFO_ANSWER)
                .withSimpleCard(SKILL_NAME, speechText)
                .getResponse();
        } else {
            if (!currentHint) {
                console.log("Hint request rejected");
                const speechText = HINT_REJECT;

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withSimpleCard(SKILL_NAME, speechText)
                    .getResponse();
            } else {
                console.log("Repeating the old hint");
                const speechText = currentHint + HINT_OLD;

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withSimpleCard(SKILL_NAME, speechText)
                    .getResponse();
            }
        }
    },
};

const AnswerRiddleRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside AnswerRiddleRequestHandler");

        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
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
            .withSimpleCard(SKILL_NAME, speechText)
            .getResponse();
    },
};

const AnswerRiddleIntentHandler = {
    canHandle(handlerInput) {
        console.log("Inside AnswerRiddleIntentHandler");

        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerRiddleIntent';
    },
    handle(handlerInput) {
        console.log("Inside AnswerRiddleIntent");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const answer = data[attributes.database.currentRiddle].answer;
        const isCorrect = isTheRightAnswer(handlerInput.requestEnvelope.request.intent.slots, answer);

        if (isCorrect) {
            const speechText = RIGHT_ANSWER;

            //UPDATE DATABASE
            attributes.database.solvedRiddles.push(attributes.database.currentRiddle);
            attributes.database.doneRiddles.push(attributes.database.currentRiddle);
            attributes.database.currentHint = '';
            attributes.database.hintsCounter = 0;
            attributes.database.currentRiddle = '';

            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard(SKILL_NAME, speechText)
                .getResponse();
        } else {
            const speechText = WRONG_ANSWER;

            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard(SKILL_NAME, speechText)
                .getResponse();
        }
    },
};

const GetAnswerIntentHandler = {
    canHandle(handlerInput) {
        console.log("Inside GetAnswerIntentHandler");

        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetAnswerIntent';
    },
    handle(handlerInput) {
        console.log("Inside GetAnswerIntent");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const answer = data[attributes.database.currentRiddle].answer;

        //UPDATE DATABASE
        attributes.database.unsolvedRiddles.push(attributes.database.currentRiddle);
        attributes.database.doneRiddles.push(attributes.database.currentRiddle);
        attributes.database.currentHint = '';
        attributes.database.hintsCounter = 0;
        attributes.database.currentRiddle = '';

        const speechText = GET_ANSWER + answer + ". Stai sbattendo la testa contro il muro ora? Chiedi un nuovo indovinello e non pensarci più.";

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt("Ora puoi chiedere un nuovo indovinello al signore degli enigmi.")
            .withSimpleCard(SKILL_NAME, speechText)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        console.log("Inside HelpIntentHandler");
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = HELP_MESSAGE;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(HELP_REPROMPT)
            .withSimpleCard(SKILL_NAME, speechText)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        console.log("Inside CancelAndStopIntentHandler");
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = STOP_MESSAGE;

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard(SKILL_NAME, speechText)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        console.log("Inside SessionEndedRequestHandler");
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        console.log("Inside ErrorHandler");
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Scusa, non ho capito il tuo comando. Prova a ripetere di nuovo.')
            .reprompt('Scusa, non ho capito il tuo comando. Prova a ripetere di nuovo.')
            .getResponse();
    },
};

const PersistenceGettingRequestInterceptor = {
    process(handlerInput) {
        return new Promise((resolve, reject) => {
            console.log("Inside PersistenceGettingRequestInterceptor");
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
                            'hintsCounter':0,
                            'currentHint':''
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
            console.log("Inside PersistenceSavingResponseInterceptor");
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

function getHint(handlerInput, index) {
    console.log("I'm in getHint()");

    //GET SESSION ATTRIBUTES
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    //LOGIC
    const answer = data[index].answer;
    const length = answer.length;
    const firstCar = answer.charAt(0);
    const secCar = answer.charAt(1);
    const numberOfHints = attributes.database.hintsCounter;
    const d = new Date().getTime();
    let speechText;

    switch (numberOfHints) {
        case 0:
            speechText = `La soluzione è una parola singola composta da ${length} caratteri.`;
            break;
        case 1:
            speechText = `La soluzione è una parola singola composta da ${length} caratteri. La prima lettera è la ${firstCar}.`;
            break;
        case 2:
            speechText = `La soluzione è una parola singola composta da ${length} caratteri. La prima lettera è la ${firstCar}. La seconda lettera è la ${secCar}.`;
            break;
        default:
            speechText = `La soluzione è una parola singola composta da ${length} caratteri. La prima lettera è la ${firstCar}. La seconda lettera è la ${secCar}. Hai raggiunto il numero massimo di indizi. Se non riesci comunque a trovare la soluzione, chiedi al signore degli enigmi di svelarti la soluzione segreta.`;
    }

    //UPDATE SESSION ATTRIBUTES
    attributes.database.hintsCounter += 1;
    attributes.database.currentHint = speechText;
    attributes.database.lastStartedAt = d;

    //SAVE SESSION ATTRIBUTES
    handlerInput.attributesManager.setSessionAttributes(attributes);

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
        HintRequestHandler,
        GetAnswerIntentHandler
    )
    .addRequestInterceptors(PersistenceGettingRequestInterceptor)
    .addResponseInterceptors(PersistenceSavingResponseInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withAutoCreateTable(true)
    .withTableName('Database4Enigmi')
    .lambda();
