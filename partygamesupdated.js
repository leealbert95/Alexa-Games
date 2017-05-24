'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
    //    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

     //if (event.session.application.applicationId !== "amzn1.ask.skill.eee033e0-c750-4130-9163-22b5b84d6018") {
     //    context.fail("Invalid Application ID");
     // }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            console.log(event.request.type);
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            console.log(event.request.type);
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            console.log(event.request.type);
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    //console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
    //    + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    //console.log("onLaunch requestId=" + launchRequest.requestId
    //    + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent Function");
 
    //console.log("onIntent requestId=" + intentRequest.requestId
    //    + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        
    console.log(intentName);

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    // dispatch custom intents to handlers here
    if ("ChooseGameIntent" == intentName && session.attributes.currentGame === null) {
        handleChooseGameRequest(intent, session, callback);
    } else if ("ChooseGameOnlyIntent" == intentName && session.attributes.currentGame === null) {
        handleChooseGameRequest(intent, session, callback);
    } else if ("HangmanGuessIntent" == intentName && session.attributes.currentGame == "hangman" && session.attributes.word !== null) {
        handleHangmanGuess(intent, session, callback);
    } else if ("DifficultyIntent" == intentName && session.attributes.currentGame == "hangman" && session.attributes.difficulty === null) {
        hangmanDifficulty(intent, session, callback);
    } else if ("CurrentWordIntent" == intentName && session.attributes.currentGame == "hangman" && session.attributes.word !== null) {
        hangmanCurrentWord(intent, session, callback);
    } else if ("ListGuessesIntent" == intentName && session.attributes.currentGame == "hangman" && session.attributes.word !== null) {
        hangmanGuessedLetters(intent, session, callback);
    } else if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AnswerOnlyIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("BetIntent" === intentName) {
        handleBetRequest(intent, session, callback);
    } else if ("BetOnlyIntent" === intentName) {
        handleBetRequest(intent, session, callback);
    } else if ("AllInIntent" === intentName) {
        handleBetRequest(intent, session, callback); 
    } else if ("DontKnowIntent" === intentName) {
        handleBetRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        handleRepeatRequest(intent, session, callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    //console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
    //    + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}


// ------- Skill specific business logic -------
var CARD_TITLE = "Party Games";
var hardWords = ["jazz", "polyrhythms", "drywall", "krypton", "blotchy",
                "python", "zephyr", "syncing", "brawny", "martyr", 
                "gryphon", "gymnast", "yacht", "pyre"];
var easyWords = ["account", "reason", "coal", "group", "memory", "powder", 
                "impulse", "servant", "country", "test", "word", "year",
                "opinion", "discussion", "history"];
                
var questions = [
    {
        "Who was the frontman of the band Nirvana?": [
            "Kurt Cobain",
            "Krist Novoselic",
            "Dave Grohl",
            "Tommy Iommi",
            "Tom Delonge",
            "Eddie Van Halen"
        ]
    },
    {
        "Which of these songs is NOT by ACDC?": [
            "Jump",
            "Highway to Hell",
            "Back in Black",
            "You Shook Me All Night Long",
            "Shoot to Thrill",
        ]
    },
    {
        "Which of the following is false about pop legend Michael Jackson?": [
            "He invented the moonwalk",
            "He holds a patent",
            "He died of cardiac arrest",
            "He wanted to play the role of Spider Man",
            "He owned a personal amusement park",
            "He was eventually acquitted of his child molestation charges"
        ]
    },
    {
        "Which of these is an album by the English band Pink Floyd?": [
            "The Dark Side of the Moon",
            "Eclipse",
            "Us and Them",
            "The Marshall Mathers LP 2",
            "Hail to the King",
            "1984"
        ]
    },
    {
        "Which hip hop figure is largely responsible for the rapper Eminem's breakthrough in the early 2000's?": [
            "Dr. Dre",
            "Jay Z",
            "Snoop Dogg",
            "Tupac Shakur",
            "Nas",
            "Ice Cube"
        ]
    },
    {
        "What is rapper Kendrick Lamar's true last name?": [
            "Duckworth",
            "Smith",
            "Marshall",
            "Lee",
            "Harvey",
            "Ellis"
        ]
    },
    {
        "Which of these single acts is the best selling artist in history by number of records sold?": [
            "Elvis Presley",
            "Madonna",
            "Michael Jackson",
            "Rihanna",
            "Shakira",
            "Frank Sinatra",
            "Celine Dion"
        ]
    },
    {
        "This condiment brand has been seeing major exposure in hip hop lyrics recently. It is: ": [
            "Grey Poupon",
            "Heinz",
            "French's",
            "Hunt's",
            "Sriracha"
        ]
    },
    {
        "What is the cause of musician John Lennon's death?": [
            "Murder",
            "Lung cancer",
            "Accidental overdose",
            "Natural causes",
            "Car accident",
            "Liver failure"
        ]
    },
    {
        "What is the inspiraton for blues musician B.B. King naming his guitar Lucille?": [
            "A fire at a dance hall",
            "A fight during a fan meet",
            "His wife",
            "An affair with a woman named Lucille",
            "Personal whim",
            "His mother"
        ]
    },
    {
        "What is the nickname of former Seattle Seahawks running back Marshawn Lynch?": [
            "Beast Mode",
            "Happy Feet",
            "God Hands",
            "Tank",
            "Big Daddy",
            "Comeback Kid"
        ]
    },
    {
        "Which NFL team holds the current record for most Super Bowl wins?": [
            "The Pittsburgh Steelers",
            "The New England Patriots",
            "The Seattle Seahawks",
            "The Denver Broncos",
            "The San Francisco 49'ers",
            "The Dallas Cowboys",
            "The Oakland Raiders"
        ]
    },
    {
        "Which NBA player holds the all-time record for most points accumulated over his career?": [
            "Kareem Abdul-Jabbar",
            "Kobe Bryant",
            "Michael Jordan",
            "Stephen Curry",
            "Wilt Chamberlain",
            "Lebron James"
        ]
    },
    {
        "How many players are on each team in a conventional game of basketball?": [
            "5 players",
            "6 players",
            "7 players",
            "10 players",
            "4 players",
            "9 players"
        ]
    },
    {
        "Which country currently holds the most wins in the UEFA Champions League?": [
            "Spain",
            "The United Kingdom",
            "Germany",
            "Portugal",
            "France",
            "Italy"
        ]
    },
    {
        "Which country won the 2014 World Cup?": [
            "Germany",
            "Brazil",
            "Argentina",
            "Spain",
            "Portugal",
            "North Korea"
        ]
    },
    {
        "Which of the following is true about baseball great Babe Ruth?": [
            "He was one of the first five players inducted into the Baseball Hall of Fame",
            "He holds the all time record for most home runs in history",
            "He only married once",
            "He served in World War 1",
            "He is still living",
            "He originally worked as a busboy before his baseball career"
        ]
    },
    {
        "How many gold medals did the United States win in the 2016 Olympic Games?": [
            "46",
            "35",
            "51",
            "70",
            "25",
            "33"
        ]
    },
    {
        "What was the primary catalyst for the United States' entry into World War 2?": [
            "The Japanese attack on Pearl Harbor",
            "Nazi Germany's unchecked annexation of other countries",
            "Soviet atrocities in Poland",
            "The Bolshevik Revolution",
            "The sinking of the Lusitania",
            "German bombing of Great Britain"
        ]
    },
    {
        "In what year did Germany first become a unified country?": [
            "1871",
            "1818",
            "1657",
            "1450",
            "1910",
            "1990",
            "1766"
        ]
    },
    {
        "This former president served as a pilot during World War 2 and narrowly evaded capture by the Japanese. He is: ": [
            "George H.W. Bush",
            "Ronald Reagan",
            "Donald Trump",
            "Richard Nixon",
            "Gerald Ford",
            "John F. Kennedy",
            "Dwight D. Eisenhower"
        ]
    },
    {
        "What is the capital of Brazil?" : [
            "Brasilia",
            "Rio De Janeiro",
            "Sao Paulo",
            "Bogota",
            "Cancun",
            "Lima"
        ]
    },
];

function getWelcomeResponse(callback) {
    console.log("getWelcomeResponse Function");
 
    var sessionAttributes = {},
        speechOutput = "Which game would you like to play? The currently supported games are hangman, fortunately unfortunately, and high stakes trivia.",
        supportedGames = "The currently supported games are hangman, fortunately unfortunately, and high stakes trivia.",
        shouldEndSession = false;

    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": "That is not a valid response. " + speechOutput,
        "currentGame": null
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, supportedGames, shouldEndSession));
}


function handleHangmanGuess(intent, session, callback) {
    console.log("handleHangmanGuess Function");
 
    var guess = intent.slots.Guess.value.substring(0,1).toLowerCase();
    console.log(guess);
    var shouldEndSession = false;
    var isInWord = false;
    var speechOutput = "";
    var sessionAttributes = {};
    
    // guess has already been guessed
    if (session.attributes.guesses.indexOf(guess) > -1) {
        var wordStr2 = session.attributes.guessedWord.join().toLowerCase();
        speechOutput = "You have already guessed the letter " + guess + ". A life has not been taken from you. The current word is " + wordStr2 + ". You have " + 
        String(session.attributes.lives) + " lives left. Guess a letter."
        
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": session.attributes.word,
            "guessedWord": session.attributes.guessedWord,
            "lives": session.attributes.lives,
            "guesses": session.attributes.guesses,
            "difficulty": session.attributes.difficulty
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    } 
    //guess is a new letter
    else {
        session.attributes.guesses.push(guess);
        
        for (var i = 0; i < session.attributes.word.length; i++) {
            if (session.attributes.word[i] == guess) {
                isInWord = true;
                session.attributes.guessedWord[i] = guess;
            }
        }
    
        var wordStr = session.attributes.guessedWord.join().toLowerCase();
        if (isInWord) {
            if (wordStr.replace(/,/g, "") != session.attributes.word.toLowerCase()) {
                speechOutput = "Well done! The current word is " + wordStr + ". You have " + String(session.attributes.lives) +
                    "lives left. Guess a letter.";
            } else {
                speechOutput = "Congratulations, you win! The word was " + session.attributes.word;
                shouldEndSession = true;
            }
        } else {
            session.attributes.lives = session.attributes.lives - 1;
            if (session.attributes.lives > 0) {
                speechOutput = "Oh no, " + guess + " was not in the word! The current word is " + wordStr + ". You have " + String(session.attributes.lives) +
                    " lives left. Guess a letter.";
            } else {
                speechOutput = "Oh no, " + guess + " was not in the word! You are out of lives. You lose! The word was " + session.attributes.word;
                shouldEndSession = true;
            }
        }
   
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": session.attributes.word,
            "guessedWord": session.attributes.guessedWord,
            "lives": session.attributes.lives,
            "guesses": session.attributes.guesses,
            "difficulty": session.attributes.difficulty
        };
    
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    }
}

function handleChooseGameRequest(intent, session, callback) {
    console.log("handleChooseGameRequest Function");
 
    var speechOutput = "";
    var sessionAttributes = {};
    var gameName = intent.slots.Game.value;
    
    if (gameName == "hangman") {
        launchHangman(intent, session, callback);
    } else if (gameName == "fortunately unfortunately") {
        launchFortunatelyUnfortunately(intent, session, callback);
    } else if (gameName == "high stakes trivia") {
        launchHighStakesTrivia(intent, session, callback);
    } else {
        throw "Invalid Intent";
    }
}
var ANSWER_COUNT = 4;
var GAME_LENGTH = 10;
var STARTING_POT = 20000; 
var STARTING_MULTIPLIER = 1; 

function launchHighStakesTrivia(intent, session, callback) {
    var sessionAttributes = {},
        speechOutput = "Welcome to High Stakes Trivia. I will ask you " + GAME_LENGTH.toString()
            + " questions. After hearing the question, you may bet a multiple of a thousand between one thousand and ten thousand dollars. "
            + "Depending on your stack size, a multiplier will be applied to your bet. "
            + "To give your answer, just say the number of the answer. If you don't know, a small amount will be deducted from your stack. Let's begin! ",
        shouldEndSession = false,

        gameQuestions = populateGameQuestions(),
        correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT)), // Generate a random index for the correct answer, from 0 to 3
        roundAnswers = populateRoundAnswers(gameQuestions, 0, correctAnswerIndex),

        currentQuestionIndex = 0,
        spokenQuestion = Object.keys(questions[gameQuestions[currentQuestionIndex]])[0],
        repromptText = "Question 1. " + spokenQuestion + " ";

        for (var i = 0; i < ANSWER_COUNT; i++) { 
            repromptText += (i+1).toString() + ". " + roundAnswers[i] + ". ";
        }

    repromptText += "What is your answer? ";
    speechOutput += repromptText;
    sessionAttributes = {
        "speechOutput": repromptText,
        "repromptText": repromptText,
        "currentQuestionIndex": currentQuestionIndex,
        "correctAnswerIndex": correctAnswerIndex + 1,
        "currentAnswer": null,
        "questions": gameQuestions,
        "pot": STARTING_POT,
        "multiplier": STARTING_MULTIPLIER,
        "streak": 0, 
        "correctAnswerText":
            questions[gameQuestions[currentQuestionIndex]][Object.keys(questions[gameQuestions[currentQuestionIndex]])[0]][0]
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function populateGameQuestions() {
    var gameQuestions = [];
    var indexList = [];
    var index = questions.length;

    if (GAME_LENGTH > index){
        throw "Invalid Game Length.";
    }

    for (var i = 0; i < questions.length; i++){
        indexList.push(i);
    }

    // Pick GAME_LENGTH random questions from the list to ask the user, make sure there are no repeats.
    for (var j = 0; j < GAME_LENGTH; j++){
        var rand = Math.floor(Math.random() * index);
        index -= 1;

        var temp = indexList[index];
        indexList[index] = indexList[rand];
        indexList[rand] = temp;
        gameQuestions.push(indexList[index]);
    }

    return gameQuestions;
}

function populateRoundAnswers(gameQuestionIndexes, correctAnswerIndex, correctAnswerTargetLocation) {
    // Get the answers for a given question, and place the correct answer at the spot marked by the
    // correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    // only ANSWER_COUNT will be selected.
    var answers = [],
        answersCopy = questions[gameQuestionIndexes[correctAnswerIndex]][Object.keys(questions[gameQuestionIndexes[correctAnswerIndex]])[0]],
        temp, i;

    var index = answersCopy.length;

    if (index < ANSWER_COUNT){
        throw "Not enough answers for question.";
    }

    // Shuffle the answers, excluding the first element.
    for (var j = 1; j < answersCopy.length; j++){
        var rand = Math.floor(Math.random() * (index - 1)) + 1;
        index -= 1;

        var temp = answersCopy[index];
        answersCopy[index] = answersCopy[rand];
        answersCopy[rand] = temp;
    }

    // Swap the correct answer into the target location
    for (i = 0; i < ANSWER_COUNT; i++) {
        answers[i] = answersCopy[i];
    }
    temp = answers[0];
    answers[0] = answers[correctAnswerTargetLocation];
    answers[correctAnswerTargetLocation] = temp;
    return answers;
}

function handleBetRequest(intent, session, callback) {
    console.log("Handling Bet Request");
    var speechOutput = "", reprompt = "";
    var sessionAttributes = {};
    var gameInProgress = session.attributes && session.attributes.questions;
    var validBet = false;
    var isBetting = intent.name === "BetIntent" || intent.name === "BetOnlyIntent";
    if (isBetting)
        validBet = isBetValid(intent); 
    var userGaveUp = intent.name === "DontKnowIntent";
    var allIn = intent.name === "AllInIntent"; 
    console.log("Current answer: " + session.attributes.currentAnswer);
    if (!gameInProgress) {
        // If the user responded with an answer but there is no game in progress, ask the user
        // if they want to start a new game. Set a flag to track that we've prompted the user.
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = "There is no game in progress. Do you want to start a new game? ";
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    } else if ((isBetting || allIn) && session.attributes.currentAnswer === null) {
        reprompt = session.attributes.speechOutput;
        speechOutput = "You cannot bet without giving your answer first. " + reprompt;
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    } else if (isBetting && !validBet) {
        reprompt = session.attributes.speechOutput;
        speechOutput = "Your answer must be a mutiple of 1000 between 1000 and 10000. " + reprompt;
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    } else if (allIn && parseInt(session.attributes.streak) < 2) {
        reprompt = session.attributes.speechOutput;
        speechOutput = "You may not all in yet. You must get at least two consecutive questions correct. " + reprompt;
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    } else {
        
        var currentPot = parseInt(session.attributes.pot),
            currentBet = 0,
            correctAnswerIndex = parseInt(session.attributes.correctAnswerIndex),
            correctAnswerText = session.attributes.correctAnswerText,
            currentQuestionIndex = parseInt(session.attributes.currentQuestionIndex),
            streak = parseInt(session.attributes.streak),
            multiplier = parseInt(session.attributes.multiplier), 
            gameQuestions = session.attributes.questions,
            speechOutputAnalysis = "",
            currentAnswer = -1;
            
        if (isBetting) {
            currentBet = parseInt(intent.slots.Bet.value) * multiplier;
            currentAnswer = parseInt(session.attributes.currentAnswer);
        } else if (userGaveUp) {
            currentBet = 1000 * multiplier;
        } else if (allIn) {
            currentBet = parseInt(session.attributes.pot);
            currentAnswer = parseInt(session.attributes.currentAnswer);
            streak = 0; //reset streak to 0 once all in used
        }
        
        if (!userGaveUp && currentAnswer == correctAnswerIndex) {
            currentPot += currentBet;
            streak += 1;
            speechOutputAnalysis = "correct. ";
        } else {
            console.log("Not correct answer");
            if (!userGaveUp) 
                speechOutputAnalysis = "wrong. ";
            currentPot -= currentBet;
            if (currentPot < 0)
                currentPot = 0; 
            streak = 0; 
            speechOutputAnalysis += "The correct answer is " + correctAnswerIndex + ": " + correctAnswerText + ". ";
        }
       
        // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can exit the game session
        if (currentQuestionIndex == GAME_LENGTH - 1) {
            speechOutput = userGaveUp ? "" : "You are ";
            speechOutput += speechOutputAnalysis + "Your final pot size is " + currentPot.toString() + " dollars. Thanks for playing!";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
        } else if (currentPot === 0) {
            speechOutput = userGaveUp ? "" : "You are ";
            speechOutput += speechOutputAnalysis + "You have lost your entire pot and have been eliminated. Better luck next time!";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
        } else {
            console.log("Not end or eliminated");
            currentQuestionIndex += 1;
            var spokenQuestion = Object.keys(questions[gameQuestions[currentQuestionIndex]])[0];
            
            var mult_factor = currentPot - 10000; 
            if (mult_factor <= 10000) 
                mult_factor = 10000;
            multiplier = Math.floor(mult_factor/10000);

            correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT)); // Generate a random index for the correct answer, from 0 to 3
            var roundAnswers = populateRoundAnswers(gameQuestions, currentQuestionIndex, correctAnswerIndex);
            
            var questionIndexForSpeech = currentQuestionIndex + 1;
            reprompt = "Question " + questionIndexForSpeech.toString() + ". " + spokenQuestion + " ";
            
            for (var i = 0; i < ANSWER_COUNT; i++) {
                reprompt += (i+1).toString() + ". " + roundAnswers[i] + ". ";
            }
                
            reprompt += "What is your answer?";
            speechOutput += userGaveUp ? "" : "You are ";
            speechOutput += speechOutputAnalysis + "Your pot is now " + currentPot.toString() + " dollars. " + reprompt;

        sessionAttributes = {
            "speechOutput": reprompt,
            "repromptText": reprompt,
            "currentQuestionIndex": currentQuestionIndex,
            "correctAnswerIndex": correctAnswerIndex + 1,                
            "questions": gameQuestions,
            "currentAnswer": null,
            "pot": currentPot,
            "multiplier": multiplier,
            "streak": streak, 
            "correctAnswerText":
                questions[gameQuestions[currentQuestionIndex]][Object.keys(questions[gameQuestions[currentQuestionIndex]])[0]][0]
        };
        callback(sessionAttributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
        }
    }
}

function handleAnswerRequest(intent, session, callback) {
    console.log("Handling Answer Request");
    var speechOutput = "", reprompt = "";
    var sessionAttributes = {};
    var gameInProgress = session.attributes && session.attributes.questions;
    var answerSlotValid = isAnswerSlotValid(intent);

    if (!gameInProgress) {
        // If the user responded with an answer but there is no game in progress, ask the user
        // if they want to start a new game. Set a flag to track that we've prompted the user.
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = "There is no game in progress. Do you want to start a new game? ";
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    } else if (!answerSlotValid) {
        // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
        // return an error message to the user. Remember to guide the user into providing correct values.
        reprompt = session.attributes.speechOutput;
        speechOutput = "Your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". "  + reprompt;
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    } else {
        var answer = parseInt(intent.slots.Answer.value),
            canAllIn = parseInt(session.attributes.streak) >= 2,
            multiplier = parseInt(session.attributes.multiplier);
        reprompt = "How much would you like to bet? Your current multiplier is " + multiplier.toString() + ". ";
        
        if (canAllIn) {
            reprompt += "You may also choose to push your entire stack all in.";
        }
        speechOutput = "You have chosen " + answer.toString() +" .";
        speechOutput += reprompt; 

        session.attributes.currentAnswer = answer;
        session.attributes.speechOutput = reprompt;
        session.attributes.repromptText = reprompt;
        
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    }
}

function isAnswerSlotValid(intent) {
    var answerSlotFilled = intent.slots && intent.slots.Answer && intent.slots.Answer.value;
    var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Answer.value));
    var answer = parseInt(intent.slots.Answer.value);
    console.log("AnswerIntent Slot Value: " + intent.slots.Answer.value); 
    return answerSlotFilled && answer >= 1 && answer <= 4;
}

function isBetValid(intent) {
    var betSlotFilled = intent.slots && intent.slots.Bet && intent.slots.Bet.value;
    var betSlotIsInt = betSlotFilled && !isNaN(parseInt(intent.slots.Bet.value));
    var bet = parseInt(intent.slots.Bet.value);
    return betSlotIsInt && bet%1000 === 0 && bet/1000 > 0 &&  bet/1000 < 11; 
}

function launchHangman(intent, session, callback) {
    console.log("launchHangman Function");
 
    var speechOutput = "Launching Hangman. Which difficulty would you like to play on, easy or hard?";
    var shouldEndSession = false;
    
    var sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": "That command is not valid. " + speechOutput,
        "currentGame": "hangman",
        "word": null,
        "guessedWord": null,
        "lives": null,
        "guesses": null,
        "difficulty": null
    };
    
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
}

function hangmanDifficulty(intent, session, callback) {
    console.log("hangmanDifficulty Function");
 
    var shouldEndSession = false;
    var word = "";
    var speechOutput = "";
    var randInt;
    var sessionAttributes = {};
    
    if (intent.slots.Difficulty.value == "easy") {
        randInt = Math.floor(Math.random()*easyWords.length);
        word = easyWords[randInt];
        
        speechOutput = "You are playing on easy difficulty. To guess a letter, just say the letter. You may also use the Nato Phonetic alphabet. To hear what letters you have guessed,"
            + " say What have I guessed. To hear your current word, ask What is my current word. You have 6 lives. Your word is " + String(word.length)
            + " letters long. Good luck! Guess a letter.";
            
        //speechOutput = speechOutput + " The word is " + word;    
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": word,
            "guessedWord": Array(word.length).fill("blank"),
            "lives": 6,
            "guesses": [],
            "difficulty": "easy"
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    } else {
        randInt = Math.floor(Math.random()*hardWords.length);
        word = hardWords[randInt];
        
        speechOutput = "You are playing on hard difficulty. To guess a letter, just say the letter. You may also use the Nato Phonetic alphabet. To hear what letters you have guessed,"
            + " ask: What have I guessed. To hear your current word, ask: What is my current word. You have 4 lives. Your word is " + String(word.length)
            + " letters long. Good luck! Guess a letter.";
            
        //speechOutput = speechOutput + " The word is " + word;
        
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": word,
            "guessedWord": Array(word.length).fill("blank"),
            "lives": 4,
            "guesses": [],
            "difficulty": "hard"
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    }
    
}

function hangmanGuessedLetters(intent, session, callback) {
    console.log("hangmanGuessedLetters Function");
 
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    var wordStr = "";
    
    if (session.attributes.guesses.length < 1) {
        wordStr = session.attributes.guessedWord.join().toLowerCase();
        speechOutput = "You have not guessed a letter yet. The current word is: " + wordStr + ". You have " + String(session.attributes.lives)
        + " lives left. Guess a letter.";
        
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": session.attributes.word,
            "guessedWord": session.attributes.guessedWord,
            "lives": session.attributes.lives,
            "guesses": session.attributes.guesses,
            "difficulty": session.attributes.difficulty
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
            
    } else {
        console.log(session.attributes.guesses);
        var letters = session.attributes.guesses.toString().toLowerCase();
        wordStr = session.attributes.guessedWord.join().toLowerCase();
    
        speechOutput = "You have guessed the following letters: " + letters + 
            ". The current word is: " + wordStr + ". You have " + String(session.attributes.lives)
            + " lives left. Guess a letter.";
    
        sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": session.attributes.word,
            "guessedWord": session.attributes.guessedWord,
            "lives": session.attributes.lives,
            "guesses": session.attributes.guesses,
            "difficulty": session.attributes.difficulty
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
    }
}
function hangmanCurrentWord(intent, session, callback) {
    console.log("hangmanCurrentWord Function");
    
    var shouldEndSession = false;
    var wordStr = session.attributes.guessedWord.join().toLowerCase();
    var speechOutput = "Your current word is: " + wordStr + ". You have " + String(session.attributes.lives) + " lives left. Guess a letter.";
    
    var sessionAttributes = {
            "speechOutput": speechOutput,
            "repromptText": "That command is not valid. " + speechOutput,
            "currentGame": "hangman",
            "word": session.attributes.word,
            "guessedWord": session.attributes.guessedWord,
            "lives": session.attributes.lives,
            "guesses": session.attributes.guesses,
            "difficulty": session.attributes.difficulty
        };
        
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
}

function launchFortunatelyUnfortunately(intent, session, callback) {
    console.log("launchFortunatelyUnfortunately Function");
    
    var speechOutput = "Launching Fortunately Unfortunately.";
    var shouldEndSession = true;
    var sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": "That command is not valid. " + speechOutput,
        "currentGame": "forunately unfortunately"
    };
    
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput + " Ending demo. Goodbye!", speechOutput + " Ending demo. Goodbye!", shouldEndSession));
}

function launchQuizzer(intent, session, callback) {
    console.log("launchQuizzer Function");
    
    var speechOutput = "Launching Quizzer.";
    var shouldEndSession = true;
    var sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": "That command is not valid. " + speechOutput,
        "currentGame": "quizzer"
    };
    
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput + " Ending demo. Goodbye!", speechOutput + " Ending demo. Goodbye!", shouldEndSession));
}

function handleRepeatRequest(intent, session, callback) {
    console.log("handleRepeatRequest Function");
    
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.repromptText, session.attributes.repromptText, false));
    }
}


function handleFinishSessionRequest(intent, session, callback) {
    console.log("handleFinishSessionRequest Function");
    
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
