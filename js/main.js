const CONTRACT = 'chaintyping.simplegames.near'; // LIVE ON TESTNET 'dev-1629758831278-1504897';
const NEAR_NETWORK_NAME = ".near";

let game;
let AVATAR_INDEXES = [];
let ALL_AVATAR_DATA;
let PIXELS_TO_SUBMIT_FOR_AVATAR = [];
let ALL_AVATARS = [];
let CURRENT_AVATAR_INDEX = "";
let IS_LOCKED = false;
let IS_UPDATING_DESCRIPTION = false;
let SET_SORTING_WATCHERS_ONCE = false;
let CURRENT_PLAYER_INDEX;
let IN_CURRENT_GAME = false;
let DECOMPRESSED_AVATAR_DATA = [];
let DECOMPRESSED_AVATAR_DESCRIPTIONS = [];
let DECOMPRESSED_NEW_HIGHEST_LEVLES = [];
let DECOMPRESSED_CORRECT_WORD_TOTALS = [];
let DECOMPRESSED_IDS = [];
let DECOMPRESSED_ADDRESSES = [];
let CURRENT_AVATAR_TO_SUBMIT_INDEX = ""; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!

let ALL_PLAYERS = "";
let CURRENT_ELIGIBLE_AMOUNT = 0;
const CURRENT_PAY_RATE = 0.00003;
const GAS_TO_ATTACH = 100000000000000;

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
q("#contract-link").innerHTML = CONTRACT;

const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.mainnet.near.org'
});

const { utils } = nearApi

const wallet = new nearApi.WalletConnection(near, 'my-app');

const contract = new nearApi.Contract(wallet.account(), CONTRACT, { //'dev-1628898366672-7385992'
  viewMethods: [
    'getWordsList',
    'getPlayers',
    'getAvatars',
    'getAvatarMintCount'
  ],
  changeMethods: [
    'initContract',
    'setWordList',
    'mintAvatar',
    'getLevelWords',
    'submitLastLevelPlayed',
    //'getLastLevelPlayed',
    'getThisPlayerAddress',
    //'getThisPlayerWordsEligibleForRewards',
    'sendDonations',
    'updateAvatarDescription',
    'moderatorRemoveAvatar',
    'withdrawRewards',
    'importAvatar'
  ]
});

const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  q("#signed-out-flow").classList.remove("hide");
  getPublicAvatars();
} else {

  button.classList.add("hide");
  let faqItems = document.querySelectorAll(".faq-section");
  for (var i = 0; i < faqItems.length; i++) {
    faqItems[i].classList.add("hide");
  }
  displayInnerMenu(false);
  signedInProcess();
}

function displayInnerMenu(isSwitchingFromGame) {
  q("#mural-box").classList.remove("hide");
  q("#sign-out-button-two").classList.remove("hide");
  q("#signed-out-flow").classList.remove("hide");
  q("#account-id").classList.remove("hide");
  q("#faq-button").classList.add("hide");
  q("#get-avatar").classList.remove("hide");
  q("#account-id").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
  q("#contract-link").innerHTML = contract.contractId;
  //q("#pending-rewards-total").classList.remove("hide");

  if (isSwitchingFromGame) {
    q("#signed-out-flow").classList.remove("hide");
    q("#game-container").classList.add("hide");
  }
};


document.getElementById('sign-in-button').addEventListener('click', () => {
  if (wallet.isSignedIn()) {
    signedInProcess();
  } else {
    wallet.requestSignIn({
      contractId: CONTRACT,
      methodNames: [
        'getWordsList',
        'getPlayers',
        'getAvatars',
        'initContract',
        'setWordList',
        'mintAvatar',
        'getWordsList',
        'getLevelWords',
        'submitLastLevelPlayed',
        //'getLastLevelPlayed',
        'getThisPlayerAddress',
        //'getThisPlayerWordsEligibleForRewards',
        'sendDonations',
        'updateAvatarDescription',
        'moderatorRemoveAvatar',
        'getAvatarMintCount',
        'withdrawRewards',
        'importAvatar'
      ]
    });
  }
});

document.getElementById('sign-out-button').addEventListener('click', () => {
  wallet.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
});

document.getElementById('sign-out-button-two').addEventListener('click', () => {
  wallet.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
});

function signedInProcess() {

  getAvatars(function () {
    getPlayers();
    buildMural();
    watchDonationButton();
    if (!IS_LOCKED) {
      q("#game-launcher").classList.remove("hide");
      displayCurrentGameAvatar();
      generateCurrentAvatar();
      watchAvatarSelection();
      q("#update-description").classList.remove("hide");
      updateDescriptionWatcher();
      proceedToGame();
    } else {
      q("#all-account-avatars").innerHTML = '<div class="stats-label pointer green" onclick=\'' + 'q("#get-avatar").click();' + '\' style="border:none;width:100%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;">Please get a chain avatar character to play!</div>';
    }
  });
}

function buildMural() {
  //console.log("Attempting to build mural");
  q("#mural").innerHTML = "";

  for (var i = 0; i < DECOMPRESSED_AVATAR_DATA.length; i++) {
    q("#mural").innerHTML += buildAvatarCanvas(i, false);
  }
  watchMuralSorting();
  rankSorting(".rank-words");
};

function proceedToGame() {
  if (!IS_LOCKED) {
    q("#game-launcher").addEventListener("click", function () {
      q("#signed-out-flow").classList.add("hide");
      q("#choose-avatar").classList.add("hide");
      bootUpGame();
    });
  }
}

function importAvatar(address, data, description, incomingLevel, incomingCorrectWords) {
  var to_save = LZUTF8.compress(data, { outputEncoding: "StorageBinaryString" });
  let description_save = LZUTF8.compress(sanitize(description), { outputEncoding: "StorageBinaryString" });

  contract.importAvatar({ addressForOwner: address, incomingAvatarData: to_save, description: description_save, level: incomingLevel, correctWords: incomingCorrectWords })
    .then(result => {
      //console.log(result);
    });
}

function moderatorRemoveAvatar(username, avatarIndex) {
  contract.moderatorRemoveAvatar({ _username: username, _avatarIndex: avatarIndex })
    .then(result => {
      //console.log(result);
    });
}

function sendDonations(incoming) {
  contract.sendDonations({ _amountInNear: utils.format.parseNearAmount(incoming.toString()) })
    .then(result => {
      //console.log(result);
    });
};
function withdrawRewards() {
  contract.withdrawRewards()
    .then(result => {
      //console.log(result);
    });
}
async function getPublicAvatars() {
  contract.getAvatars({})
    .then(result => {
      //console.log(result);
      ALL_AVATAR_DATA = result;
      decompressAvatarData();
      buildMural();
    });
}
function decompressAvatarData() {
  let data_to_save = [];
  let decompress_descriptions = [];
  let data_highest_levels = [];
  let data_correct_word_totals = [];
  let data_ids = [];
  let data_addresses = [];

  let new_data_output = [];
  let new_desc_output = [];
  let new_highest_levels = [];
  let new_correct_word_totals = [];
  let new_ids = [];
  let new_addresses = [];

  for (var i = 0; i < ALL_AVATAR_DATA.length; i++) {
    for (var j = 0; j < ALL_AVATAR_DATA[i].datas.length; j++) {
      new_data_output.push(LZUTF8.decompress(ALL_AVATAR_DATA[i].datas[j], { inputEncoding: "StorageBinaryString" }));
      new_desc_output.push(LZUTF8.decompress(sanitize(ALL_AVATAR_DATA[i].descriptions[j]), { inputEncoding: "StorageBinaryString" }));
      new_highest_levels.push(ALL_AVATAR_DATA[i].highestLevels[j]);
      new_correct_word_totals.push(ALL_AVATAR_DATA[i].correctWordTotals[j]);
      new_ids.push(ALL_AVATAR_DATA[i].ids[j]);
      new_addresses.push(ALL_AVATAR_DATA[i].address);
    }
  }
  data_to_save = data_to_save.concat(new_data_output);
  decompress_descriptions = decompress_descriptions.concat(new_desc_output);
  data_highest_levels = data_highest_levels.concat(new_highest_levels);
  data_correct_word_totals = data_correct_word_totals.concat(new_correct_word_totals);
  data_ids = data_ids.concat(new_ids);
  data_addresses = data_addresses.concat(new_addresses);

  //console.log(data_to_save);
  //ALL_AVATAR_DATA.avatarData = data_to_save;
  DECOMPRESSED_AVATAR_DATA = data_to_save;
  DECOMPRESSED_AVATAR_DESCRIPTIONS = decompress_descriptions;
  DECOMPRESSED_NEW_HIGHEST_LEVLES = data_highest_levels;
  DECOMPRESSED_CORRECT_WORD_TOTALS = data_correct_word_totals;
  DECOMPRESSED_IDS = data_ids;
  DECOMPRESSED_ADDRESSES = data_addresses;
  //ALL_AVATAR_DATA.descriptions = decompress_descriptions;
};
async function getAvatars(callback) {
  contract.getAvatars({})
    .then(result => {
      //console.log(result);
      //console.log("get avatars!");
      //console.log(result);
      //console.log("all avatars");
      //console.log(result);
      ALL_AVATAR_DATA = result;
      decompressAvatarData();
      let wasFound = false;
      for (var k = 0; k < result.length; k++) {
        //console.log(result);
        if (result[k].address == wallet._authData.accountId) {
          for (var a = 0; a < result[k].ids.length; a++) {
            //console.log("Found a: " + a);
            CURRENT_AVATAR_TO_SUBMIT_INDEX = a; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!
            CURRENT_AVATAR_INDEX = convertAvatarIndexToArrayIndex(result[k].ids[a]);
            AVATAR_INDEXES.push(convertAvatarIndexToArrayIndex(result[k].ids[a]));
            wasFound = true;
          }
        }
      }

      if (wasFound) {
        IS_LOCKED = false;
        callback();
      } else {
        IS_LOCKED = true;
        callback();
      }
    });
};

function convertDecompressedIndexToUsersArrayIndex(CURRENT_AVATAR_INDEX) {
  let findThisAvatarsBackendId = "";
  for (var i = 0; i < DECOMPRESSED_IDS.length; i++) {
    if (CURRENT_AVATAR_INDEX == i) {
      findThisAvatarsBackendId = DECOMPRESSED_IDS[i];
    }
  }

  for (var j = 0; j < ALL_AVATAR_DATA.length; j++) {
    if (ALL_AVATAR_DATA[j].address == wallet._authData.accountId) {
      for (var s = 0; s < ALL_AVATAR_DATA[j].ids.length; s++) {
        if (findThisAvatarsBackendId == ALL_AVATAR_DATA[j].ids[s]) {
          return s;
        }
      }
    }
  }
}

function convertAvatarIndexToArrayIndex(thisIdOfAvatar) {
  for (var i = 0; i < DECOMPRESSED_IDS.length; i++) {
    if (thisIdOfAvatar == DECOMPRESSED_IDS[i]) {
      return i;
    }
  }
  return -1;
};


function updateLastLevelPlayed(result, isCurrentPlayer) {

  //q("#levels-played").innerHTML = result.previousLevelCompleted;
  if (isCurrentPlayer) {
    q("#last_level").innerHTML = result[CURRENT_PLAYER_INDEX].previousLevelCompleted;
    q("#last_wpm").innerHTML = result[CURRENT_PLAYER_INDEX].previousWpm;
    q("#last_accuracy").innerHTML = result[CURRENT_PLAYER_INDEX].previousAccuracy;

  } else {
    q("#last_level").innerHTML = result.previousLevelCompleted;
    q("#last_wpm").innerHTML = result.previousWpm;
    q("#last_accuracy").innerHTML = result.previousAccuracy;
  }
};
async function getPlayers() {
  contract.getPlayers({})
    .then(result => {
      //console.log(result);
      let wasFound = false;
      //console.log(result);
      ALL_PLAYERS = result;
      //console.log("palyers");
      for (var k = 0; k < result.length; k++) {
        if (result[k].address == wallet._authData.accountId) {
          //console.log("Found k: " + k);
          CURRENT_PLAYER_INDEX = k;
          wasFound = true;
        }
      }

      if (wasFound) {
        //q("#last_level").innerHTML = result[CURRENT_PLAYER_INDEX].previousLevelCompleted;
        updateLastLevelPlayed(result, true);
        /*CURRENT_ELIGIBLE_AMOUNT = (ALL_PLAYERS[CURRENT_PLAYER_INDEX].wordCountEligibleForRewards * CURRENT_PAY_RATE);
        q("#pending-rewards-total").innerHTML = "+" + CURRENT_ELIGIBLE_AMOUNT.toFixed(5) + " N";
        q("#earned-amount-total").innerHTML = "+" + CURRENT_ELIGIBLE_AMOUNT.toFixed(5) + " N";*/
      }
      //console.log("get players!");
      //console.log(result);
    });
};
async function getAvatarMintCount() {
  contract.getAvatarMintCount({})
    .then(result => {
      console.log(result);
    });
}

function bootUpGame() {
  q("#game-container").classList.remove("hide");
  q("#mural-box").classList.add("hide");
  q("#my-account-data").classList.add("hide");
  let signed_in_flows = document.querySelectorAll(".signed-in-flow");
  for (var siflow = 0; siflow < signed_in_flows.length; siflow++) {
    signed_in_flows[siflow].classList.remove("hide");
  }
  startGame();
};

function Game() {
  let size = 5;
  let current_words = [];
  let this_word = "";
  let this_word_index = 0;
  let CORRECT_COUNT = 0;
  let WRONG_COUNT = 0;
  let that = this;
  let game_running = true;
  let timer_paused = false;
  let total_elapsed_seconds = 0;
  let WORDS_TO_USE;
  let timerVar = undefined;
  let LEVEL = 1;
  let CURRENT_WPM = 0;
  let CURRENT_ACCURACY = 0;
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

  this.isGameOver = function () {
    return GAME_LOST;
  };

  this.resetGameOver = function () {
    GAME_LOST = false;
    current_completed_string = [];
    WRONG_CHARACTER_COUNT = 0;
    CORRECT_CHARACTER_COUNT = 0;
    CURRENT_ACCURACY = 0;
    CURRENT_WPM = 0;
    LEVEL = 1;
    CORRECT_COUNT = 0;
    WRONG_COUNT = 0;
    that.resetTimer();
    current_words = [];
    this_word = "";
    this_word_index = 0;
    q("#words").innerHTML = "";

    that.init(WORDS, function () {
      that.timer();
      game_running = true;
      q("#game-start-lost-overlay").classList.add("hide");
      q("#notification").classList.add("hide");
      q("#words").classList.remove("hide");
      game.start();
      game.saveGameAndClaimWatcher();
      game.startThisWordWatcher();
      IS_FETCHING_WORDS = false;
    });

    //that.resetAndProceedToNewSession();
  };
  this.getLevel = function () {
    return LEVEL;
  }

  this.init = function (words, callback) {
    WORDS_TO_USE = words;
    q("#notification").innerHTML = "Get ready..."
    that.getLevelWords(function () {
      q("#game-start-lost-overlay").classList.add("hide");
      q("#notification").classList.add("hide");
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      if (width < 500) { WIDTH_FOR_ITEMS = 250; }

      if (LEVEL == 1) { size = 5; }
      else if (LEVEL == 2) { size = 7; }
      else if (LEVEL == 3) { size = 10; }
      else if (LEVEL == 4) { size = 15; }
      else if (LEVEL == 5) { size = 20; }
      else if (LEVEL >= 6) { size = 25; }

      q("#level").innerHTML = (LEVEL >= 12 ? "expert" : LEVEL);
      //CUMULATIVE_SIZE += CORRECT_COUNT;

      let builder = "";
      for (var x = 0; x < THIS_LEVEL_WORD_INDEXES.length; x++) {
        let random_word = WORDS.english[THIS_LEVEL_WORD_INDEXES[x]]; // WORDS_TO_USE.english[Math.floor(Math.random() * (WORDS_TO_USE.english.length - 1))];
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
  this.pauseTimer = function () {
    CURRENT_WPM = ((CORRECT_COUNT + WRONG_COUNT) / (total_elapsed_seconds / 60)).toFixed(2);
    CURRENT_ACCURACY = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0);

    timer_paused = true;
    clearInterval(timerVar);
    timerVar = undefined;
  };

  this.resetTimer = function () {
    timer_paused = false;
    total_elapsed_seconds = 0;
    clearInterval(timerVar);
    timerVar = undefined;
  }

  this.moveItem = function (element, x_y_array) {
    element.style.left = x_y_array[0] + "px";
    element.style.top = x_y_array[1] + "px";
  }
  this.currentAvatarPosition = function () {
    let element = q("#current-avatar-canvas");
    var position = element.getBoundingClientRect();
    var x = position.left;
    var y = position.top;
    return [x, y];
  };

  this.currentMovingLocation = function () {
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
  this.sendLaser = function () {
    let new_circle = document.createElement("div");
    new_circle.id = "laser" + LASER_COUNT;
    new_circle.classList.add("circle");
    q("#typing-game").append(new_circle);
    LASER_COUNT++;

    let current_selected_word = q("#words");
    var current_moving_word = current_selected_word.childNodes[this_word_index];
    that.moveItem(new_circle, ([(current_moving_word.offsetLeft + that.currentMovingLocation()[2]), Y_MAX_HEIGHT]));
  };

  this.timer = function () {
    var minutesLabel = document.getElementById("minutes");
    var secondsLabel = document.getElementById("seconds");
    timerVar = setInterval(setTime, 1000);

    function setTime() {
      if (!timer_paused) {
        total_elapsed_seconds++;
        secondsLabel.innerHTML = pad(total_elapsed_seconds % 60);
        minutesLabel.innerHTML = pad(parseInt(total_elapsed_seconds / 60));
        if (this_word_index == 0) { }
        else {
          q("#wpm").innerHTML = ((CORRECT_COUNT + WRONG_COUNT) / (total_elapsed_seconds / 60)).toFixed(0);
          CURRENT_WPM = ((CORRECT_COUNT + WRONG_COUNT) / (total_elapsed_seconds / 60)).toFixed(2);
          q("#accuracy").innerHTML = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0) + "%";
          CURRENT_ACCURACY = ((CORRECT_CHARACTER_COUNT / (WRONG_CHARACTER_COUNT + CORRECT_CHARACTER_COUNT)) * 100).toFixed(0);
          that.unhideStats();
        }
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
  }
  this.unhideStats = function () {
    //q("#levels-played").parentElement.classList.remove("hide");
    q("#level").parentElement.classList.remove("hide");
    q("#wpm").parentElement.classList.remove("hide");
    q("#accuracy").parentElement.classList.remove("hide");
  };
  this.setAnimationByLevel = function () {
    let current_selected_word = q("#words");
    if (LEVEL == 1) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 8s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 8;
    } else if (LEVEL == 2) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 7s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 7;
    } else if (LEVEL == 3) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 6s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 6;
    } else if (LEVEL == 4) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 5;
    } else if (LEVEL == 5) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 4.5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 4.5;
    } else if (LEVEL == 6) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 4s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 4;
    } else if (LEVEL == 7) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 3.5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 3.5;
    } else if (LEVEL == 8) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 3s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 3;
    } else if (LEVEL == 9) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 2.5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 2.5;
    } else if (LEVEL == 10) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 2s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 2;
    } else if (LEVEL == 11) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 1.5s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 1.5;
    } else if (LEVEL >= 12) {
      current_selected_word.childNodes[this_word_index].style.animation = "MoveUpDown 1s linear infinite";
      current_selected_word.childNodes[this_word_index].style.animationDirection = "reverse";
      CURRENT_VELOCITY = 1;
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
      //console.log("Tried to get init from here");
      current_selected_word.childNodes[this_word_index].classList.remove("current-word");
      that.resetAndProceedToNewSession();

    }
  };
  this.startThisWordWatcher = function () {
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
  }

  this.endGame = function () {
    that.pauseTimer();
    GAME_LOST = true;
    game_running = false;
    q("#game-start-lost-overlay").classList.remove("hide");
    q("#notification").classList.remove("hide");
    q("#notification").innerHTML = 'Game over...';
    q("#words").classList.add("hide");
    q("#words").childNodes[this_word_index].classList.add("hide");
    // that.submitLastLevelPlayed(function (result) {
    q("#notification").innerHTML = "Click to start a new game";
    //that.updateLastLevelPlayed(result);
    // });
    IN_CURRENT_GAME = false;
  };

  this.saveGameAndClaimWatcher = function () {
    /* q("#save-game-results-and-claim").addEventListener('click', function () {
       //console.log("Save");
       that.saveGameResultToChain();
     });*/
  }
  this.submitLastLevelPlayed = async function (callback) {
    //console.log("Submitting correct count: " + CORRECT_COUNT);
    //console.log("Submitting these words");
    //console.log(THIS_LEVEL_WORD_INDEXES);

    // MUST SUBMIT THE AVATAR INDEX OF THIS PARTICULAR USER IN THIER ARRAY.

    contract.submitLastLevelPlayed({
      level: parseInt(LEVEL), wpm: parseInt(CURRENT_WPM), accuracy: parseInt(CURRENT_ACCURACY), wordsToSubmit: THIS_LEVEL_WORD_INDEXES
      , correctCount: CORRECT_COUNT, _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX)
    })
      .then(result => {
        //console.log("last level saved");
        //console.log(result);
        //console.log(result);
        DECOMPRESSED_CORRECT_WORD_TOTALS[CURRENT_AVATAR_INDEX] = parseInt(DECOMPRESSED_CORRECT_WORD_TOTALS[CURRENT_AVATAR_INDEX]) + parseInt(CORRECT_COUNT);
        if (parseInt(LEVEL) > DECOMPRESSED_NEW_HIGHEST_LEVLES[CURRENT_AVATAR_INDEX]) {
          DECOMPRESSED_NEW_HIGHEST_LEVLES[CURRENT_AVATAR_INDEX] = parseInt(LEVEL);
        }
        //CURRENT_ELIGIBLE_AMOUNT += (CORRECT_COUNT * CURRENT_PAY_RATE);

        buildMural();
        callback(result);
      });
  };

  this.getLevelWords = async function (callback) {
    contract.getLevelWords({ level: LEVEL })
      .then(result => {
        // console.log("level words");
        //console.log(result);
        //console.log("word chain received!");
        //console.log(result);
        THIS_LEVEL_WORD_INDEXES = result;
        //console.log(THIS_LEVEL_WORD_INDEXES);
        callback()
      });
  };

  this.getLastLevelPlayed = async function () {
    contract.getLastLevelPlayed({})
      .then(result => {
        //console.log("last level played is:");
        //console.log(result);
      });
  };

  this.getWordsList = async function (callback) {
    //console.log("get words list again");
    GOT_WORDS_LIST_ONCE = true;
    contract.getWordsList({})
      .then(result => {
        //console.log("word list ipfs received");
        //console.log(result);
        fetch('https://ipfs.io/ipfs/' + result)
          .then(function (response) {
            // The response is a Response instance.
            // You parse the data into a useable format using `.json()`
            return response.json();
          }).then(function (data) {
            // `data` is the parsed version of the JSON returned from the above endpoint.
            //console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
            WORDS = data;
            callback();
          });
      });
  };

  /*  this.setWordList = async function (incomingWordsIpfsLocation) {
      contract.setWordList({ wordsIpfsLocation: "QmWWqSuE8mH9jXgvPuKPQXJCsNqbj7Dtn2p3Lw8TeqCG1i" })
        .then(result => {
          //console.log("word list ipfs location saved to contract!");
          //console.log(result);
        });
    };*/
  /*this.checkPayEligibleWordsForToday = async function() {
    contract.checkPayEligibleWordsForToday({ })
      .then(result => {
        //console.log("checking eligible words for today!");
        let eligible_words_for_today = document.querySelectorAll(".eligible-words-for-today");
        for (var i = 0; i < eligible_words_for_today.length; i++) {
          eligible_words_for_today[i].innerHTML = result;
        }
    });
  };*/

  this.fullInitialize = async function () {

    //that.setWordList();
    //that.initializePlayers();
    // that.initializeAvatarMinting();
  };

  this.initContract = async function () {
    contract.initContract({ wordsList: "QmWWqSuE8mH9jXgvPuKPQXJCsNqbj7Dtn2p3Lw8TeqCG1i", mintCount: 0 })
      .then(result => {
        //console.log("initialize players!");
        //console.log(result);
        //console.log(result);
      });
  };


  this.getAndSetCurrentEligibleWordsForToday = async function () {
    contract.getAndSetCurrentEligibleWordsForToday({})
      .then(result => {
        //console.log("returning eligible words!");
        //console.log(result);
        let eligible_words_for_today = document.querySelectorAll(".eligible-words-for-today");
        for (var i = 0; i < eligible_words_for_today.length; i++) {
          eligible_words_for_today[i].innerHTML = result;
        }
      });
  };
  this.getThisPlayerAddress = async function () {
    contract.getThisPlayerAddress({})
      .then(result => {
        //console.log("checking this player address!");
        //console.log(result);
      });
  };
  /*this.getThisPlayerRewardsToClaim = async function (callback) {
    contract.getThisPlayerRewardsToClaim({})
      .then(result => {
        //console.log("checking this player rewards to claim!");
        //console.log(result);
        q("#pending-rewards-total").innerHTML = (result/1000000).toFixed(5)+ " N";
        callback();
    });
  };*/

  /*this.getThisPlayerWordCountEligibleForRewards = async function () {
    contract.getThisPlayerWordCountEligibleForRewards({})
      .then(result => {
        //console.log("checking this player wrod count eligible for rewards!");
        //console.log(result);
      });
  };

  this.initializeAvatarMinting = async function () {
    contract.initializeAvatarMinting({})
      .then(result => {
        //console.log("intiialize avatar minting");
        //console.log(result);
      });
  };*/

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
      // re-enable the form, whether the call succeeded or failed
      //that.resetAndProceedToNewSession();
      //console.log("data saved");
    }

    //await fetchGameResult()

    document.querySelector('#notification').classList.remove("hide");

    /* setTimeout(() => {
       document.querySelector('[data-behavior=notification]').style.display = 'none'
     }, 6000);*/
  };


  this.resetAndProceedToNewSession = function () {
    that.pauseTimer();
    moving_between_levels = true;
    current_words = [];
    this_word = "";
    this_word_index = 0;
    //CORRECT_COUNT = 0;
    q("#words").innerHTML = "";
    if (!GAME_LOST) {
      q("#game-start-lost-overlay").classList.remove("hide");
      q("#notification").classList.remove("hide");
      q("#notification").innerHTML = "Saving to blockchain, loading level " + (game.getLevel() + 1) + "...";
      that.submitLastLevelPlayed(function (result) {
        //console.log("last level played submit");
        //console.log(result);
        updateLastLevelPlayed(result, false);
        //that.getThisPlayerRewardsToClaim(function(){
        // that.getAndSetCurrentEligibleWordsForToday();
        LEVEL++;
        that.init(WORDS, function () {
          timer_paused = false;
          that.timer();
        });
        //});
      });
    }
    game_running = true;
  };


  this.getDetails = function () {
    return {
      "size": size,
      "current_words": current_words,
      "this_word": this_word,
      "this_word_index": this_word_index,
      "CORRECT_COUNT": CORRECT_COUNT,
      "game_running": game_running,
      "level": LEVEL
    }
  };

  this.start = function () {
    document.onkeypress = function (e) {
      e = e || window.event;
      if (!moving_between_levels) {

        //current avatar is 20px wide,
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
            CORRECT_COUNT++;
            let clear_sound = new Audio('audio/clear.mp3');
            clear_sound.play();
            //CURRENT_ELIGIBLE_AMOUNT += CURRENT_PAY_RATE;
            //q("#pending-rewards-total").classList.remove("hide");
            //q("#pending-rewards-total").innerHTML = "+" + CURRENT_ELIGIBLE_AMOUNT.toFixed(5) + " N";
            //q("#earned-amount-total").innerHTML = "+" + CURRENT_ELIGIBLE_AMOUNT.toFixed(5) + " N";
            current_completed_string = [];
          } else {
            for (var char = 0; char < current_completed_string.length; char++) {
              if (current_completed_string[char] == this_word[char]) {
                current_selected_word.childNodes[char].classList.add("current-char");
                CORRECT_CHARACTER_COUNT++;
                //that.sendLaser();
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

}
let IS_FETCHING_WORDS = false;
const currentAvatarPallet = {};

const hextable = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function arrToHex(arr) {
  let s = '#';
  for (let i = 0; i < arr.length; i++) {
    s += hextable[(arr[i] / 16) | 0];
    s += hextable[arr[i] % 16 | 0];
  }
  return s;
};

function convertToHex(array) {
  var a = "rgb(255,255,255)".split("(")[1].split(")")[0];
  let newArray = [];
  for (var i = 0; i < array.length; i++) {
    let a = "";
    if (array[i] == "") {
      a = "";
      newArray.push(a);
    } else {
      a = array[i].split("(")[1].split(")")[0];
      a = a.split(",");
      var b = a.map(function (x) {             //For each array element
        x = parseInt(x).toString(16);      //Convert to a base16 string
        return (x.length == 1) ? "0" + x : x;  //Add zero if we get only one character
      })
      b = "0x" + b.join("");
      newArray.push(b);
    }
  }
  return newArray;
};

let DISPLAY_AVATAR = [
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
  game.saveGameAndClaimWatcher();
  game.getWordsList(function () {
    //game.getThisPlayerRewardsToClaim(function () { });
    q("#game-container").classList.remove("hide");
    q("#notification").innerHTML = "Click to start";
    //game.getAndSetCurrentEligibleWordsForToday();
    watchLauncher();

  });
}

function watchLauncher() {
  q("#game-start-lost-overlay").addEventListener('click', function () {
    if (!IS_FETCHING_WORDS && !IN_CURRENT_GAME) {
      IS_FETCHING_WORDS = true;
      IN_CURRENT_GAME = true;
      q("#notification").innerHTML = "Loading level 1 from smart contract...";
      if (game.isGameOver()) {
        game.resetGameOver();
      } else {
        game.init(WORDS, function () {
          q("#game-start-lost-overlay").classList.add("hide");
          q("#notification").classList.add("hide");
          q("#words").classList.remove("hide");
          game.start();
          game.startThisWordWatcher();
          IS_FETCHING_WORDS = false;
        });
      }
    }
  });
};
function displayCurrentGameAvatar() {
  let splitAvatarData = DECOMPRESSED_AVATAR_DATA[CURRENT_AVATAR_INDEX].split(",");
  for (var s = 0; s < splitAvatarData.length; s++) {
    if (splitAvatarData[s] == "") { }
    else {
      splitAvatarData[s] = "#" + splitAvatarData[s].split("0x")[1];
    }
  }
  for (var i = 0; i < 64; i++) {
    q("#current-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    q("#display-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    //q("#account-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + AVATAR[i] + '"></div>';
  }
};

function generateCurrentAvatar() {
  q("#all-account-avatars").innerHTML = "";

  for (var j = 0; j < AVATAR_INDEXES.length; j++) {
    //console.log("shipping: " + AVATAR_INDEXES[j]);
    //for (var check = 0; check < DECOMPRESSED_IDS.length; check++){
    let is_selected_index = CURRENT_AVATAR_INDEX == AVATAR_INDEXES[j];
    //if (AVATAR_INDEXES[j] == DECOMPRESSED_IDS[check]) {
    q("#all-account-avatars").innerHTML += buildAvatarCanvas(AVATAR_INDEXES[j], is_selected_index);
    //}
    //}
  }
  if (AVATAR_INDEXES.length > 0) {
    q("#update-avatar-description").classList.remove("hide");
  }
};
function watchAvatarSelection() {
  let all_avatars = document.querySelectorAll("#all-account-avatars .account-avatar-canvas");
  for (var k = 0; k < all_avatars.length; k++) {
    all_avatars[k].addEventListener("click", function (e) {
      if (e.target.parentElement.classList.contains("account-avatar-canvas")) {
        for (var p = 0; p < all_avatars.length; p++) {
          all_avatars[p].classList.remove("selected-avatar");
        }
        e.target.parentElement.classList.add("selected-avatar");
        q("#update-avatar-description").value = e.target.innerHTML;
        CURRENT_AVATAR_INDEX = e.target.parentElement.dataset.index; // EXTRACTED INDEXES FOR THE FRONTEND!

        CURRENT_AVATAR_TO_SUBMIT_INDEX = convertDecompressedIndexToUsersArrayIndex(CURRENT_AVATAR_INDEX);

        q("#current-avatar-canvas").innerHTML = "";
        setTimeout(function () {
          displayCurrentGameAvatar();
        }, 1);
      }
    });
  }
};

function buildAvatarCanvas(index, is_selected_index) {
  let splitAvatarData = DECOMPRESSED_AVATAR_DATA[index].split(",");
  for (var s = 0; s < splitAvatarData.length; s++) {
    if (splitAvatarData[s] == "") { }
    else {
      splitAvatarData[s] = "#" + splitAvatarData[s].split("0x")[1];
    }
  }
  let builder = '<div data-index="' + index + '" class="account-avatar-canvas ' + (is_selected_index ? "selected-avatar" : "") + '"><div class="avatar-account-box">';
  for (var i = 0; i < 64; i++) {
    builder += '<div class="md-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
  }
  builder += '</div><div class="avatar-box"><span class="rank-levels">' + DECOMPRESSED_NEW_HIGHEST_LEVLES[index] + '.</span><span class="rank-words">' + DECOMPRESSED_CORRECT_WORD_TOTALS[index] + '</span><span class="mint-ids">' + DECOMPRESSED_IDS[index] + '</span><div class="truncate">' + DECOMPRESSED_ADDRESSES[index].split(NEAR_NETWORK_NAME)[0] + '</div></div>';

  builder += '<div class="descriptions">' + DECOMPRESSED_AVATAR_DESCRIPTIONS[index] + '</div>';
  builder += '</div>';

  return builder;
}

function generateDisplayAvatar() {
  for (var i = 0; i < 64; i++) {
    q("#display-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + DISPLAY_AVATAR[i] + '"></div>';

  }
};

generateDisplayAvatar();
generateAvatarCanvas();
watchAvatarGenerator();
function generateAvatarCanvas() {
  for (var k = 0; k < 64; k++) {
    q("#avatar-canvas").innerHTML += '<div class="pixel"></div>';
  }
};
function watchAvatarGenerator() {
  currentAvatarPallet.thesePalletChoices = [];

  var randomColor = function () { return Math.floor(Math.random() * 16777215).toString(16); };
  let all_pallets = document.querySelector("#pallet");

  let getThisAvatarPalletSelection = function (incoming) {
    for (var k = 0; k < currentAvatarPallet.thesePalletChoices.length; k++) {
      if (incoming == currentAvatarPallet.thesePalletChoices[k]) {
        return currentAvatarPallet.thesePalletChoices[k].dataset.color;
      }
    }
  }

  for (var i = 0; i < all_pallets.children.length; i++) {
    currentAvatarPallet.thesePalletChoices.push(all_pallets.children[i]);
    let new_random_colour = randomColor();
    if (i == 0) {
      all_pallets.children[i].style.backgroundColor = "#ffffff";
      all_pallets.children[i].dataset.color = "#ffffff";
    } else if (i == 1) {
      all_pallets.children[i].style.backgroundColor = "#000000";
      all_pallets.children[i].dataset.color = "#000000";
    } else {
      all_pallets.children[i].style.backgroundColor = "#" + new_random_colour;
      all_pallets.children[i].dataset.color = "#" + new_random_colour;
    }
    all_pallets.children[i].addEventListener('click', function (event) {
      currentAvatarPallet.colorSelection = getThisAvatarPalletSelection(event.target);
      q("#current-color-selection").style.backgroundColor = getThisAvatarPalletSelection(event.target);
    });
  }
  watchPixelsForAvatar();

}

function watchPixelsForAvatar() {
  let avatar_canvas = document.querySelector("#avatar-canvas");
  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
      event.target.style.backgroundColor = currentAvatarPallet.colorSelection;
    });
  }
};

function watchDonationButton() {
  q("#mint-character-button").addEventListener("click", function () {
    //console.log("clicked");
    let avatar_canvas = document.querySelector("#avatar-canvas");
    let newArray = [];
    for (var i = 0; i < avatar_canvas.children.length; i++) {
      newArray.push(avatar_canvas.children[i].style.backgroundColor);
    }
    PIXELS_TO_SUBMIT_FOR_AVATAR = newArray;
    //console.log(PIXELS_TO_SUBMIT_FOR_AVATAR);
    mintAvatar();
  });


};

async function mintAvatar() {
  let pixels_to_hex = convertToHex(PIXELS_TO_SUBMIT_FOR_AVATAR).toString();
  var to_save_data = LZUTF8.compress(pixels_to_hex, { outputEncoding: "StorageBinaryString" });
  let description_save = LZUTF8.compress(sanitize(q("#new-avatar-description").value), { outputEncoding: "StorageBinaryString" });
  let result = await contract.mintAvatar({ incomingAvatarData: to_save_data.toString(), description: description_save.toString() }, GAS_TO_ATTACH, utils.format.parseNearAmount("3"));
  //console.log(result);
};

function saveAvatar() {
  let avatar_canvas = q("#avatar-canvas").children;
  for (var i = 0; i < avatar_canvas.length; i++) {
    AVATAR.push(avatar_canvas[i].style.backgroundColor);
  }
}
function watchMuralSorting() {
  if (!SET_SORTING_WATCHERS_ONCE) {
    SET_SORTING_WATCHERS_ONCE = true;
    q("#rank-sort").addEventListener("click", function () {
      rankSorting(".rank-levels");
    });
    q("#words-sort").addEventListener("click", function () {
      rankSorting(".rank-words");
    });
    q("#mint-ids-sort").addEventListener("click", function () {
      //console.log("click");
      rankSorting(".mint-ids");
    });
  }
};

function rankSorting(sort_by) {

  let sortingCategories = ["mural"];

  //for (var k = 0; k < sortingCategories.length; k++) {
  var toSort = q("#mural").children;
  //console.log(toSort);
  toSort = Array.prototype.slice.call(toSort, 0);
  toSort.sort(function (a, b) {
    var a_current_percents = a.querySelector(sort_by);
    var b_current_percents = b.querySelector(sort_by);
    //console.log(a_current_percents);
    var aord = a_current_percents.innerHTML;
    var bord = b_current_percents.innerHTML;
    if (sort_by == ".mint-ids") {
      return aord - bord;
    } else {
      return bord - aord;
    }
  });

  var parent = q("#mural");
  parent.innerHTML = "";
  //console.log("Cleared");
  for (var i = 0, l = toSort.length; i < l; i++) {
    parent.appendChild(toSort[i]);
  }
  //}
}
function sanitize(string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match) => (map[match]));
}

function updateDescriptionWatcher() {

  q("#update-description").addEventListener("click", function () {
    if (!IS_UPDATING_DESCRIPTION) {
      q("#update-description").innerHTML = "updating...";
      IS_UPDATING_DESCRIPTION = true;
      let new_description_save = LZUTF8.compress(sanitize(q("#update-avatar-description").value), { outputEncoding: "StorageBinaryString" });

      contract.updateAvatarDescription({ _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX), _description: new_description_save })
        .then(result => {

          q("#update-description").innerHTML = "updated";

          DECOMPRESSED_AVATAR_DESCRIPTIONS[CURRENT_AVATAR_INDEX] = sanitize(q("#update-avatar-description").value);
          //NEED TO FIX

          //ALL_AVATAR_DATA.descriptions[CURRENT_AVATAR_INDEX] = new_description_save;
          setTimeout(function () {
            q("#update-description").innerHTML = "Update description";
            IS_UPDATING_DESCRIPTION = false;
            buildMural();
            generateCurrentAvatar();
            watchAvatarSelection();
          }, 100);
          //console.log(result);
        });
    }
  });
}