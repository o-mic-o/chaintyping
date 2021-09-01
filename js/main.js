const CONTRACT = 'dev-1630283610608-7480166'; // LIVE ON TESTNET 'dev-1629758831278-1504897';
const NEAR_NETWORK_NAME = ".testnet";
const XGC_CONTRACT = "testing12345.testnet";

let game;
const XGC_DECIMALS = 1000;

let AVATAR_INDEXES = [];
let ORIGINAL_AVATAR_DATA;
let PIXELS_TO_SUBMIT_FOR_AVATAR = [];
let ALL_AVATARS = [];
let CURRENT_AVATAR_ID = "";
let IS_LOCKED = false;
let IS_UPDATING_DESCRIPTION = false;
let SET_SORTING_WATCHERS_ONCE = false;
let CURRENT_PLAYER_INDEX;
let IN_CURRENT_GAME = false;
let XGC_DECIMAL_PLACES = 2;
let CURRENT_AVATAR_TO_SUBMIT_INDEX = ""; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!
let ALL_MARKET_DATA = "";
let IS_UPDATING_ORDER = false;
let IS_BUYING_PROGRESS = false;

let ALL_PLAYERS = "";
let CURRENT_ELIGIBLE_AMOUNT = 0;
let CURRENT_PAY_RATE = "";
const GAS_TO_ATTACH = 70000000000000;
let GAME_REWARDS_STATE_IN_NEAR = "";
let IS_WITHDRAWING = false;
let IS_DISPLAYING_PAYRATE = false;
let WITHDRAWAL_BUTTON_PROCESSING = false;
let TIMEOUT_PROCESSING_WORDS_DELAY = 3000;
let SET_MARKET_SORT_WATCHERS_ONCE = false;
let HASH_ID = "";
let ACTION_FEE = 1000;

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
q("#contract-link-market").innerHTML = CONTRACT;

const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org'
});

const { utils } = nearApi

const wallet = new nearApi.WalletConnection(near, 'my-app');

const contract = new nearApi.Contract(wallet.account(), CONTRACT, { //'dev-1628898366672-7385992'
  viewMethods: [
    'getWordsList',
    'getPlayers',
    'getAvatars',
    'getOrders',
    'getAvatarMintCount',
    'getGameRewardsState',
  ],
  changeMethods: [
    'initContract',
    'initPlayerRewards',

    'getLevelWords',

    'setWordList',
    'mintAvatar',
    'updateLevel',
    'submitLastLevelPlayed',
    'getThisPlayerAddress',
    'sendDonations',
    'updateAvatarDescription',
    'moderatorRemoveAvatar',
    'moderatorRemoveListing',
    'importAvatar',

    'setForSale',
    'updateForSale',
    'buySomeAvatar',
    'removeListing',

    'modifyRewardStates',
    'depositForRewards',
    'withdrawRewards',
    'setPayRate',
    'setRoyalty',
    'checkXGCBalance',
    'checkThisContractBalanceXGC',
    'resetRewardState',
    'setAvatarPrice',
    'reduceEligibleRewards'
  ]
});

const xgcContract = new nearApi.Contract(wallet.account(), XGC_CONTRACT, { //'dev-1628898366672-7385992'
  viewMethods: [
    'ft_total_supply',
    'ft_metadata',
    'ft_balance_of'
  ],
  changeMethods: [
  ]
});

const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  q("#signed-out-flow").classList.remove("hide");
  getGameRewardsState();
  getPublicAvatars(function () {
    getPublicOrders();
  });

  getXGCTotalSupply();

} else {

  button.classList.add("hide");
  let faqItems = document.querySelectorAll(".faq-section");
  for (var i = 0; i < faqItems.length; i++) {
    faqItems[i].classList.add("hide");
  }
  displayInnerMenu(false);
  getGameRewardsState();
  signedInProcess();

  getXGCTotalSupply();
  getXGCMyBalance();
  getXGCGameBalance();
}


if (window.location.hash != "") {
  HASH_ID = window.location.hash.split("#/")[1];
}

function hashMapper() {
  if (HASH_ID == "account") {
    console.log("Account hash!");
    setTimeout(function () {
      q("#account-id").click();
    }, 1);
  } else if (HASH_ID == "mural") {
    setTimeout(function () {
      q("#mural-button").click();
    }, 1);
  } else if (HASH_ID == "market") {
    setTimeout(function () {
      q("#market-button").click();
    }, 1);
  } else if (HASH_ID == "mint") {
    setTimeout(function () {
      q("#get-avatar").click();
    }, 1);
  } else if (HASH_ID == "xgc") {
    setTimeout(function () {
      q("#xgc-stats-button").click();
    }, 1);
  }
}
hashMapper();

function displayInnerMenu(isSwitchingFromGame) {
  q("#mural-box").classList.remove("hide");
  q("#sign-out-button-two").classList.remove("hide");
  q("#signed-out-flow").classList.remove("hide");
  q("#account-id").classList.remove("hide");
  q("#faq-button").classList.add("hide");
  q("#get-avatar").classList.remove("hide");
  q("#account-id").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
  q("#contract-link").innerHTML = contract.contractId;
  q("#pending-rewards-total").classList.remove("hide");

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
        'initPlayerRewards',
        'setWordList',
        'mintAvatar',
        'getWordsList',
        'getLevelWords',
        'updateLevel',
        'submitLastLevelPlayed',
        'getThisPlayerAddress',
        'sendDonations',
        'updateAvatarDescription',
        'moderatorRemoveAvatar',
        'moderatorRemoveListing',
        'getAvatarMintCount',
        'importAvatar',

        'getOrders',
        'setForSale',
        'updateForSale',
        'buySomeAvatar',
        'removeListing',
        'modifyRewardStates',

        'getGameRewardsState',
        'depositForRewards',
        'withdrawRewards',
        'setPayRate',
        'setRoyalty',
        'checkXGCBalance',
        'checkThisContractBalanceXGC',
        'resetRewardState',
        'setAvatarPrice',
        'reduceEligibleRewards'
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
    getPublicOrders();
    getPlayers();
    buildMural();
    watchDonationButton();
    withdrawalWatcher();
    availableRewardsWatcher();
    if (!IS_LOCKED) {
      q("#game-launcher").classList.remove("hide");
      displayCurrentGameAvatar();
      generateCurrentAvatar();
      watchAvatarSelection();
      q("#update-description").classList.remove("hide");
      q("#update-market-price-input").classList.remove("hide");
      q("#update-market-price").classList.remove("hide");
      updateDescriptionWatcher();
      setAskingPriceWatcher();
      removeListingWatcher();
      proceedToGame();
    } else {
      q("#all-account-avatars").innerHTML = '<div class="stats-label pointer green" onclick=\'' + 'q("#get-avatar").click();' + '\' style="border:none;width:100%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;">Please get a chain avatar character to play!</div>';
      q("#update-description").classList.add("hide");
      q("#update-market-price-input").classList.add("hide");
      q("#update-market-price").classList.add("hide");
    }
  });
}

function buildMural() {
  q("#mural").innerHTML = "";

  for (var i = 0; i < DECOMPRESSED_AVATARS.length; i++) {
    q("#mural").innerHTML += buildAvatarCanvas(DECOMPRESSED_AVATARS[i], false);
  }
  watchMuralSorting();
  rankSorting(".rank-words", "mural");
};

function buildMarket() {
  q("#market-container").innerHTML = "";

  for (var i = 0; i < ALL_DECOMPRESSED_MARKET_DATA.length; i++) {
    if (!ALL_DECOMPRESSED_MARKET_DATA[i].forSale) { }
    else {
      console.log(ALL_DECOMPRESSED_MARKET_DATA[i]);
      q("#market-container").innerHTML += buildMarketCanvas(ALL_DECOMPRESSED_MARKET_DATA[i], findAvatarFromId(ALL_DECOMPRESSED_MARKET_DATA[i].avatarId));
    }
  }
  watchMarketSorting();
  buildMarketBuyWatchers();
};

function buildMarketBuyWatchers() {
  let market_details_boxes = document.querySelectorAll("#market-box .market-details-box");

  for (let i = 0; i < market_details_boxes.length; i++) {
    market_details_boxes[i].addEventListener("click", function (e) {
      if (wallet.isSignedIn()) {
        if (!IS_BUYING_PROGRESS) {
          IS_BUYING_PROGRESS = true;
          let this_item = e.target.parentElement;
          if (this_item.classList.contains("market-canvas")) { } else {
            this_item = this_item.parentElement;
          }
          buySomeAvatar(this_item.dataset.address, this_item.dataset.avatarid, this_item.dataset.price, function () {
            IS_BUYING_PROGRESS = false;
          });
        }
      } else {
        let this_item = e.target.parentElement;
        if (this_item.classList.contains("market-canvas")) { } else {
          this_item = this_item.parentElement;
        }
        this_item.querySelector(".market-price-label").innerHTML = "Login to buy:";
      }
    });
  }

};

function proceedToGame() {
  if (!IS_LOCKED) {
    q("#game-launcher").addEventListener("click", function () {
      q("#signed-out-flow").classList.add("hide");
      q("#choose-avatar").classList.add("hide");
      q("#market-box").classList.add("hide");
      q("#xgc-stats").classList.add("hide");
      bootUpGame();
    });
  }
}

function importAvatar(address, data, description, incomingLevel, incomingCorrectWords) {
  var to_save = LZUTF8.compress(data, { outputEncoding: "StorageBinaryString" });
  let description_save = LZUTF8.compress(sanitize(description), { outputEncoding: "StorageBinaryString" });

  contract.importAvatar({ addressForOwner: address, incomingAvatarData: to_save, description: description_save, level: incomingLevel, correctWords: incomingCorrectWords })
    .then(result => {
      console.log(result);
    });
}

function moderatorRemoveAvatar(username, avatarIndex) {
  contract.moderatorRemoveAvatar({ _username: username, _avatarIndex: avatarIndex })
    .then(result => {
      console.log(result);
    });
}

function moderatorRemoveListing(username, avatarId) {
  contract.moderatorRemoveListing({ _username: username, _avatarId: avatarId })
    .then(result => {
      console.log(result);
    });
};

function reduceEligibleRewards(val) {
  contract.reduceEligibleRewards({ value: val })
    .then(result => {
      console.log(result);
    });
}
function checkXGCBalance() {
  contract.checkXGCBalance({})
    .then(result => {
      console.log(result);
    });
}
function checkThisContractBalanceXGC() {
  contract.checkThisContractBalanceXGC({})
    .then(result => {
      console.log(result);
    });
}
function getXGCTotalSupply() {
  xgcContract.ft_total_supply({})
    .then(result => {
      console.log(result);
      q("#xgc-supply").innerHTML = "Current supply: " + result / XGC_DECIMALS + " XGC";
    });
}
function getXGCMetadata() {
  xgcContract.ft_metadata({})
    .then(result => {
      console.log(result);
    });
}
function getXGCMyBalance() {
  xgcContract.ft_balance_of({ account_id: (wallet._authData.accountId).toString() })
    .then(result => {
      console.log(result);
      q("#xgc-my-balance").innerHTML = "My balance: " + result / XGC_DECIMALS + " XGC";
    });
}
function getXGCGameBalance() {
  xgcContract.ft_balance_of({ account_id: CONTRACT })
    .then(result => {
      console.log(result);
      q("#xgc-game-balance").innerHTML = "Game balance: " + result / XGC_DECIMALS + " XGC";
    });
}
function parsePlayerBalances() {
  let sum = 0;
  for (var i = 0; i < ALL_PLAYERS.length; i++) {
    sum += parseInt(ALL_PLAYERS[i].rewards);
  }
  return sum;
};
function setAvatarPrice(price) {
  contract.setAvatarPrice({ _price: price })
    .then(result => {
      console.log(result);
    });
}

async function depositForRewards(amount) {
  contract.depositForRewards({ value: amount })
    .then(result => {
      console.log(result);
    });
};

function resetRewardState() {
  contract.resetRewardState({})
    .then(result => {
      console.log(result);
    });
}

function setRoyalty(royalty) {
  contract.setRoyalty({ _royalty: royalty })
    .then(result => {
      console.log(result);
    });
}

function sendDonations(incoming) {
  contract.sendDonations({ _amountInNear: utils.format.parseNearAmount(incoming.toString()) })
    .then(result => {
      console.log(result);
    });
};
function withdrawRewards(callback) {
  contract.withdrawRewards({}, 150000000000000)
    .then(result => {
      console.log(result);
      callback();
    });
}
async function getPublicAvatars(callback) {
  contract.getAvatars({})
    .then(result => {
      console.log(result);
      ORIGINAL_AVATAR_DATA = result;
      decompressAvatarData();
      buildMural();
      callback();
    });
};

async function getPublicOrders() {
  contract.getOrders({})
    .then(result => {
      console.log(result);
      ALL_MARKET_DATA = result;
      decompressMarketData();
      buildMarket();
    });
};

async function setPayRate(rate) {
  contract.setPayRate({ _pay_rate: rate }, GAS_TO_ATTACH)
    .then(result => {
      console.log(result);
    });
};

async function getGameRewardsState() {
  contract.getGameRewardsState({})
    .then(result => {
      GAME_REWARDS_STATE_IN_NEAR = {
        currentEligibleRewards: result[0].currentEligibleRewards / XGC_DECIMALS,
        minimumBalance: utils.format.formatNearAmount(result[0].minimumBalance),
        minimumWithdrawalAmount: result[0].minimumWithdrawalAmount,
        payRate: result[0].payRate / XGC_DECIMALS,
        withdrawalFee: result[0].withdrawalFee,
        avatarPrice: result[0].avatarPrice
      }
      q("#mint-character-button").innerHTML = "Donate for " + utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.avatarPrice) + " N";
      q("#eligible-rewards").innerHTML = result[0].currentEligibleRewards / XGC_DECIMALS + " XGC available";
      CURRENT_PAY_RATE = result[0].payRate / XGC_DECIMALS;
      console.log(result);
    });
};

async function setForSale(_price, callback) {
  let price_to_submit = _price.toString();
  contract.setForSale({ _avatarId: parseInt(CURRENT_AVATAR_ID), price: utils.format.parseNearAmount(price_to_submit) })
    .then(result => {
      console.log(result);
      callback();
    });
};

async function updateThisOrder(_avatarId, _forSale, _price, callback) {
  let price_to_submit = _price.toString();

  contract.updateForSale({ _avatarId: parseInt(CURRENT_AVATAR_ID), isForSale: true, price: utils.format.parseNearAmount(price_to_submit) })
    .then(result => {
      console.log(result);
      callback();
    });
};

async function removeThisOrder(callback) {
  contract.removeListing({ _avatarId: parseInt(CURRENT_AVATAR_ID) })
    .then(result => {
      console.log(result);
      callback();
    });
};

async function buySomeAvatar(addressOfOwner, actualIdOfAvatarToBuy, price, callback) {
  contract.buySomeAvatar({ addressOfTrueOwner: addressOfOwner, _avatarIdToBuy: parseInt(actualIdOfAvatarToBuy) }, GAS_TO_ATTACH, utils.format.parseNearAmount(price))
    .then(result => {
      console.log(result);
      callback();
    });
};

function decompressMarketData() {
  let newArrayOfMarketObjects = [];

  for (var i = 0; i < ALL_MARKET_DATA.length; i++) {
    for (var j = 0; j < ALL_MARKET_DATA[i].length; j++) {
      newArrayOfMarketObjects.push(ALL_MARKET_DATA[i][j]);
    }
  }
  ALL_DECOMPRESSED_MARKET_DATA = newArrayOfMarketObjects;
};

function decompressAvatarData() {
  let newAvatarDatas = [];

  for (var i = 0; i < ORIGINAL_AVATAR_DATA.length; i++) {
    for (var j = 0; j < ORIGINAL_AVATAR_DATA[i].datas.length; j++) {
      newAvatarDatas.push({
        data: LZUTF8.decompress(ORIGINAL_AVATAR_DATA[i].datas[j], { inputEncoding: "StorageBinaryString" }),
        description: LZUTF8.decompress(sanitize(ORIGINAL_AVATAR_DATA[i].descriptions[j]), { inputEncoding: "StorageBinaryString" }),
        highestLevel: ORIGINAL_AVATAR_DATA[i].highestLevels[j],
        correctWordTotal: ORIGINAL_AVATAR_DATA[i].correctWordTotals[j],
        id: ORIGINAL_AVATAR_DATA[i].ids[j],
        address: ORIGINAL_AVATAR_DATA[i].address
      });
    }
  }

  DECOMPRESSED_AVATARS = newAvatarDatas;
};

async function getAvatars(callback) {
  contract.getAvatars({})
    .then(result => {
      ORIGINAL_AVATAR_DATA = result;
      decompressAvatarData();
      let wasFound = false;
      for (var k = 0; k < result.length; k++) {
        if (result[k].address == wallet._authData.accountId) {
          for (var a = 0; a < result[k].ids.length; a++) {
            CURRENT_AVATAR_TO_SUBMIT_INDEX = a; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!
            CURRENT_AVATAR_ID = result[k].ids[a];
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

function findAvatarFromId(avatarId) {
  for (var i = 0; i < DECOMPRESSED_AVATARS.length; i++) {
    if (avatarId == DECOMPRESSED_AVATARS[i].id) {
      return DECOMPRESSED_AVATARS[i];
    }
  }
  return "";
};

function convertDecompressedIndexToUsersArrayIndex() {

  for (var j = 0; j < DECOMPRESSED_AVATARS.length; j++) {
    if (ORIGINAL_AVATAR_DATA[j].address == wallet._authData.accountId) {
      for (var s = 0; s < ORIGINAL_AVATAR_DATA[j].ids.length; s++) {
        if (CURRENT_AVATAR_ID == ORIGINAL_AVATAR_DATA[j].ids[s]) {
          console.log("Found at: " + CURRENT_AVATAR_ID);
          return s;
        }
      }
    }
  }
}

function updateLastLevelPlayed(result, isCurrentPlayer) {

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
      let wasFound = false;
      ALL_PLAYERS = result;
      for (var k = 0; k < result.length; k++) {
        if (result[k].address == wallet._authData.accountId) {
          CURRENT_PLAYER_INDEX = k;
          wasFound = true;
        }
      }

      if (wasFound) {
        updateLastLevelPlayed(result, true);
        CURRENT_ELIGIBLE_AMOUNT = parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards / XGC_DECIMALS);
        q("#pending-rewards-total").innerHTML = "+" + parseFloat(CURRENT_ELIGIBLE_AMOUNT).toFixed(XGC_DECIMAL_PLACES) + " XGC";
        q("#earned-rewards-total").innerHTML = "+" + parseFloat(CURRENT_ELIGIBLE_AMOUNT).toFixed(XGC_DECIMAL_PLACES) + " XGC";
      }
      q("#xgc-player-balances").innerHTML = "Player balances: " + parsePlayerBalances() / XGC_DECIMALS + " XGC";
    });
};
async function getAvatarMintCount() {
  contract.getAvatarMintCount({})
    .then(result => {
      console.log(result);
    });
}
async function initPlayerRewards() {
  contract.initPlayerRewards({})
    .then(result => {
      console.log(result);
    });
};

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
  let CURRENT_LEVEL_CORRECT_COUNT = 0;
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

  this.getCorrectCount = function () {
    return CORRECT_COUNT;
  };
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
    CURRENT_LEVEL_CORRECT_COUNT = 0;
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
      game.startThisWordWatcher();
      IS_FETCHING_WORDS = false;
    });
  };

  this.getLevel = function () {
    return LEVEL;
  }

  this.init = function (words, callback) {
    WORDS_TO_USE = words;
    q("#notification").innerHTML = "Get ready..."
    that.getLevelWords(function () {
      that.updateLevel(function () {
        q("#game-start-lost-overlay").classList.add("hide");
        q("#notification").classList.add("hide");
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        if (width < 500) { WIDTH_FOR_ITEMS = 250; }

        if (LEVEL == 1) { size = 5; }
        else if (LEVEL == 2) { size = 7; }
        else if (LEVEL == 3) { size = 10; }
        else if (LEVEL >= 4) { size = 15; }

        q("#level").innerHTML = (LEVEL >= 12 ? "expert" : LEVEL);

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
      console.log("Tried to get init from here");
      current_selected_word.childNodes[this_word_index].classList.remove("current-word");
      that.resetAndProceedToNewSession();

    }
  };
  this.startThisWordWatcher = function () {
    var checkTime = 10;
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
    q("#notification").innerHTML = "Click to start a new game";
    IN_CURRENT_GAME = false;
  };

  this.submitLastLevelPlayed = async function (callback) {
    console.log("Submitting this many correct words");
    console.log(CURRENT_LEVEL_CORRECT_COUNT);
    contract.submitLastLevelPlayed({
      level: parseInt(LEVEL),
      wpm: parseInt(CURRENT_WPM),
      accuracy: parseInt(CURRENT_ACCURACY),
      correctCount: CURRENT_LEVEL_CORRECT_COUNT,
      _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX)
    }, GAS_TO_ATTACH)
      .then(result => {
        console.log("last level saved");
        console.log(result);
        CURRENT_LEVEL_CORRECT_COUNT = 0;
        callback(result);
      });
  };

  this.getLevelWords = async function (callback) {
    contract.getLevelWords({ level: LEVEL })
      .then(result => {
        THIS_LEVEL_WORD_INDEXES = result;
        callback()
      });
  };
  this.updateLevel = async function (callback) {
    contract.updateLevel({ level: LEVEL })
      .then(result => {
        console.log(result);
        callback()
      });
  };

  this.getLastLevelPlayed = async function () {
    contract.getLastLevelPlayed({})
      .then(result => {
      });
  };

  this.getWordsList = async function (callback) {
    GOT_WORDS_LIST_ONCE = true;
    contract.getWordsList({})
      .then(result => {
        fetch('https://ipfs.io/ipfs/' + result)
          .then(function (response) {
            return response.json();
          }).then(function (data) {
            WORDS = data;
            callback();
          });
      });
  };

  this.initContract = async function () {
    contract.initContract({ wordsList: "QmWWqSuE8mH9jXgvPuKPQXJCsNqbj7Dtn2p3Lw8TeqCG1i", mintCount: 0 })
      .then(result => {
        console.log(result);

        contract.modifyRewardStates({ _minimum_balance: "1", _pay_rate: "1", _minimum_withdrawal_amount: "1", _withdrawal_fee: "1" })
          .then(result => {
            console.log(result);
          });

      });
  };


  this.getAndSetCurrentEligibleWordsForToday = async function () {
    contract.getAndSetCurrentEligibleWordsForToday({})
      .then(result => {
        let eligible_words_for_today = document.querySelectorAll(".eligible-words-for-today");
        for (var i = 0; i < eligible_words_for_today.length; i++) {
          eligible_words_for_today[i].innerHTML = result;
        }
      });
  };
  this.getThisPlayerAddress = async function () {
    contract.getThisPlayerAddress({})
      .then(result => {
        console.log(result);
      });
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
        LEVEL++;
        that.init(WORDS, function () {
          timer_paused = false;
          that.timer();
        });
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
            CORRECT_COUNT++;
            CURRENT_LEVEL_CORRECT_COUNT++;
            that.checkAndSetNextWord();
            current_selected_word.classList.add("correct");
            current_selected_word.classList.add("hide");

            let clear_sound = new Audio('audio/clear.mp3');
            clear_sound.play();
            console.log("Correct count");
            console.log(CORRECT_COUNT);
            CURRENT_ELIGIBLE_AMOUNT += CURRENT_PAY_RATE;
            q("#pending-rewards-total").innerHTML = "+" + parseFloat(CURRENT_ELIGIBLE_AMOUNT).toFixed(XGC_DECIMAL_PLACES) + " XGC";
            q("#earned-rewards-total").innerHTML = "+" + parseFloat(CURRENT_ELIGIBLE_AMOUNT).toFixed(XGC_DECIMAL_PLACES) + " XGC";
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
      var b = a.map(function (x) {
        x = parseInt(x).toString(16);
        return (x.length == 1) ? "0" + x : x;
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
  game.getWordsList(function () {
    q("#game-container").classList.remove("hide");
    q("#notification").innerHTML = "Click to start";
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
  let splitAvatarData = findAvatarFromId(CURRENT_AVATAR_ID).data.split(",");
  for (var s = 0; s < splitAvatarData.length; s++) {
    if (splitAvatarData[s] == "") { }
    else {
      splitAvatarData[s] = "#" + splitAvatarData[s].split("0x")[1];
    }
  }
  for (var i = 0; i < splitAvatarData.length; i++) {
    if (splitAvatarData.length == 64) {
      q("#current-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    } else {
      q("#current-avatar-canvas").innerHTML += '<div class="sm-pixel large" style="background-color:' + splitAvatarData[i] + '"></div>';
    }
    q("#display-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
  }
  if (splitAvatarData.length > 64) {
    q("#current-avatar-canvas").classList.add("large");
  } else {
    q("#current-avatar-canvas").classList.remove("large");
  }
};

function generateCurrentAvatar() {
  q("#all-account-avatars").innerHTML = "";
  console.log("building user");
  let was_found = false;
  for (var j = 0; j < DECOMPRESSED_AVATARS.length; j++) {

    if (DECOMPRESSED_AVATARS[j].address == wallet._authData.accountId) {
      was_found = true;
      console.log("Found address");
      let is_selected_index = (CURRENT_AVATAR_ID == DECOMPRESSED_AVATARS[j].id);
      q("#all-account-avatars").innerHTML += buildAvatarCanvas(DECOMPRESSED_AVATARS[j], is_selected_index);
    }
  }


  if (was_found) {
    q("#update-avatar-description").classList.remove("hide");
  }
  setTimeout(function () {
    q(".account-avatar-canvas.selected-avatar .descriptions").click();
  }, 100);

};

function getOrderForAvatarId(thisId) {
  let was_found = false;

  if (typeof ALL_DECOMPRESSED_MARKET_DATA != 'undefined') {
    for (var i = 0; i < ALL_DECOMPRESSED_MARKET_DATA.length; i++) {
      if (ALL_DECOMPRESSED_MARKET_DATA[i].avatarId == thisId) {
        was_found = true;
        return ALL_DECOMPRESSED_MARKET_DATA[i];
      }
    }
  }

  if (!was_found) {
    return false;
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
        let orderForAVatarId = getOrderForAvatarId(e.target.parentElement.dataset.avatarid);
        if (orderForAVatarId == false) {
          q("#update-market-price-input").value = "";
          q("#remove-this-listing-button").classList.add("hide");
          q("#update-market-price").innerHTML = "Set asking price for 1 XGC";
        }
        else {
          if (orderForAVatarId.forSale) {
            q("#update-market-price-input").value = utils.format.formatNearAmount(orderForAVatarId.priceForSale);
            q("#remove-this-listing-button").classList.remove("hide");
            q("#update-market-price").innerHTML = "Update asking price";
          }
        }

        CURRENT_AVATAR_ID = e.target.parentElement.dataset.avatarid;

        CURRENT_AVATAR_TO_SUBMIT_INDEX = convertDecompressedIndexToUsersArrayIndex();

        q("#current-avatar-canvas").innerHTML = "";
        setTimeout(function () {
          displayCurrentGameAvatar();
        }, 1);
      }
    });
  }
};

function buildMarketCanvas(marketItem, avatarItem) {

  let splitAvatarData = avatarItem.data.split(",");
  for (var s = 0; s < splitAvatarData.length; s++) {
    if (splitAvatarData[s] == "") { }
    else {
      splitAvatarData[s] = "#" + splitAvatarData[s].split("0x")[1];
    }
  }

  let this_price = utils.format.formatNearAmount(marketItem.priceForSale);
  let builder = "";
  if (splitAvatarData.length == 64) {
    builder = '<div data-price="' + this_price + '" data-address="' + avatarItem.address + '" data-avatarid="' + avatarItem.id + '" class="account-avatar-canvas market-canvas"><div class="avatar-account-box">';
  } else {
    builder = '<div data-price="' + this_price + '" data-address="' + avatarItem.address + '" data-avatarid="' + avatarItem.id + '" class="account-avatar-canvas large market-canvas"><div class="avatar-account-box">';
  }
  for (var i = 0; i < splitAvatarData.length; i++) {
    if (splitAvatarData.length == 64) {
      builder += '<div class="md-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    } else {
      builder += '<div class="lg-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    }
  }
  builder += '<div class="market-descriptions">' + avatarItem.description + '</div>';

  builder += '</div>';

  builder += '<div class="avatar-box">';
  builder += '<span class="rank-levels">' + avatarItem.highestLevel + '.</span><span class="rank-words">' + avatarItem.correctWordTotal + '</span><span class="mint-ids">' + avatarItem.id + '</span><div class="truncate">' + avatarItem.address.split(NEAR_NETWORK_NAME)[0] + '</div>';
  builder += '</div>';

  builder += '<div class="market-details-box">';

  builder += '<span class="market-price-label">Buy:</span><span class="market-price">' + this_price + '</span><span> N</span>';

  builder += '</div>';

  builder += '</div>';

  return builder;
};

function buildAvatarCanvas(avatarItem, is_selected) {
  let splitAvatarData = avatarItem.data.split(",");
  for (var s = 0; s < splitAvatarData.length; s++) {
    if (splitAvatarData[s] == "") { }
    else {
      splitAvatarData[s] = "#" + splitAvatarData[s].split("0x")[1];
    }
  }
  let builder = "";
  if (splitAvatarData.length == 64) {
    builder = '<div data-avatarid="' + avatarItem.id + '" class="account-avatar-canvas ' + (is_selected ? "selected-avatar" : "") + '"><div class="avatar-account-box">';
  } else {
    builder = '<div data-avatarid="' + avatarItem.id + '" class="account-avatar-canvas large ' + (is_selected ? "selected-avatar" : "") + '"><div class="avatar-account-box">';
  }
  for (var i = 0; i < splitAvatarData.length; i++) {
    if (splitAvatarData.length == 64) {
      builder += '<div class="md-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    } else {
      builder += '<div class="lg-pixel" style="background-color:' + splitAvatarData[i] + '"></div>';
    }
  }
  builder += '</div><div class="avatar-box"><span class="rank-levels">' + avatarItem.highestLevel + '.</span><span class="rank-words">' + avatarItem.correctWordTotal + '</span><span class="mint-ids">' + avatarItem.id + '</span><div class="truncate">' + avatarItem.address.split(NEAR_NETWORK_NAME)[0] + '</div></div>';

  builder += '<div class="descriptions">' + avatarItem.description + '</div>';
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
  for (var k = 0; k < 132; k++) {
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
      all_pallets.children[i].style.backgroundColor = "";
      all_pallets.children[i].dataset.color = "";
    } else if (i == all_pallets.children.length - 2) {
      all_pallets.children[i].style.backgroundColor = "#ffffff";
      all_pallets.children[i].dataset.color = "#ffffff";
    } else if (i == all_pallets.children.length - 1) {
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
    let avatar_canvas = document.querySelector("#avatar-canvas");
    let newArray = [];
    for (var i = 0; i < avatar_canvas.children.length; i++) {
      newArray.push(avatar_canvas.children[i].style.backgroundColor);
    }
    PIXELS_TO_SUBMIT_FOR_AVATAR = newArray;
    mintAvatar();
  });


};


async function mintAvatar() {
  let pixels_to_hex = convertToHex(PIXELS_TO_SUBMIT_FOR_AVATAR).toString();
  var to_save_data = LZUTF8.compress(pixels_to_hex, { outputEncoding: "StorageBinaryString" });
  let description_save = LZUTF8.compress(sanitize(q("#new-avatar-description").value), { outputEncoding: "StorageBinaryString" });
  let result = await contract.mintAvatar({ incomingAvatarData: to_save_data.toString(), description: description_save.toString() }, GAS_TO_ATTACH, GAME_REWARDS_STATE_IN_NEAR.avatarPrice);
  console.log(result);
};

function saveAvatar() {
  let avatar_canvas = q("#avatar-canvas").children;
  for (var i = 0; i < avatar_canvas.length; i++) {
    AVATAR.push(avatar_canvas[i].style.backgroundColor);
  }
}

function watchMarketSorting() {
  if (!SET_MARKET_SORT_WATCHERS_ONCE) {
    SET_MARKET_SORT_WATCHERS_ONCE = true;
    q("#rank-sort-market").addEventListener("click", function () {
      console.log("click");
      rankSorting(".rank-levels", "market-container");
    });
    q("#words-sort-market").addEventListener("click", function () {
      rankSorting(".rank-words", "market-container");
    });
    q("#mint-ids-sort-market").addEventListener("click", function () {
      rankSorting(".mint-ids", "market-container");
    });
    q("#price-sort-market").addEventListener("click", function () {
      rankSorting(".market-price", "market-container");
    });
  }
};

function watchMuralSorting() {
  if (!SET_SORTING_WATCHERS_ONCE) {
    SET_SORTING_WATCHERS_ONCE = true;
    q("#rank-sort").addEventListener("click", function () {
      rankSorting(".rank-levels", "mural");
    });
    q("#words-sort").addEventListener("click", function () {
      rankSorting(".rank-words", "mural");
    });
    q("#mint-ids-sort").addEventListener("click", function () {
      rankSorting(".mint-ids", "mural");
    });
  }
};

function rankSorting(sort_by, item) {

  let sortingCategories = [item];

  var toSort = q("#" + item).children;
  toSort = Array.prototype.slice.call(toSort, 0);

  toSort.sort(function (a, b) {
    var a_current_percents = a.querySelector(sort_by);
    var b_current_percents = b.querySelector(sort_by);
    var aord = a_current_percents.innerHTML;
    var bord = b_current_percents.innerHTML;
    if (sort_by == ".mint-ids") {
      return aord - bord;
    } else {
      return bord - aord;
    }
  });

  var parent = q("#" + item);
  parent.innerHTML = "";
  for (var i = 0, l = toSort.length; i < l; i++) {
    parent.appendChild(toSort[i]);
  }
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
function availableRewardsWatcher() {
  q("#eligible-rewards").addEventListener("click", function () {
    if (!IS_DISPLAYING_PAYRATE) {
      IS_DISPLAYING_PAYRATE = true;
      q("#eligible-rewards").innerHTML = "Pay rate " + GAME_REWARDS_STATE_IN_NEAR.payRate + " XGC/word";
      setTimeout(function () {
        q("#eligible-rewards").innerHTML = GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards + " XGC available";
        IS_DISPLAYING_PAYRATE = false;
      }, TIMEOUT_PROCESSING_WORDS_DELAY);
    }
  });
};

function withdrawalWatcher() {
  function withdrawalProcess() {
    if (!IS_WITHDRAWING) {
      IS_WITHDRAWING = true;
      withdrawRewards(function () {
        IS_WITHDRAWING = false;
        WITHDRAWAL_BUTTON_PROCESSING = false;
        q("#pending-rewards-total").innerHTML = "Withdrawal completed";
        q("#earned-rewards-withdrawal").innerHTML = "Withdrawal completed";
      });
    }
  };
  q("#pending-rewards-total").addEventListener("click", function () {
    if (!WITHDRAWAL_BUTTON_PROCESSING) {
      WITHDRAWAL_BUTTON_PROCESSING = true;
      if (parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards) >= parseFloat(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount)) {
        q("#pending-rewards-total").innerHTML = "Withdrawing...";
        withdrawalProcess();
      } else {
        q("#pending-rewards-total").innerHTML = "Minimum " + GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount / XGC_DECIMALS + " XGC";
        setTimeout(function () {
          q("#pending-rewards-total").innerHTML = "+ " + (ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards / XGC_DECIMALS).toFixed(XGC_DECIMAL_PLACES) + " XGC ";
          WITHDRAWAL_BUTTON_PROCESSING = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });

  q("#earned-rewards-withdrawal").addEventListener("click", function () {
    if (!WITHDRAWAL_BUTTON_PROCESSING) {
      WITHDRAWAL_BUTTON_PROCESSING = true;
      if (parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].reward) >= parseFloat(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount)) {
        q("#earned-rewards-withdrawal").innerHTML = "Withdrawing...";
        withdrawalProcess();
      } else {
        q("#earned-rewards-withdrawal").innerHTMl = "Need minimum of " + GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount + " N";
        setTimeout(function () {
          q("#earned-rewards-withdrawal").innerHTMl = "+ " + parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards / XGC_DECIMALS).toFixed(XGC_DECIMAL_PLACES) + " N";
          WITHDRAWAL_BUTTON_PROCESSING = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });
};

function removeListingWatcher() {
  q("#remove-this-listing-button").addEventListener("click", function () {
    if (!IS_UPDATING_ORDER) {
      IS_UPDATING_ORDER = true;
      let orderForAVatarId = getOrderForAvatarId(CURRENT_AVATAR_ID);
      if (orderForAVatarId == false) {
        q("#remove-this-listing-button").innerHTML = "No order for this avatar.";
        q("#remove-this-listing-button").classList.add("hide");
      } else {
        q("#remove-this-listing-button").innerHTML = "Removing from market...";
        removeThisOrder(function () {
          q("#remove-this-listing-button").innerHTML = "Removed";
          IS_UPDATING_ORDER = false;
          buildMarket();
        });
      }
    }
  });
};

function setAskingPriceWatcher() {
  q("#update-market-price").addEventListener("click", function () {
    if (!IS_UPDATING_ORDER) {
      if (ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards >= ACTION_FEE) {
        IS_UPDATING_ORDER = true;
        let orderForAVatarId = getOrderForAvatarId(CURRENT_AVATAR_ID);
        if (orderForAVatarId == false) {
          q("#update-market-price").innerHTML = "Updating to market...";
          setForSale(sanitize(q("#update-market-price-input").value), function () {
            q("#update-market-price").innerHTML = "Updated to market";
            IS_UPDATING_ORDER = false;
            getPublicOrders();
          });
        } else {
          q("#update-market-price").innerHTML = "Updating listing...";
          updateThisOrder(CURRENT_AVATAR_ID, true, sanitize(q("#update-market-price-input").value), function () {
            console.log("updated listing");
            q("#update-market-price").innerHTML = "Updated on market";
            IS_UPDATING_ORDER = false;
            getPublicOrders();
          });
        }
      } else {
        q("#update-market-price").classList.add("red");
        q("#update-market-price").classList.remove("green");
        q("#update-market-price").innerHTML = "Requires minimum fee of " + ACTION_FEE / XGC_DECIMALS + " XGC";
        setTimeout(function () {
          q("#update-market-price").classList.remove("red");
          q("#update-market-price").classList.add("green");
          q("#update-market-price").innerHTML = "Set asking price for 1 XGC";
          IS_UPDATING_ORDER = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });
};

function updateDescriptionWatcher() {

  q("#update-description").addEventListener("click", function () {
    if (!IS_UPDATING_DESCRIPTION) {
      q("#update-description").innerHTML = "Updating...";
      IS_UPDATING_DESCRIPTION = true;
      if (ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards >= ACTION_FEE) {

        let new_description_save = LZUTF8.compress(sanitize(q("#update-avatar-description").value), { outputEncoding: "StorageBinaryString" });

        contract.updateAvatarDescription({ _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX), _description: new_description_save })
          .then(result => {

            q("#update-description").innerHTML = "updated";
            setTimeout(function () {
              q("#update-description").innerHTML = "Update description";
              IS_UPDATING_DESCRIPTION = false;
              buildMural();
              generateCurrentAvatar();
              watchAvatarSelection();
            }, 100);
          });
      } else {
        q("#update-description").classList.add("red");
        q("#update-description").classList.remove("green");
        q("#update-description").innerHTML = "Requires minimum fee of " + ACTION_FEE / XGC_DECIMALS + " XGC";
        setTimeout(function () {
          q("#update-description").classList.remove("red");
          q("#update-description").classList.add("green");
          q("#update-description").innerHTML = "Update description for 1 XGC";
          IS_UPDATING_DESCRIPTION = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });
}