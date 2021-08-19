const CONTRACT = 'dev-1629335314867-7422901';

let game;

function q(input) { return document.querySelector(input); };
function matchingCharArray(word_one, word_two) {
  if (word_one.length == word_two.length) {
    for (var i = 0; i < word_one.length; i++) {
      if (word_one[i] == word_two[i]) {
        if (i == word_one.length - 1) {
          return true;
        }
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org'
});

const wallet = new nearApi.WalletConnection(near, 'my-app');

const contract = new nearApi.Contract(wallet.account(), CONTRACT, { //'dev-1628898366672-7385992'
  viewMethods: [
    'getWordsList',

  ],
  changeMethods: [

    'getLevelWords',
    'setWordList',
    'getLastLevelPlayed',
    'submitLastLevelPlayed',
    'checkPayEligibleWordsForToday',
    'initializeAvatarMinting',
    'initializePlayers',

    'getThisPlayerAddress',
    'getThisPlayerRewardsToClaim',
    'getThisPlayerWordCountEligibleForRewards'

  ]
});

const button = document.getElementById('sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  document.querySelector("#signed-out-flow").classList.remove("hide");
} else {
  signedInProcess();
}

document.getElementById('sign-in-button').addEventListener('click', () => {
  if (wallet.isSignedIn()) {
    signedInProcess();
  } else {
    wallet.requestSignIn({
      contractId: CONTRACT,
      methodNames: [
        'getWordsList',
        'checkPayEligibleWordsForToday',

        'getLevelWords',
        'setWordList',
        'getLastLevelPlayed',
        'submitLastLevelPlayed',
        'checkPayEligibleWordsForToday',
        'initializeAvatarMinting',
        'initializePlayers',

        'getThisPlayerAddress',
        'getThisPlayerRewardsToClaim',
        'getThisPlayerWordCountEligibleForRewards'
      ]
    });
  }
});

document.getElementById('sign-out-button').addEventListener('click', () => {
  wallet.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
});

function signedInProcess() {
  let signed_in_flows = document.querySelectorAll(".signed-in-flow");
  for (var siflow = 0; siflow < signed_in_flows.length; siflow++) {
    signed_in_flows[siflow].classList.remove("hide");
  }
  q("#account-id").innerHTML = wallet._authData.accountId;
  q("#contract-link").innerHTML = contract.contractId;

  contract.getLastLevelPlayed({})
    .then(result => {
      console.log(result);

      if (result != null) {
        q("#levels-played").innerHTML = result.levelCount;
        q("#last_level").innerHTML = result.level;
        q("#last_wpm").innerHTML = result.wpm;
        q("#last_accuracy").innerHTML = result.accuracy;
      }

      startGame();
    });
}

function Game() {
  let size = 5;
  let current_words = [];
  let this_word = "";
  let this_word_index = 0;
  let correct_count = 0;
  let wrong_count = 0;
  let that = this;
  let game_running = true;
  let timer_paused = false;
  let totalSeconds = 0;
  let WPM_DECIMALS = 2;
  let timerVar = undefined;
  let LEVEL = 1;
  let CURRENT_WPM = 0;
  let CURRENT_ACCURACY = 0;
  let CUMULATIVE_SIZE = 0;
  let TIMER_ONCE = false;
  let current_completed_string = [];
  let WRONG_CHARACTER_COUNT = 0;
  let CORRECT_CHARACTER_COUNT = 0;
  let MAX_OFFSET_HEIGHT = 445;
  let GAME_LOST = false;
  let WIDTH_FOR_ITEMS = 900;
  let CURRENT_VELOCITY = 0;
  let LASER_COUNT = 0;
  let STATIC_Y_AVATAR_HEIGHT = 0;
  let Y_MAX_HEIGHT = 460;
  let THIS_LEVEL_WORD_INDEXES = [];
  let moving_between_levels = true;

  this.isGameOver = function(){
    return GAME_LOST;
  };

  this.resetGameOver = function() {
    GAME_LOST = false;
    current_completed_string = [];
    WRONG_CHARACTER_COUNT = 0;
    CORRECT_CHARACTER_COUNT = 0;
    CURRENT_ACCURACY = 0;
    CURRENT_WPM = 0;
    LEVEL = 1;
    correct_count = 0;
    wrong_count = 0;
    that.resetTimer();
    current_words = [];
    this_word = "";
    this_word_index = 0;
    q("#words").innerHTML = "";

    that.init(WORDS, function () {
      that.timer();
      game_running = true;
      q("#game-start-lost-overlay").classList.add("hide");
      q("#words").classList.remove("hide");
      game.start();
      game.saveGameAndClaimWatcher();
      game.startThisWordWatcher();
      IS_FETCHING_WORDS = false;
    });

  };

  this.getLevel = function(){
    return LEVEL;
  }

  this.init = function (words, callback) {
    q("#game-start-lost-overlay").innerHTML = "get ready..."
    that.getLevelWords(function(){

      q("#game-start-lost-overlay").classList.add("hide");
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      if (width < 500) { WIDTH_FOR_ITEMS = 250; }

      if (LEVEL == 1) { size = 5; }
      else if (LEVEL == 2) { size = 10; }
      else if (LEVEL == 3) { size = 15; }
      else if (LEVEL == 4) { size = 20; }
      else if (LEVEL >= 5) { size = 25; }
      q("#level").innerHTML = (LEVEL > 6 ? "expert" : LEVEL);

      let builder = "";
      for (var x = 0; x < THIS_LEVEL_WORD_INDEXES.length; x++) {
       let random_word = WORDS.english[THIS_LEVEL_WORD_INDEXES[x]];
        current_words.push(random_word);
        if (x == 0) { this_word = random_word.split(""); }

        let current_word_chars = random_word.split("");
        let char_builder = "";
        for (var c = 0; c < current_word_chars.length; c++) {
          char_builder += '<span class="char">' + current_word_chars[c] + '</span>';
        }
        builder += '<div class="word ' + (x == 0 ? "current-word " : "not-current-word") + '" style="right:' + (Math.random() * WIDTH_FOR_ITEMS) + 'px;">' + char_builder + '</div>';
      }

      q("#words").innerHTML = builder;
      that.setAnimationByLevel();

      if (!TIMER_ONCE) {
        STATIC_Y_AVATAR_HEIGHT = that.currentAvatarPosition()[1];
        that.moveItem(q("#current-avatar-canvas"), that.currentAvatarPosition());
        TIMER_ONCE = true;
        that.timer();
      }
      moving_between_levels = false;
      callback();
    });
  };

  this.pauseTimer = function() {
    CURRENT_WPM = ((correct_count + wrong_count) / (totalSeconds / 60)).toFixed(2);
    CURRENT_ACCURACY = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0);

    timer_paused = true;
    clearInterval(timerVar);
    timerVar = undefined;
  };

  this.resetTimer = function () {
    timer_paused = false;
    totalSeconds = 0;
    clearInterval(timerVar);
    timerVar = undefined;
  }

  this.moveItem = function(element, x_y_array) {
    element.style.left = x_y_array[0] + "px";
    element.style.top = x_y_array[1] + "px";
  }
  this.currentAvatarPosition = function() {
    let element = q("#current-avatar-canvas");
    var position = element.getBoundingClientRect();
    var x = position.left;
    var y = position.top;
    return [x, y];
  };

  this.currentMovingLocation = function() {
    let current_selected_word = q("#words");
    var element = current_selected_word.childNodes[this_word_index];
    if (typeof element == 'undefined') {
      return [window.innerWidth / 2, window.innerHeight / 2, 20];
    } else {
      var position = element.getBoundingClientRect();
      var x = position.left;
      var y = position.top;
      return [x, y, (position.width / 2)];
    }
  };

  this.sendLaser = function() {
    let new_circle = document.createElement("div");
    new_circle.id = "laser"+LASER_COUNT;
    new_circle.classList.add("circle");
    q("#typing-game").append(new_circle);
    LASER_COUNT++;

    let current_selected_word = q("#words");
    var current_moving_word = current_selected_word.childNodes[this_word_index];
    that.moveItem(new_circle, ([(current_moving_word.offsetLeft+that.currentMovingLocation()[2]), Y_MAX_HEIGHT]));
  };

  this.timer = function () {
    var minutesLabel = document.getElementById("minutes");
    var secondsLabel = document.getElementById("seconds");
    timerVar = setInterval(setTime, 1000);

    function setTime() {
      if (!timer_paused) {
        ++totalSeconds;
        secondsLabel.innerHTML = pad(totalSeconds % 60);
        minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
        if (this_word_index == 0) { }
        else {
          q("#wpm").innerHTML = ((correct_count + wrong_count) / (totalSeconds / 60)).toFixed(0);
          CURRENT_WPM = ((correct_count + wrong_count) / (totalSeconds / 60)).toFixed(2);
          q("#accuracy").innerHTML = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0) + "%";
          CURRENT_ACCURACY = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0);
        }
      } else {
        clearInterval(timerVar);
      }
    }

    function pad(val) {
      var valString = val + "";
      if (valString.length < 2) {
        return "0" + valString;
      } else {
        return valString;
      }
    }
  };

  this.setAnimationByLevel = function () {
    let current_selected_word = q("#words");

    if (LEVEL == 1) {
      size = 5;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 7s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 7;
    }
    else if (LEVEL == 2) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 6s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 6;
    }
    else if (LEVEL == 3) {
      size = 15;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 5;
    }
    else if (LEVEL == 4) {
      size = 20;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 4s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 4;
    }
    else if (LEVEL == 5) {
      size = 25;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 3s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 3;
    } else if (LEVEL == 6) {
      size = 25;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 2s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 3;
    } else if (LEVEL > 6) {
      size = 25;
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 1s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 3;
    }
    CURRENT_VELOCITY = Y_MAX_HEIGHT / CURRENT_VELOCITY; // From css MoveUpDown pixels
  };

  this.checkAndSetNextWord = function () {
    let found_first_instance = false;

    if (this_word_index + 1 == current_words.length) { game_running = false; } else {
      this_word = current_words[this_word_index + 1].split("");
    }

    let current_selected_word = q("#words");

    if (this_word_index + 1 == current_words.length) { game_running = false; } else {
      current_selected_word.childNodes[this_word_index].classList.remove("current-word");
      this_word_index++;
      current_selected_word.childNodes[this_word_index].classList.add("current-word");
    }
    that.setAnimationByLevel();

    if (!game_running && !GAME_LOST) {
      console.log("Tried to get init from here");
      current_selected_word.childNodes[this_word_index].classList.remove("current-word");
      that.resetAndProceedToNewSession();

    }
  };

  this.startThisWordWatcher = function() {
      var checkTime = 100; //100 ms interval
      var check = setInterval(function () {
        if (typeof q("#words").childNodes[this_word_index] == 'undefined') {
          // changing levels
        }
        else {
          let current_word_height = q("#words").childNodes[this_word_index].offsetTop;
          if (current_word_height > MAX_OFFSET_HEIGHT) {
            that.endGame();
            clearInterval(check);
            check = undefined;
          }
        }
      }, checkTime);
  };

  this.endGame = function(){
    that.pauseTimer();
    GAME_LOST = true;
    game_running = false;
    q("#game-start-lost-overlay").classList.remove("hide");
    q("#game-start-lost-overlay").innerHTML = 'game over, saving game results to the blockchain...';
    q("#words").classList.add("hide");
    q("#words").childNodes[this_word_index].classList.add("hide");
    that.submitLastLevelPlayed(function (result) {
      q("#game-start-lost-overlay").innerHTML = 'click to start a new game';
      that.updateLastLevelPlayed(result);
    });
  };

  this.updateLastLevelPlayed = function(result){
    q("#levels-played").innerHTML = result.levelCount;
    q("#last_level").innerHTML = result.level;
    q("#last_wpm").innerHTML = result.wpm;
    q("#last_accuracy").innerHTML = result.accuracy;
  };

  this.saveGameAndClaimWatcher = function () {
    q("#save-game-results-and-claim").addEventListener('click', function () {
      that.saveGameResultToChain();
    });
  };

  this.submitLastLevelPlayed = async function(callback) {
    contract.submitLastLevelPlayed({ level: parseInt(LEVEL), wpm: String(CURRENT_WPM), accuracy: String(CURRENT_ACCURACY), wordsToSubmit: THIS_LEVEL_WORD_INDEXES, correctCount: correct_count })
      .then(result => {
        console.log("last level saved");
        console.log(result);
        callback(result);
      });
  };

  this.getLevelWords = async function(callback) {
    contract.getLevelWords({ level: LEVEL })
      .then(result => {
        console.log("word chain received!");
        console.log(result);
        THIS_LEVEL_WORD_INDEXES = result;
        callback()
      });
  };

  this.getLastLevelPlayed = async function() {
    contract.getLastLevelPlayed({})
      .then(result => {
        console.log("last level played is:");
        console.log(result);
      });
  };

  this.getWordsList = async function(callback) {
    contract.getWordsList({})
      .then(result => {
        console.log("word list ipfs received");
        console.log(result);
        fetch('https://ipfs.io/ipfs/' + result)
          .then(function (response) {
            // The response is a Response instance.
            // You parse the data into a useable format using `.json()`
            return response.json();
          }).then(function (data) {
            // `data` is the parsed version of the JSON returned from the above endpoint.
            console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
            WORDS = data;
            callback();
        });
    });
  };

  this.setWordList = async function(incomingWordsIpfsLocation) {
    contract.setWordList({ wordsIpfsLocation: "QmWWqSuE8mH9jXgvPuKPQXJCsNqbj7Dtn2p3Lw8TeqCG1i" })
      .then(result => {
        console.log("word list ipfs location saved to contract!");
        console.log(result);
      });
  };

  this.checkPayEligibleWordsForToday = async function() {
    contract.checkPayEligibleWordsForToday({ })
      .then(result => {
        console.log("checking eligible words for today!");
        let eligible_words_for_today = document.querySelectorAll(".eligible-words-for-today");
        for (var i = 0; i < eligible_words_for_today.length; i++) {
          eligible_words_for_today[i].innerHTML = result;
        }
    });
  };

  this.fullInitialize = async function() {
    that.setWordList();
    that.initializePlayers();
    that.initializeAvatarMinting();
  };

  this.initializePlayers = async function () {
    contract.initializePlayers({})
      .then(result => {
        console.log("initialize players!");
        console.log(result);
      });
  };

  this.getThisPlayerAddress = async function() {
    contract.getThisPlayerAddress({})
      .then(result => {
        console.log("checking this player address!");
        console.log(result);
    });
  };

  this.getThisPlayerRewardsToClaim = async function (callback) {
    contract.getThisPlayerRewardsToClaim({})
      .then(result => {
        console.log("checking this player rewards to claim!");
        console.log(result);
        q("#pending-rewards-total").innerHTML = (result/1000000).toFixed(5)+ " N";
        callback();
    });
  };

  this.getThisPlayerWordCountEligibleForRewards = async function() {
    contract.getThisPlayerWordCountEligibleForRewards({})
      .then(result => {
        console.log("checking this player wrod count eligible for rewards!");
        console.log(result);
      });
  };

  this.initializeAvatarMinting = async function() {
    contract.initializeAvatarMinting({})
      .then(result => {
        console.log("intiialize avatar minting");
        console.log(result);
      });
  };

  this.saveGameResultToChain = async function () {
    try {
      await contract.saveGameResult({
        result: CORRECT_CHARACTER_COUNT + "/" + (CORRECT_CHARACTER_COUNT + WRONG_CHARACTER_COUNT) + "-" + LEVEL + "-" + CURRENT_WPM + "-" + CURRENT_ACCURACY
      })
    } catch (e) {
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    } finally {
      console.log("data saved");
    }
    document.querySelector('#notification').classList.remove("hide");
  };


  this.resetAndProceedToNewSession = function () {
    moving_between_levels = true;
    current_words = [];
    this_word = "";
    this_word_index = 0;
    q("#words").innerHTML = "";
    if (!GAME_LOST) {
      q("#game-start-lost-overlay").classList.remove("hide");
      q("#game-start-lost-overlay").innerHTML = "saving to blockchain, loading level " + game.getLevel();
      that.submitLastLevelPlayed(function(result){
        that.updateLastLevelPlayed(result);
        that.getThisPlayerRewardsToClaim(function(){
            LEVEL++;
            that.init(WORDS, function () {
          });
        });
      })
    }
    game_running = true;
  };

  this.getDetails = function () {
    return {
      "size": size,
      "current_words": current_words,
      "this_word": this_word,
      "this_word_index": this_word_index,
      "correct_count": correct_count,
      "game_running": game_running,
      "level": LEVEL
    }
  };

  this.start = function () {
    document.onkeypress = function (e) {
      e = e || window.event;
      if (!moving_between_levels) {

        if (game_running && !GAME_LOST) {
          that.moveItem(q("#current-avatar-canvas"), ([(that.currentMovingLocation()[0] + (that.currentMovingLocation()[2] - 20)), STATIC_Y_AVATAR_HEIGHT]));
          let current_selected_word = q(".current-word");
          let current_key = e.key;
          current_completed_string.push(current_key);

          if (matchingCharArray(current_completed_string, this_word)) {
            current_selected_word.childNodes[this_word.length - 1].classList.add("current-char");
            that.checkAndSetNextWord();
            current_selected_word.classList.add("correct");
            current_selected_word.classList.add("hide");
            correct_count++;
            q("#rewards-pending").innerHTML = (0.000034 * correct_count).toFixed(5) + " N";
            current_completed_string = [];
          } else {
              for (var char = 0; char < current_completed_string.length; char++) {
                if (current_completed_string[char] == this_word[char]) {
                  current_selected_word.childNodes[char].classList.add("current-char");
                  CORRECT_CHARACTER_COUNT++;
                }
                else {
                  current_selected_word.childNodes[char].classList.add("wrong-char");
                  current_completed_string.pop();
                  WRONG_CHARACTER_COUNT++;
                }
              }
          }
        }
      } else {
        current_completed_string = [];
      }

    };

  };
};


let IS_FETCHING_WORDS = false;
const currentAvatarPallet = {};
let AVATAR = [
  "",
  "",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "",
  "",
  "",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(204, 53, 41)",
  "rgb(72, 161, 248)",
  "",
  "",
  "",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "rgb(72, 161, 248)",
  "",
  "",
  "rgb(225, 216, 148)",
  "rgb(225, 216, 148)",
  "rgb(225, 216, 148)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(225, 216, 148)",
  "rgb(225, 216, 148)",
  "rgb(225, 216, 148)",
  "rgb(225, 216, 148)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(114, 59, 190)",
  "rgb(225, 216, 148)"
];


function startGame() {
  game = new Game();
  game.getWordsList(function () {
    game.getThisPlayerRewardsToClaim(function () { });
    q("#game-container").classList.remove("hide");
    q("#game-start-lost-overlay").innerHTML = "click to start";
    game.checkPayEligibleWordsForToday();
    watchLauncher();
    generateCurrentAvatar();
  });
}

function watchLauncher() {
  q("#game-start-lost-overlay").addEventListener('click', function(){
    if (!IS_FETCHING_WORDS) {
      IS_FETCHING_WORDS = true;
      q("#game-start-lost-overlay").innerHTML = "loading level 1 from smart contract...";
      if (game.isGameOver()) {
        game.resetGameOver();
      } else {
        game.init(WORDS, function () {
          q("#game-start-lost-overlay").classList.add("hide");
          q("#words").classList.remove("hide");
          game.start();
          game.saveGameAndClaimWatcher();
          game.startThisWordWatcher();
          IS_FETCHING_WORDS = false;
        });
      }
    }
  });
};

function generateCurrentAvatar() {
  for (var i = 0 ; i < 64; i++) {
    q("#current-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:'+AVATAR[i]+'"></div>';
  }
};

generateAvatarCanvas();
watchAvatarGenerator();

function generateAvatarCanvas() {
  for (var k = 0; k < 64; k++) {
    q("#avatar-canvas").innerHTML += '<div class="pixel"></div>';
  }
};

function watchAvatarGenerator() {
  currentAvatarPallet.thesePalletChoices = [];

  var randomColor = function() { return Math.floor(Math.random() * 16777215).toString(16); };
  let all_pallets = document.querySelector("#pallet");

  let getThisAvatarPalletSelection = function(incoming) {
    for (var k=0;k<currentAvatarPallet.thesePalletChoices.length;k++) {
      if (incoming == currentAvatarPallet.thesePalletChoices[k]) {
        return currentAvatarPallet.thesePalletChoices[k].dataset.color;
      }
    }
  };

  for (var i = 0; i < all_pallets.children.length; i++) {
    currentAvatarPallet.thesePalletChoices.push(all_pallets.children[i]);
    let new_random_colour = randomColor();
    if (i==0) {
      all_pallets.children[i].style.backgroundColor = "#ffffff";
      all_pallets.children[i].dataset.color = "#ffffff";
    } else if (i==1) {
      all_pallets.children[i].style.backgroundColor = "#000000";
      all_pallets.children[i].dataset.color = "#000000";
    } else {
      all_pallets.children[i].style.backgroundColor = "#"+new_random_colour;
      all_pallets.children[i].dataset.color = "#" + new_random_colour;
    }
    all_pallets.children[i].addEventListener('click', function(event){
      currentAvatarPallet.colorSelection = getThisAvatarPalletSelection(event.target);
      q("#current-color-selection").style.backgroundColor = getThisAvatarPalletSelection(event.target);
    });
  }
  watchPixelsForAvatar();

};

function watchPixelsForAvatar() {
  let avatar_canvas = document.querySelector("#avatar-canvas");
  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
      event.target.style.backgroundColor = currentAvatarPallet.colorSelection;
    });
  }
};


function saveAvatar() {
  let avatar_canvas = q("#avatar-canvas").children;
  for (var i = 0; i < avatar_canvas.length; i++) {
    AVATAR.push(avatar_canvas[i].style.backgroundColor);
  }
};
