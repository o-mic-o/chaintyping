const CONTRACT = "chaintyping-game.near"; //TESTNET: 'dev-1637596638965-95668057112174';
const BACKEND_URL = "https://chaintyping-backend-mainnet.vercel.app/api";
const NEAR_NETWORK_NAME = ".near";
const NETWORK_ID_LOCAL = "mainnet";
const GAS_TO_ATTACH = 100000000000000;
let CURRENT_LANGUAGE = "english";

function initSyncingLocally() {

  fetch(BACKEND_URL + "/sync_locally").then(function (response) {
    return response.json();
  }).then(function (data) {
  }).catch(error => {
    ERROR_MESSAGE(error);
  });
};

initSyncingLocally();

function setCounter() {
  function updateCounter(counter) {
    q("#counter").innerHTML = counter;
  };

  fetch(BACKEND_URL + "/set_counter", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ update: "update" })
  }).then(response => response.json())
    .then(result => {
      updateCounter(result.count);
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

setCounter();

let game;
const NEAR_DECIMALS = 4;

let ORIGINAL_AVATAR_DATA;
let PIXELS_TO_SUBMIT_FOR_AVATAR = [];
let PIXELS_TO_SUBMIT_FOR_UPDATE_CHARACTER = [];
let IS_UPDATING_CHARACTER = false;
//let ALL_AVATARS = [];
let CURRENT_AVATAR_ID = "";
let IS_LOCKED = false;
let IS_UPDATING_DESCRIPTION = false;
let SET_SORTING_WATCHERS_ONCE = false;
let CURRENT_PLAYER_INDEX = "";
let IN_CURRENT_GAME = false;
let CURRENT_AVATAR_IS_BANNED = false;
let CURRENT_AVATAR_TO_SUBMIT_INDEX = ""; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!
let ALL_MARKET_DATA = "";
let IS_UPDATING_ORDER = false;
let IS_BUYING_PROGRESS = false;
let ALL_PLAYERS = "";
let CURRENT_ELIGIBLE_AMOUNT = 0;
let CURRENT_PAY_RATE = "";
let GAME_REWARDS_STATE_IN_NEAR = "";
let IS_WITHDRAWING = false;
let IS_DISPLAYING_PAYRATE = false;
let WITHDRAWAL_BUTTON_PROCESSING = false;
let TIMEOUT_PROCESSING_WORDS_DELAY = 3000;
let SET_MARKET_SORT_WATCHERS_ONCE = false;
let HASH_ID = "";
let MAX_AVATARS_REACHED = false;
let IS_PUBLIC_PLAYERS = true;
let ALL_PLAYERS_TICKER_SORT = "";
let START_LEVEL = 1;

function q(input) { return document.querySelector(input); };

function ERROR_MESSAGE(error) {
  q("#error-notification").classList.remove("hide");
  q("#error-notification").classList.add("error-visible");
  q("#display-error-texts").innerHTML = "";
  q("#display-error-texts").innerHTML = '<h3>An error occured.</h3><h3 style="padding-top:15px;">Please refresh, then try logging out and in.</h3>';
  q("#display-error-texts").innerHTML += '<h4 style="padding-top:15px;font-style: italic;">' + error + '</h4>';
  q("#display-error-texts").innerHTML += '<h3 style="padding-top:15px;" class="red blinking">Click to refresh.</h3>'
  INTERNAL_GAME_ERROR = true;
}
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
//q("#contract-link").innerHTML = CONTRACT;
//q("#contract-link-market").innerHTML = CONTRACT;

const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.mainnet.near.org'
});

const { utils } = nearApi

let ACTION_FEE = utils.format.parseNearAmount("0.01");

const wallet = new nearApi.WalletConnection(near, 'chaintyping-game');

const contract = new nearApi.Contract(wallet.account(), CONTRACT, {
  viewMethods: [
    'getPlayers',
    'getAvatars',
    'getOrders',
    'getAvatarMintCount',
    'getGameRewardsState',
  ],
  changeMethods: [
    'initContract',
    'initPlayerRewards',
    'updateAvatarCharacter',
    'moderatorBlockListAvatar',
    'moderatorResetBlockList',
    'moderatorResetBanList',
    'moderatorBanAvatar',

    'mintAvatar',
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
    //'checkXGCBalance',
    //'checkThisContractBalanceXGC',
    'resetRewardState',
    'setAvatarPrice',
    'setMaxAvatars',
    'reduceEligibleRewards',
    'setMinimumWithdrawalAmount',
    'moderatorChangeDescription'
  ]
});


const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  q("#signed-out-flow").classList.remove("hide");
  getPlayers(function () {
    getGameRewardsState();
  });
  getPublicAvatars(function () {
    getPublicOrders();
  });

} else {

  button.classList.add("hide");

  /*let faqItems = document.querySelectorAll(".faq-section");
  for (var i = 0; i < faqItems.length; i++) {
    faqItems[i].classList.add("hide");
  }*/

  displayInnerMenu(false);
  IS_PUBLIC_PLAYERS = false;
  getPlayers(function () {
    getGameRewardsState();
  });
  signedInProcess();

}


if (window.location.hash != "") {
  HASH_ID = window.location.hash.split("#/")[1];
}

function hashMapper() {
  if (HASH_ID == "account") {
    setTimeout(function () {
      q("#account-id").click();
    }, 1);
  } else if (HASH_ID == "leaderboard") {
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
  } else if (HASH_ID == "stats") {
    setTimeout(function () {
      q("#game-stats-button").click();
    }, 1);
  } else if (wallet.isSignedIn()) {
    //q("#mural-button").classList.add("selected");
    q("#mural-box").classList.add("hide")
    q("#faq").classList.remove("hide");
    q("#faq-button").classList.add("selected");
  } else {
    q("#faq").classList.remove("hide");
    q("#faq-button").classList.add("selected");
  }
}
hashMapper();

function displayInnerMenu(isSwitchingFromGame) {
  q("#mural-box").classList.remove("hide");
  q("#sign-out-button-two").classList.remove("hide");
  q("#signed-out-flow").classList.remove("hide");
  q("#account-id").classList.remove("hide");
  //q("#faq-button").classList.add("hide");
  q("#get-avatar").classList.remove("hide");
  //q("#game-stats-button").classList.remove("hide");
  q("#account-id").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
  //q("#contract-link").innerHTML = contract.contractId;
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
        'getPlayers',
        'getAvatars',
        'initContract',
        'initPlayerRewards',
        'updateAvatarCharacter',
        'moderatorBlockListAvatar',
        'moderatorResetBlockList',
        'moderatorResetBanList',
        'moderatorBanAvatar',

        'mintAvatar',
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
        //'checkXGCBalance',
        //'checkThisContractBalanceXGC',
        'resetRewardState',
        'setAvatarPrice',
        'reduceEligibleRewards',
        'setMinimumWithdrawalAmount',
        'moderatorChangeDescription',
        'setMaxAvatars'
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

async function getSignature() {
  let signedMsg = await near.connection.signer.signMessage(wallet._authData.accountId, wallet._authData.accountId, NETWORK_ID_LOCAL)
  const signature = Buffer.from(signedMsg.signature).toString('hex')
  const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex')

  let to_submit = {
    "accountId": wallet._authData.accountId,
    "pubkey": pubKey,
    "signature": signature
  };
  return to_submit;
  /*
    fetch(BACKEND_URL + "/verify_signature", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(to_submit)
    }).then((res)=>{
      return res.json();
    }).then((data)=>{
      console.log(data);
    });
  */
};

function signedInProcess() {

  getAvatars(true, function () {
    getPublicOrders();
    buildMural();
    watchDonationButton();
    withdrawalWatcher();
    availableRewardsWatcher();
    if (!IS_LOCKED) {
      q("#game-launcher").classList.remove("hide");

      generateCurrentAvatar(function () {
        watchAvatarSelection(function () {
          setTimeout(function () {
            q("#all-account-avatars .selected-avatar .descriptions").click();
          }, 500);
        });
      });

      q("#view-current-user-settings").addEventListener("click", function () {
        let user_settings = q("#current-user-settings");
        if (user_settings.classList.contains("hide")) {
          q("#current-user-settings").classList.remove("hide");
          q("#view-current-user-settings").innerHTML = "Hide character settings";
        } else {
          q("#current-user-settings").classList.add("hide");
          q("#view-current-user-settings").innerHTML = "View character settings";
        }
      });
      q("#update-description").classList.remove("hide");
      q("#update-market-price-input").classList.remove("hide");
      q("#choose-avatar-update").classList.remove("hide");
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
      q("#choose-avatar-update").classList.add("hide");
      q("#view-current-user-settings").classList.add("hide");
    }
  });
}

function buildMural() {
  q("#mural").innerHTML = "";

  for (var i = 0; i < DECOMPRESSED_AVATARS.length; i++) {
    if (DECOMPRESSED_AVATARS[i].isBlockList || DECOMPRESSED_AVATARS[i].isBanned) { }
    else {
      q("#mural").innerHTML += buildAvatarCanvas(DECOMPRESSED_AVATARS[i], false);
    }
  }
  watchMuralSorting();
  rankSorting(".rank-words", "mural");
};

function buildMarket() {
  q("#market-container").innerHTML = "";

  for (var i = 0; i < ALL_DECOMPRESSED_MARKET_DATA.length; i++) {
    let findThisAvatar = findAvatarFromId(ALL_DECOMPRESSED_MARKET_DATA[i].avatarId);

    if (findThisAvatar.isBlockList || findThisAvatar.isBanned) { }
    else if (!ALL_DECOMPRESSED_MARKET_DATA[i].forSale) { }
    else {
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
      q("#game-stats").classList.add("hide");
      q("#faq").classList.add("hide");
      START_LEVEL = 1;
      q("#words").innerHTML = "";
      q("#notification").classList.remove("hide");
      q("#game-start-lost-overlay").classList.remove("hide");
      bootUpGame();
    });
    /*q("#game-launcher-resume").addEventListener("click", function () {
      q("#signed-out-flow").classList.add("hide");
      q("#choose-avatar").classList.add("hide");
      q("#market-box").classList.add("hide");
      q("#game-stats").classList.add("hide");
      q("#faq").classList.add("hide");
      q("#words").innerHTML = "";
      q("#notification").classList.remove("hide");
      q("#game-start-lost-overlay").classList.remove("hide");
      START_LEVEL = ALL_PLAYERS[CURRENT_PLAYER_INDEX].previousLevelCompleted + 1;
      bootUpGame();
    });*/
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
function importAvatarCompressed(address, data, description, incomingLevel, incomingCorrectWords) {
  contract.importAvatar({ addressForOwner: address, incomingAvatarData: data, description: description, level: incomingLevel, correctWords: incomingCorrectWords })
    .then(result => {
      console.log(result);
    });
}
function moderatorRemoveAvatar(username, avatarIndex) {
  contract.moderatorRemoveAvatar({ _username: username, _avatarIndex: avatarIndex })
    .then(result => {
    });
}
function moderatorChangeDescription(username, avatarIndex, newDescription) {
  let description_save = LZUTF8.compress(sanitize(newDescription), { outputEncoding: "StorageBinaryString" });

  contract.moderatorChangeDescription({ _username: username, _avatarIndex: avatarIndex, _newDescription: description_save })
    .then(result => {
    });
}

function moderatorBlockListAvatar(username, avatarIndex) {
  contract.moderatorBlockListAvatar({ _username: username, _avatarIndex: avatarIndex })
    .then(result => {
      console.log(result);
    });
};

function moderatorBanAvatar(username, avatarIndex) {
  contract.moderatorBanAvatar({ _username: username, _avatarIndex: avatarIndex })
    .then(result => {
      console.log(result);
    });
}

function moderatorResetBlockList(username) {
  contract.moderatorResetBlockList({ _username: username })
    .then(result => {
      console.log(result);
    });
}
function moderatorResetBanList(username) {
  contract.moderatorResetBanList({ _username: username })
    .then(result => {
      console.log(result);
    });
}

function setMinimumWithdrawalAmount(value) {
  contract.setMinimumWithdrawalAmount({ _amount: value })
    .then(result => {
    });
};

function moderatorRemoveListing(username, avatarId) {
  contract.moderatorRemoveListing({ _username: username, _avatarId: avatarId })
    .then(result => {
    });
};

function reduceEligibleRewards(val) {
  contract.reduceEligibleRewards({ value: val })
    .then(result => {
    });
}
function setWordList() {
  contract.setWordList({ wordsIpfsLocation: "QmaApxDfuizXYoNkiPb6zKyzr8NUNLkphFAVCUJDbzat8K" })
    .then(result => {
      console.log(result);
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
  contract.setAvatarPrice({ _price: price }, GAS_TO_ATTACH)
    .then(result => {
    });
}
function setMaxAvatars(amount) {
  contract.setMaxAvatars({ _amount: amount }, GAS_TO_ATTACH)
    .then(result => {
    });
}

async function depositForRewards(amount) {
  let value = utils.format.parseNearAmount(amount);
  let result = await contract.depositForRewards({}, GAS_TO_ATTACH, value);
};

function resetRewardState() {
  contract.resetRewardState({})
    .then(result => {
    });
}

function setRoyalty(royalty) {
  contract.setRoyalty({ _royalty: royalty })
    .then(result => {
    });
}

function sendDonations(incoming) {
  contract.sendDonations({ _amountInNear: utils.format.parseNearAmount(incoming.toString()) })
    .then(result => {
    });
};
function withdrawRewards(callback) {
  contract.withdrawRewards({}, 150000000000000)
    .then(result => {
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
}
async function getPublicAvatars(callback) {
  contract.getAvatars({ start: 0, end: 50 })
    .then(result => {
      contract.getAvatars({ start: 50, end: 100 })
        .then(result2 => {
          ORIGINAL_AVATAR_DATA = result.concat(result2);
          decompressAvatarData();
          buildMural();
          callback();
        }).catch(error2 => {
          ERROR_MESSAGE(error2);
        });;

    }).catch(error => {
      ERROR_MESSAGE(error);
    });;
};

async function getPublicOrders() {
  contract.getOrders({ start: 0, end: 50 })
    .then(result => {
      contract.getOrders({ start: 50, end: 100 })
        .then(result2 => {
          ALL_MARKET_DATA = result.concat(result2);
          decompressMarketData();
          buildMarket();
        }).catch(error2 => {
          ERROR_MESSAGE(error2);
        });;
    }).catch(error => {
      ERROR_MESSAGE(error);
    });;
};

async function setPayRate(rate) {
  contract.setPayRate({ _pay_rate: rate }, GAS_TO_ATTACH)
    .then(result => {
    });
};

async function getGameRewardsState() {
  contract.getGameRewardsState({})
    .then(result => {
      GAME_REWARDS_STATE_IN_NEAR = {
        currentEligibleRewards: utils.format.formatNearAmount(result[0].currentEligibleRewards),
        minimumBalance: utils.format.formatNearAmount(result[0].minimumBalance),
        minimumWithdrawalAmount: result[0].minimumWithdrawalAmount,
        payRate: utils.format.formatNearAmount(result[0].payRate),
        withdrawalFee: result[0].withdrawalFee,
        avatarPrice: result[0].avatarPrice,
        maxAvatars: result[0].maxAvatars,
        marketRoyalty: result[0].marketRoyalty,
        actionFee: result[0].actionFee,
        updateCharacterFee: result[0].updateCharacterFee,
        totalPaidOut: result[0].totalPaidOut,
        totalFeesEarned: result[0].totalFeesEarned,
        marketVolume: result[0].marketVolume
      }
      populateStatsTable();
      getAvatarMintCount();
      q("#market-fee-label").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.marketRoyalty) + " N fixed market fee";
      q("#mint-character-button").innerHTML = "Donate for " + utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.avatarPrice) + " N";
      q("#eligible-rewards").innerHTML = parseFloat(utils.format.formatNearAmount(result[0].currentEligibleRewards)).toFixed(NEAR_DECIMALS) + " N available";
      CURRENT_PAY_RATE = parseFloat(utils.format.formatNearAmount(result[0].payRate)).toFixed(NEAR_DECIMALS);

    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

function populateStatsTable() {
  q("#stats-action-fee").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.actionFee) + " Ⓝ";
  q("#stats-avatar-floor-price").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.avatarPrice) + " Ⓝ";
  q("#stats-eligible-rewards").innerHTML = GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards + " Ⓝ";

  q("#ticker-eligible-rewards").innerHTML = GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards + " N";

  q("#stats-market-royalty").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.marketRoyalty) + " Ⓝ";
  q("#stats-market-volume").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.marketVolume) + " Ⓝ";

  //q("#ticker-market-volume").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.marketVolume) + " N";
  let total_earned_by_players = 0;
  for (var i = 0; i < ALL_PLAYERS.length; i++) {
    total_earned_by_players += parseFloat(utils.format.formatNearAmount(ALL_PLAYERS[i].rewards));
  }
  q("#stats-in-game-earned").innerHTML = total_earned_by_players.toFixed(NEAR_DECIMALS) + " Ⓝ";
  q("#stats-maximum-avatars").innerHTML = GAME_REWARDS_STATE_IN_NEAR.maxAvatars;
  q("#stats-minimum-withdrawal").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount) + " Ⓝ";
  q("#stats-pay-rate").innerHTML = GAME_REWARDS_STATE_IN_NEAR.payRate + " Ⓝ";
  q("#stats-total-fees-earned").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.totalFeesEarned) + " Ⓝ";
  q("#stats-total-paid-out").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.totalPaidOut) + " Ⓝ";
  q("#stats-withdrawal-fee").innerHTML = utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.withdrawalFee) + " Ⓝ";
};

async function setForSale(_price, callback) {
  let price_to_submit = _price.toString();

  contract.setForSale({ _avatarId: parseInt(CURRENT_AVATAR_ID), price: utils.format.parseNearAmount(price_to_submit) }, GAS_TO_ATTACH)
    .then(result => {
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

async function updateThisOrder(_avatarId, _forSale, _price, callback) {
  let price_to_submit = _price.toString();

  contract.updateForSale({ _avatarId: parseInt(CURRENT_AVATAR_ID), isForSale: true, price: utils.format.parseNearAmount(price_to_submit) }, GAS_TO_ATTACH)
    .then(result => {
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

async function removeThisOrder(callback) {
  contract.removeListing({ _avatarId: parseInt(CURRENT_AVATAR_ID) })
    .then(result => {
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

async function buySomeAvatar(addressOfOwner, actualIdOfAvatarToBuy, price, callback) {
  contract.buySomeAvatar({ addressOfTrueOwner: addressOfOwner, _avatarIdToBuy: parseInt(actualIdOfAvatarToBuy) }, GAS_TO_ATTACH, utils.format.parseNearAmount(price))
    .then(result => {
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
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
        address: ORIGINAL_AVATAR_DATA[i].address,
        isBlockList: ORIGINAL_AVATAR_DATA[i].isBlockList[j],
        isBanned: ORIGINAL_AVATAR_DATA[i].isBanned[j]
      });
    }
  }

  DECOMPRESSED_AVATARS = newAvatarDatas;
};

async function getAvatars(modify_current_avatar_id, callback) {
  contract.getAvatars({ start: 0, end: 50 })
    .then(result => {
      contract.getAvatars({ start: 50, end: 100 })
        .then(result2 => {
          ORIGINAL_AVATAR_DATA = result.concat(result2);
          decompressAvatarData();
          let wasFound = false;
          for (var k = 0; k < ORIGINAL_AVATAR_DATA.length; k++) {
            if (ORIGINAL_AVATAR_DATA[k].address == wallet._authData.accountId) {
              for (var a = 0; a < ORIGINAL_AVATAR_DATA[k].ids.length; a++) {
                if (modify_current_avatar_id) {
                  CURRENT_AVATAR_TO_SUBMIT_INDEX = a; //ACTUAL INDEX OF THE PERSONS AVATAR IN THIER SPECIFIC ARRAY!
                  CURRENT_AVATAR_ID = ORIGINAL_AVATAR_DATA[k].ids[a];
                }
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
        }).catch(error2 => {
          ERROR_MESSAGE(error2);
        });

    }).catch(error => {
      ERROR_MESSAGE(error);
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
          return s;
        }
      }
    }
  }
};

function convertDecompressedIndexToUsersArrayIndexGetBanned() {
  for (var j = 0; j < DECOMPRESSED_AVATARS.length; j++) {
    if (ORIGINAL_AVATAR_DATA[j].address == wallet._authData.accountId) {
      for (var s = 0; s < ORIGINAL_AVATAR_DATA[j].ids.length; s++) {
        if (CURRENT_AVATAR_ID == ORIGINAL_AVATAR_DATA[j].ids[s]) {
          return ORIGINAL_AVATAR_DATA[j].isBanned[s];
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

function updateThisPlayerResults(result) {
  if (typeof ALL_PLAYERS[CURRENT_PLAYER_INDEX] != 'undefined') {
    Object.assign(ALL_PLAYERS[CURRENT_PLAYER_INDEX], result);
  }
};

function updateThisPlayerRewards(result) {
  ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards = result;
};

async function getPlayers(callback) {
  contract.getPlayers({ start: 0, end: 50 })
    .then(result => {
      contract.getPlayers({ start: 50, end: 100 })
        .then(result2 => {

          let wasFound = false;
          ALL_PLAYERS = result.concat(result2);
          ALL_PLAYERS_TICKER_SORT = result.concat(result2);
          let htmlBuilder = '';
          htmlBuilder += '<div class="ticker__item green">AVAILABLE:</div><div class="ticker__item" id="ticker-eligible-rewards">' + (GAME_REWARDS_STATE_IN_NEAR == "" ? "" : GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards + " N") + ' </div>';
          //htmlBuilder += '<div class="ticker__item green">MARKET VOLUME:</div><div class="ticker__item" id="ticker-market-volume"></div>';
          htmlBuilder += '<div class="ticker__item purple">LATEST GAMES:</div>';
          ALL_PLAYERS_TICKER_SORT = ALL_PLAYERS_TICKER_SORT.sort(function (a, b) {
            return parseFloat(b.lastBlockIndex) - parseFloat(a.lastBlockIndex);
          });
          for (let i = 0; i < 10; i++) {
            if (typeof ALL_PLAYERS_TICKER_SORT[i] == 'undefined') { }
            else {
              htmlBuilder += '<div class="ticker__item">' + ALL_PLAYERS_TICKER_SORT[i].address.split(NEAR_NETWORK_NAME)[0] + ' (L:' + ALL_PLAYERS_TICKER_SORT[i].previousLevelCompleted + ' A:' + ALL_PLAYERS_TICKER_SORT[i].previousAccuracy + ' W:' + ALL_PLAYERS_TICKER_SORT[i].previousWpm + ')</div>';
            }
          }

          q("#ticker-inner").innerHTML = htmlBuilder;

          if (!IS_PUBLIC_PLAYERS) {
            for (var k = 0; k < result.length; k++) {
              if (result[k].address == wallet._authData.accountId) {
                CURRENT_PLAYER_INDEX = k;
                wasFound = true;
              }
            }

            if (wasFound) {
              updateLastLevelPlayed(result, true);

              /*if (parseInt(ALL_PLAYERS[CURRENT_PLAYER_INDEX].previousLevelCompleted) >= 2) {
                q("#game-launcher-resume").classList.remove("hide");
              } else {
                q("#game-launcher-resume").classList.add("hide");
              }*/

              CURRENT_ELIGIBLE_AMOUNT = parseFloat(utils.format.formatNearAmount((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)));
              q("#pending-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
              q("#earned-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
            }
          }
          callback();
        }).catch(error2 => {
          ERROR_MESSAGE(error2);
        });

    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};
async function getAvatarMintCount() {
  contract.getAvatarMintCount({})
    .then(result => {
      q("#design-and-mint").innerHTML = "Design and mint character #" + (result + 1);
      if (result >= GAME_REWARDS_STATE_IN_NEAR.maxAvatars) {
        MAX_AVATARS_REACHED = true;
        q("#new-avatar-description").classList.add("hide");
        q("#current-color-selection").classList.add("hide");
        q("#pallet").classList.add("hide");
        q("#avatar-canvas").classList.add("hide");
        q("#design-and-mint").innerHTML = "Maximum limits of avatars reached";
        q("#mint-character-button").innerHTML = "Please wait for more generations";
      }
    });
}
async function initPlayerRewards() {
  contract.initPlayerRewards({})
    .then(result => {
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
};

function bootUpGame() {
  IN_CURRENT_GAME = false;
  q("#game-container").classList.remove("hide");
  q("#mural-box").classList.add("hide");
  q("#my-account-data").classList.add("hide");
  let signed_in_flows = document.querySelectorAll(".signed-in-flow");
  for (var siflow = 0; siflow < signed_in_flows.length; siflow++) {
    signed_in_flows[siflow].classList.remove("hide");
  }
  displayCurrentGameAvatar();
  startGame();
};

function Game() {
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
  let timerVar = undefined;
  let LEVEL = 1;
  let CURRENT_WPM = 0;
  let CURRENT_ACCURACY = 0;
  let TIMER_ONCE = false;
  let current_completed_string = [];
  let WRONG_CHARACTER_COUNT = 0;
  let CORRECT_CHARACTER_COUNT = 0;
  let MAX_OFFSET_HEIGHT = 445;
  let MIN_OFFSET_HEIGHT = 50;
  let GAME_LOST = false;
  let WIDTH_FOR_ITEMS = 900;
  let CURRENT_VELOCITY = 0;
  let LASER_COUNT = 0;
  let STATIC_Y_AVATAR_HEIGHT = 0;
  let Y_MAX_HEIGHT = 460;
  let THIS_LEVEL_WORDS = [];
  let moving_between_levels = true;
  let MUST_CLEAR_LASER_WATCHER = false;

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

    that.init(LEVEL, function () {
      that.timer();
      game_running = true;
      q("#game-start-lost-overlay").classList.add("hide");
      q("#notification").classList.add("hide");
      q("#words").classList.remove("hide");
      game.start();
      game.startThisWordWatcher();
    });
  };

  this.getLevel = function () {
    return LEVEL;
  }

  this.init = function (startingLevel, callback) {
    MUST_CLEAR_LASER_WATCHER = false;
    LEVEL = startingLevel;

    q("#notification").innerHTML = "Get ready..."
    that.getLevelWords(function () {

      //that.updateLevel(function(){

      q("#game-start-lost-overlay").classList.add("hide");
      q("#notification").classList.add("hide");
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      // if (width < 800) { WIDTH_FOR_ITEMS = 250; }
      if (width < 950) { WIDTH_FOR_ITEMS = width - 100; }


      q("#level").innerHTML = (LEVEL >= 12 ? "expert" : LEVEL);

      let builder = "";
      for (var x = 0; x < THIS_LEVEL_WORDS.length; x++) {
        let random_word = THIS_LEVEL_WORDS[x];
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

      //});

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
    //new_circle.id = "laser" + LASER_COUNT;
    new_circle.classList.add("circle");
    new_circle.classList.add("laser-circle" + LASER_COUNT);
    new_circle.classList.add("laser-circle");
    q("#typing-game").append(new_circle);

    let current_selected_word = q("#words");
    var current_moving_word = current_selected_word.childNodes[this_word_index];
    current_moving_word.classList.add("laser-word" + LASER_COUNT);
    current_moving_word.classList.add("laser-word");

    that.moveItem(new_circle, ([(current_moving_word.offsetLeft + that.currentMovingLocation()[2]), Y_MAX_HEIGHT]));
    new_circle.style.animation = "MoveDownToUp 0.5s linear infinite";
    LASER_COUNT++;
  };

  this.startThisLaserWatcher = function () {
    var checkTime = 1;

    var check = setInterval(function () {

      let check_for_matching_words = document.querySelectorAll(".laser-word");//+(LASER_COUNT - 1))[0];
      let check_for_matching_lasers = document.querySelectorAll(".laser-circle");// + (LASER_COUNT - 1))[0]

      for (var i = 0; i < check_for_matching_words.length; i++) {

        let check_for_matching_word = check_for_matching_words[i];
        let check_for_matching_laser = check_for_matching_lasers[i];

        if (check_for_matching_laser.classList.contains("hide")) { }
        else {

          if (typeof check_for_matching_word == 'undefined' || check_for_matching_word === null) { }
          else if (typeof check_for_matching_laser == 'undefined' || check_for_matching_laser === null) { }
          else {

            if (check_for_matching_word.offsetTop + 25 > check_for_matching_laser.offsetTop) {
              let clear_sound = new Audio('audio/clear.mp3');
              clear_sound.play();
              check_for_matching_word.classList.add("hide");
              check_for_matching_laser.classList.add("hide");
              if (i == (check_for_matching_words.length - 1)) {
                if (!game_running && !GAME_LOST) {
                  check_for_matching_word.classList.remove("current-word");
                  check_for_matching_word.classList.add("previous-current-word");
                  that.resetAndProceedToNewSession();
                }
              }
            }

            if (check_for_matching_laser.offsetTop <= MIN_OFFSET_HEIGHT) {
              check_for_matching_laser.classList.add("hide");
            }
            if (MUST_CLEAR_LASER_WATCHER) {
              clearInterval(check);
              check = undefined;
            }
          }

        }
      }

    }, checkTime);
  }
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
    CURRENT_VELOCITY = Y_MAX_HEIGHT / CURRENT_VELOCITY;
  };

  this.checkAndSetNextWord = function () {

    if (this_word_index + 1 == current_words.length) { game_running = false; } else {
      this_word = current_words[this_word_index + 1].split("");
    }

    let current_selected_word = q("#words");

    if (this_word_index + 1 == current_words.length) { game_running = false; } else {
      current_selected_word.childNodes[this_word_index].classList.remove("current-word");
      current_selected_word.childNodes[this_word_index].classList.add("previous-current-word");
      this_word_index++;
      current_selected_word.childNodes[this_word_index].classList.add("current-word");
    }
    that.setAnimationByLevel();

  };

  this.startThisWordWatcher = function () {
    var checkTime = 10;
    var check = setInterval(function () {
      if (typeof q("#words").childNodes[this_word_index] == 'undefined') { }
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
    MUST_CLEAR_LASER_WATCHER = true;
    q("#game-start-lost-overlay").classList.remove("hide");
    q("#notification").classList.remove("hide");
    q("#notification").innerHTML = 'Game over...';
    q("#words").classList.add("hide");
    q("#words").childNodes[this_word_index].classList.add("hide");
    q("#notification").innerHTML = "Updating to blockchain. Click to refresh!";
    IN_CURRENT_GAME = false;
    that.submitLastLevelPlayed(function (result) {

    });
  };

  this.submitLastLevelPlayed = async function (callback) {
    if (CURRENT_AVATAR_IS_BANNED) {
      ERROR_MESSAGE("This character is banned.");
    } else {
      let signedMsg = await near.connection.signer.signMessage(wallet._authData.accountId, wallet._authData.accountId, NETWORK_ID_LOCAL)
      const signature = Buffer.from(signedMsg.signature).toString('hex')
      const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex')

      let to_submit = {
        "accountId": wallet._authData.accountId,
        "pubkey": pubKey,
        "signature": signature,
        "avatarId": CURRENT_AVATAR_ID,
        "level": LEVEL
      };

      fetch(BACKEND_URL + "/game_lost_update", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(to_submit)
      }).then((res) => {
        return res.json();
      }).then((data) => {
        if (data.status == false && data.error == true) {
          ERROR_MESSAGE(data.message);
        } else {
          initSyncingLocally();
          callback();
        }
      }).catch(error => {
        ERROR_MESSAGE(error);
      });;
    }
  };

  this.getLevelWords = async function (callback) {
    if (CURRENT_AVATAR_IS_BANNED) {
      ERROR_MESSAGE("This character is banned.");
    } else {
      let signedMsg = await near.connection.signer.signMessage(wallet._authData.accountId, wallet._authData.accountId, NETWORK_ID_LOCAL)
      const signature = Buffer.from(signedMsg.signature).toString('hex')
      const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex')

      let to_submit = {
        "accountId": wallet._authData.accountId,
        "pubkey": pubKey,
        "signature": signature,
        "language": CURRENT_LANGUAGE,
        "avatarId": CURRENT_AVATAR_ID,
      };

      fetch(BACKEND_URL + "/get_level_words", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(to_submit)
      }).then((res) => {
        return res.json();
      }).then(function (data) {
        THIS_LEVEL_WORDS = data.words;
        callback();
      }).catch(error => {
        ERROR_MESSAGE(error);
      });;
    }
  };

  this.updateLevel = async function (callback) {
    if (CURRENT_AVATAR_IS_BANNED) {
      ERROR_MESSAGE("This character is banned.");
    } else {
      let signedMsg = await near.connection.signer.signMessage(wallet._authData.accountId, wallet._authData.accountId, NETWORK_ID_LOCAL)
      const signature = Buffer.from(signedMsg.signature).toString('hex')
      const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex')

      let to_submit = {
        "accountId": wallet._authData.accountId,
        "pubkey": pubKey,
        "signature": signature,
        "avatarId": CURRENT_AVATAR_ID,
        "level": LEVEL,
        "previous_wpm": CURRENT_WPM,
        "previous_accuracy": CURRENT_ACCURACY
      };

      fetch(BACKEND_URL + "/update_level", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(to_submit)
      }).then((res) => {
        return res.json();
      }).then((data) => {
        if (data.status == false && data.error == true) {
          ERROR_MESSAGE(data.message);
        } else {
          callback();
        }
      }).catch(error => {
        ERROR_MESSAGE(error);
      });;
    }

    /*fetch(BACKEND_URL + "/update_level").then(function (response) {
      return response.json();
    }).then(function (data) {
      console.log(data);
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });;*/

  };

  /* this.getWordsList = async function (callback) {
     GOT_WORDS_LIST_ONCE = true;
     fetch(BACKEND_URL + "/get_words_list?language=english").then(function (response) {
       return response.json();
     }).then(function (data) {
       WORDS = data.words;
       callback();
     }).catch(error => {
       ERROR_MESSAGE(error);
     });;

   };*/

  this.initContract = async function () {
    //QmWWqSuE8mH9jXgvPuKPQXJCsNqbj7Dtn2p3Lw8TeqCG1i
    contract.initContract({ mintCount: 0 }, GAS_TO_ATTACH)
      .then(result => {

        contract.modifyRewardStates({ _minimum_balance: utils.format.parseNearAmount("25"), _pay_rate: utils.format.parseNearAmount("0.0001"), _minimum_withdrawal_amount: utils.format.parseNearAmount("0.02"), _withdrawal_fee: utils.format.parseNearAmount("0.01") }, GAS_TO_ATTACH)
          .then(result => {

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


  this.resetAndProceedToNewSession = function () {

    that.pauseTimer();
    moving_between_levels = true;
    current_words = [];
    this_word = "";
    this_word_index = 0;
    q("#words").innerHTML = "";
    let check_for_matching_lasers = document.querySelectorAll(".laser-circle");
    for (var z = 0; z < check_for_matching_lasers.length; z++) {
      check_for_matching_lasers[z].remove();
    }
    LASER_COUNT = 0;

    if (!GAME_LOST) {
      //q("#game-start-lost-overlay").classList.remove("hide");
      //q("#notification").classList.remove("hide");
      //q("#notification").innerHTML = "Saving to blockchain, loading level " + (game.getLevel() + 1) + "...";
      //that.submitLastLevelPlayed(function (result) {
      that.updateLevel(function (result) {
        if (parseFloat(GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards) > 0) {
          //CURRENT_ELIGIBLE_AMOUNT += parseFloat(CURRENT_PAY_RATE);
          q("#pending-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
          q("#earned-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
        }
        LEVEL++;
        updateThisPlayerResults(result);
        getAvatars(false, function () { });
        getGameRewardsState();
        that.init(LEVEL, function () {
          timer_paused = false;
          that.timer();
        });

      });
    }
    game_running = true;
  };


  this.getDetails = function () {
    return {
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
      var caps = e.getModifierState && e.getModifierState('CapsLock');
      //console.log("CAPS" + caps);
      if (caps) {
        q("#caps-lock-notice").classList.remove("hide");
      } else {
        q("#caps-lock-notice").classList.add("hide");
      }

      if (!moving_between_levels) {

        if (game_running && !GAME_LOST) {
          that.moveItem(q("#current-avatar-canvas"), ([(that.currentMovingLocation()[0] + (that.currentMovingLocation()[2] - 20)), STATIC_Y_AVATAR_HEIGHT]));
          let current_selected_word = q(".current-word");
          let current_key = e.key;
          current_completed_string.push(current_key);

          if (matchingCharArray(current_completed_string, this_word)) {
            that.sendLaser();
            let laser = new Audio('audio/laser_retro.mp3');
            laser.volume = 0.5;
            laser.play();

            current_selected_word.childNodes[this_word.length - 1].classList.add("current-char");
            CORRECT_COUNT++;
            CURRENT_LEVEL_CORRECT_COUNT++;
            that.checkAndSetNextWord();

            if (parseFloat(GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards) > 0) {
              CURRENT_ELIGIBLE_AMOUNT += parseFloat(CURRENT_PAY_RATE);
              //q("#pending-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS)+ " N";
              //q("#earned-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
            }
            current_completed_string = [];
          } else {
            for (var char = 0; char < current_completed_string.length; char++) {
              if (current_completed_string[char] == this_word[char]) {
                current_selected_word.childNodes[char].classList.add("current-char");
                CORRECT_CHARACTER_COUNT++;
              }
              else {
                let force_field = new Audio('audio/force_field.mp3');
                force_field.volume = 0.35;
                force_field.play();

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
const currentAvatarPallet = {};
const currentUpdatePallet = {};

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
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "0x000000",
  "0x000000",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "0x000000",
  "0x000000",
  "0x000000",
  "",
  "",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "",
  "",
  "0x000000",
  "0xc8ff41",
  "",
  "",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0x000000",
  "",
  "",
  "0x000000",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0x000000",
  "",
  "",
  "0x000000",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "0x000000",
  "",
  "",
  "0x000000",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0x000000",
  "",
  "",
  "0x000000",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0xc8ff41",
  "0xc8ff41",
  "",
  "0x000000",
  "",
  "",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "0x000000",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  ""
]


function startGame() {
  game = undefined;
  game = new Game();
  //game.getWordsList(function () {
  q("#game-container").classList.remove("hide");
  q("#notification").innerHTML = "Click to start";
  watchLauncher();
  //});
}

function watchLauncher() {
  q("#notification").addEventListener('click', function () {
    if (q("#game-start-lost-overlay").classList.contains("hide")) { } else {
      q("#game-start-lost-overlay").click();
    }
  });
  q("#game-start-lost-overlay").addEventListener('click', function () {
    if (!IN_CURRENT_GAME) {
      IN_CURRENT_GAME = true;
      if (game.isGameOver()) {
        window.location.reload();
        //game.resetGameOver();
      } else {
        getPlayers(function () {
          getGameRewardsState();
          game.init(START_LEVEL, function () {
            q("#game-start-lost-overlay").classList.add("hide");
            q("#notification").classList.add("hide");
            q("#words").classList.remove("hide");
            game.start();
            game.startThisWordWatcher();
            game.startThisLaserWatcher();
          });
        });
      }
    } else {

    }
  });
};
function displayCurrentGameAvatar() {
  q("#current-avatar-canvas").innerHTML = "";
  q("#display-avatar-canvas").innerHTML = "";

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

function generateCurrentAvatar(callback) {
  q("#all-account-avatars").innerHTML = "";
  let was_found = false;
  for (var j = 0; j < DECOMPRESSED_AVATARS.length; j++) {

    if (DECOMPRESSED_AVATARS[j].address == wallet._authData.accountId) {
      was_found = true;
      let is_selected_index = (CURRENT_AVATAR_ID == DECOMPRESSED_AVATARS[j].id);
      let is_block_list = DECOMPRESSED_AVATARS[j].isBlockList;
      let is_banned = DECOMPRESSED_AVATARS[j].isBanned;
      CURRENT_AVATAR_IS_BANNED = is_banned;
      q("#all-account-avatars").innerHTML += buildAvatarCanvas(DECOMPRESSED_AVATARS[j], is_selected_index, is_block_list, is_banned);
    }
  }


  if (was_found) {
    q("#update-avatar-description").classList.remove("hide");
  }
  callback();
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

function watchAvatarSelection(callback) {
  let all_avatars = document.querySelectorAll("#all-account-avatars .account-avatar-canvas");
  for (var k = 0; k < all_avatars.length; k++) {

    all_avatars[k].addEventListener("click", function (e) {
      if (e.target.parentElement.classList.contains("account-avatar-canvas")) {

        let all_avatars_internal = document.querySelectorAll("#all-account-avatars .account-avatar-canvas");
        for (var p = 0; p < all_avatars_internal.length; p++) {
          all_avatars_internal[p].classList.remove("selected-avatar");
        }

        e.target.parentElement.classList.add("selected-avatar");
        q("#update-avatar-description").value = e.target.innerHTML;
        q("#design-and-mint-update").innerHTML = "Update character #" + e.target.parentElement.dataset.avatarid;

        let orderForAVatarId = getOrderForAvatarId(e.target.parentElement.dataset.avatarid);
        if (orderForAVatarId == false) {
          q("#update-market-price-input").value = "";
          q("#remove-this-listing-button").classList.add("hide");
          q("#update-market-price").innerHTML = "Set asking price for " + utils.format.formatNearAmount(ACTION_FEE) + " N";
        } else {
          if (orderForAVatarId.forSale) {
            q("#update-market-price-input").value = utils.format.formatNearAmount(orderForAVatarId.priceForSale);
            q("#remove-this-listing-button").classList.remove("hide");
            q("#update-market-price").innerHTML = "Update asking price for " + utils.format.formatNearAmount(ACTION_FEE) + " N";
          }
        }

        CURRENT_AVATAR_ID = e.target.parentElement.dataset.avatarid;

        CURRENT_AVATAR_TO_SUBMIT_INDEX = convertDecompressedIndexToUsersArrayIndex();
        CURRENT_AVATAR_IS_BANNED = convertDecompressedIndexToUsersArrayIndexGetBanned();
        q("#current-avatar-canvas").innerHTML = "";

      }

    });

  }
  callback();
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

  builder += '</div>';

  builder += '<div class="avatar-box">';
  builder += '<span class="rank-levels">' + avatarItem.highestLevel + '.</span><span class="rank-words">' + avatarItem.correctWordTotal + '</span><span class="mint-ids">' + avatarItem.id + '</span>.<div class="truncate">' + avatarItem.address.split(NEAR_NETWORK_NAME)[0] + '</div>';
  builder += '</div>';

  builder += '<div class="market-descriptions">' + avatarItem.description + '</div>';

  builder += '<div class="market-details-box">';

  builder += '<span class="market-price-label">Buy:</span><span class="market-price">' + this_price + '</span><span> N</span>';

  builder += '</div>';

  builder += '</div>';

  return builder;
};

function buildAvatarCanvas(avatarItem, is_selected, is_block_list, is_banned) {
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
  if (is_block_list) {
    builder += '</div><div class="avatar-box red">Needs Updating</div>';
  } else if (is_banned) {
    builder += '</div><div class="avatar-box red">Banned, please contact us</div>';
  } else {
    builder += '</div><div class="avatar-box"><span class="rank-levels">' + avatarItem.highestLevel + '.</span><span class="rank-words">' + avatarItem.correctWordTotal + '</span><span class="mint-ids">' + avatarItem.id + '</span>.<div class="truncate">' + avatarItem.address.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
  }

  builder += '<div class="descriptions">' + avatarItem.description + '</div>';
  builder += '</div>';

  return builder;
}

function generateDisplayAvatar() {
  for (var i = 0; i < DISPLAY_AVATAR.length; i++) {
    q("#display-avatar-canvas").innerHTML += '<div class="sm-pixel" style="background-color:#' + DISPLAY_AVATAR[i].split("0x")[1] + '"></div>';

  }
};

generateDisplayAvatar();
generateAvatarCanvas();
watchAvatarGenerator();
function generateAvatarCanvas() {
  for (var k = 0; k < 132; k++) {
    q("#avatar-canvas").innerHTML += '<div class="pixel"></div>';
    q("#avatar-canvas-update").innerHTML += '<div class="pixel"></div>';
  }
};

function watchAvatarGenerator() {
  currentAvatarPallet.thesePalletChoices = [];
  currentUpdatePallet.thesePalletChoices = [];

  var randomColor = function () { return Math.floor(Math.random() * 16777215).toString(16); };
  let all_pallets = document.querySelector("#pallet");
  let update_pallets = document.querySelector("#pallet-update");

  let getThisAvatarPalletSelection = function (incoming) {
    for (var k = 0; k < currentAvatarPallet.thesePalletChoices.length; k++) {
      if (incoming == currentAvatarPallet.thesePalletChoices[k]) {
        return currentAvatarPallet.thesePalletChoices[k].dataset.color;
      }
    }
  }
  let getThisUpdateAvatarPalletSelection = function (incoming) {
    for (var k = 0; k < currentUpdatePallet.thesePalletChoices.length; k++) {
      if (incoming == currentUpdatePallet.thesePalletChoices[k]) {
        return currentUpdatePallet.thesePalletChoices[k].dataset.color;
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

  for (var i = 0; i < update_pallets.children.length; i++) {
    currentUpdatePallet.thesePalletChoices.push(update_pallets.children[i]);
    let new_random_colour = randomColor();
    if (i == 0) {
      update_pallets.children[i].style.backgroundColor = "";
      update_pallets.children[i].dataset.color = "";
    } else if (i == update_pallets.children.length - 2) {
      update_pallets.children[i].style.backgroundColor = "#ffffff";
      update_pallets.children[i].dataset.color = "#ffffff";
    } else if (i == update_pallets.children.length - 1) {
      update_pallets.children[i].style.backgroundColor = "#000000";
      update_pallets.children[i].dataset.color = "#000000";
    } else {
      update_pallets.children[i].style.backgroundColor = "#" + new_random_colour;
      update_pallets.children[i].dataset.color = "#" + new_random_colour;
    }
    update_pallets.children[i].addEventListener('click', function (event) {
      currentUpdatePallet.colorSelection = getThisUpdateAvatarPalletSelection(event.target);
      q("#current-color-selection-update").style.backgroundColor = getThisUpdateAvatarPalletSelection(event.target);
    });
  }
  watchPixelsForAvatar();
  watchPixelsForUpdateAvatar();

}

function watchPixelsForAvatar() {
  let avatar_canvas = document.querySelector("#avatar-canvas");
  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
      event.target.style.backgroundColor = currentAvatarPallet.colorSelection;
    });
  }
};

function watchPixelsForUpdateAvatar() {
  let avatar_canvas = document.querySelector("#avatar-canvas-update");
  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
      event.target.style.backgroundColor = currentUpdatePallet.colorSelection;
    });
  }
};
function watchDonationButton() {
  q("#mint-character-button").addEventListener("click", function () {
    if (!MAX_AVATARS_REACHED) {
      let avatar_canvas = document.querySelector("#avatar-canvas");
      let newArray = [];
      for (var i = 0; i < avatar_canvas.children.length; i++) {
        newArray.push(avatar_canvas.children[i].style.backgroundColor);
      }
      PIXELS_TO_SUBMIT_FOR_AVATAR = newArray;
      mintAvatar();
    }
  });

  q("#update-character-button").addEventListener("click", function () {
    if (!IS_UPDATING_CHARACTER) {
      IS_UPDATING_CHARACTER = true;
      let avatar_canvas = document.querySelector("#avatar-canvas-update");
      let newArray = [];
      for (var i = 0; i < avatar_canvas.children.length; i++) {
        newArray.push(avatar_canvas.children[i].style.backgroundColor);
      }
      q("#update-character-button").innerHTML = "Updating, please wait";
      PIXELS_TO_SUBMIT_FOR_UPDATE_CHARACTER = newArray;
      updateAvatarCharacter();
    }
  });

};


async function mintAvatar() {
  let pixels_to_hex = convertToHex(PIXELS_TO_SUBMIT_FOR_AVATAR).toString();
  var to_save_data = LZUTF8.compress(pixels_to_hex, { outputEncoding: "StorageBinaryString" });
  let description_save = LZUTF8.compress(sanitize(q("#new-avatar-description").value), { outputEncoding: "StorageBinaryString" });
  let result = await contract.mintAvatar({ incomingAvatarData: to_save_data.toString(), description: description_save.toString() }, GAS_TO_ATTACH, GAME_REWARDS_STATE_IN_NEAR.avatarPrice);
};

function updateAvatarCharacter() {
  let pixels_to_hex = convertToHex(PIXELS_TO_SUBMIT_FOR_UPDATE_CHARACTER).toString();
  var to_save_data = LZUTF8.compress(pixels_to_hex, { outputEncoding: "StorageBinaryString" });

  contract.updateAvatarCharacter({ _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX), incomingAvatarData: to_save_data }, GAS_TO_ATTACH)
    .then(result => {
      location.reload();
    }).catch(error => {
      ERROR_MESSAGE(error);
    });
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
      q("#eligible-rewards").innerHTML = "Pay rate " + GAME_REWARDS_STATE_IN_NEAR.payRate + " N per word";
      setTimeout(function () {
        q("#eligible-rewards").innerHTML = GAME_REWARDS_STATE_IN_NEAR.currentEligibleRewards + " N available";
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
      if (typeof ALL_PLAYERS[CURRENT_PLAYER_INDEX] != 'undefined' && (parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards) >= parseFloat(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount))) {
        q("#pending-rewards-total").innerHTML = "Withdrawing...";
        withdrawalProcess();
      } else {
        q("#pending-rewards-total").innerHTML = "Minimum " + utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount) + " N";
        setTimeout(function () {
          if (typeof ALL_PLAYERS[CURRENT_PLAYER_INDEX] != 'undefined') {
            q("#pending-rewards-total").innerHTML = "+ " + utils.format.formatNearAmount((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)) + " N";
          } else {
            q("#pending-rewards-total").innerHTML = "+ 0 N";
          }
          WITHDRAWAL_BUTTON_PROCESSING = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });

  q("#earned-rewards-withdrawal").addEventListener("click", function () {
    if (!WITHDRAWAL_BUTTON_PROCESSING) {
      WITHDRAWAL_BUTTON_PROCESSING = true;
      if (parseFloat(ALL_PLAYERS[CURRENT_PLAYER_INDEX].reward) >= utils.format.formatNearAmount(GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount)) {
        q("#earned-rewards-withdrawal").innerHTML = "Withdrawing...";
        withdrawalProcess();
      } else {
        q("#earned-rewards-withdrawal").innerHTMl = "Need minimum of " + GAME_REWARDS_STATE_IN_NEAR.minimumWithdrawalAmount + " N";
        setTimeout(function () {
          q("#earned-rewards-withdrawal").innerHTMl = "+ " + utils.format.formatNearAmount(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards) + " N";
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
          getPublicOrders();
        });
      }
    }
  });
};

function setAskingPriceWatcher() {
  q("#update-market-price").innerHTML = "Set asking price for " + utils.format.formatNearAmount(ACTION_FEE) + " N";

  q("#update-market-price").addEventListener("click", function () {
    if (!IS_UPDATING_ORDER) {
      if (typeof ALL_PLAYERS[CURRENT_PLAYER_INDEX] != 'undefined' && (parseFloat(utils.format.parseNearAmount(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)) >= parseFloat(utils.format.parseNearAmount(ACTION_FEE)))) {
        IS_UPDATING_ORDER = true;
        let orderForAVatarId = getOrderForAvatarId(CURRENT_AVATAR_ID);
        if (orderForAVatarId == false) {
          q("#update-market-price").innerHTML = "Updating to market...";
          setForSale(sanitize(q("#update-market-price-input").value), function () {
            q("#update-market-price").innerHTML = "Updated to market";
            updateThisPlayerRewards((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards - ACTION_FEE).toLocaleString('fullwide', { useGrouping: false }));
            CURRENT_ELIGIBLE_AMOUNT = parseFloat(utils.format.formatNearAmount((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)));
            q("#pending-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";
            IS_UPDATING_ORDER = false;
            getPublicOrders();
          });
        } else {
          q("#update-market-price").innerHTML = "Updating listing...";
          updateThisOrder(CURRENT_AVATAR_ID, true, sanitize(q("#update-market-price-input").value), function () {
            q("#update-market-price").innerHTML = "Updated on market";
            IS_UPDATING_ORDER = false;
            getPublicOrders();
          });
        }
      } else {
        q("#update-market-price").classList.add("red");
        q("#update-market-price").classList.remove("green");
        q("#update-market-price").innerHTML = "Requires minimum fee of " + utils.format.formatNearAmount(ACTION_FEE) + " N";
        setTimeout(function () {
          q("#update-market-price").classList.remove("red");
          q("#update-market-price").classList.add("green");
          q("#update-market-price").innerHTML = "Set asking price for " + utils.format.formatNearAmount(ACTION_FEE) + " N";
          IS_UPDATING_ORDER = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });
};

function updateDescriptionWatcher() {
  q("#update-description").innerHTML = "Update description for " + utils.format.formatNearAmount(ACTION_FEE) + " N";

  q("#update-description").addEventListener("click", function () {
    if (!IS_UPDATING_DESCRIPTION) {
      q("#update-description").innerHTML = "Updating...";
      IS_UPDATING_DESCRIPTION = true;
      if (typeof ALL_PLAYERS[CURRENT_PLAYER_INDEX] != 'undefined' && (parseFloat(utils.format.parseNearAmount(ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)) >= parseFloat(utils.format.parseNearAmount(ACTION_FEE)))) {

        let new_description_save = LZUTF8.compress(sanitize(q("#update-avatar-description").value), { outputEncoding: "StorageBinaryString" });

        contract.updateAvatarDescription({ _avatarIndex: parseInt(CURRENT_AVATAR_TO_SUBMIT_INDEX), _description: new_description_save }, GAS_TO_ATTACH)
          .then(result => {
            for (let i = 0; i < DECOMPRESSED_AVATARS.length; i++) {
              if (DECOMPRESSED_AVATARS[i].id == CURRENT_AVATAR_ID) {
                DECOMPRESSED_AVATARS[i].description = sanitize(q("#update-avatar-description").value);
              }
            }
            q("#update-description").innerHTML = "Updated";
            updateThisPlayerRewards((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards - ACTION_FEE).toLocaleString('fullwide', { useGrouping: false }));
            CURRENT_ELIGIBLE_AMOUNT = parseFloat(utils.format.formatNearAmount((ALL_PLAYERS[CURRENT_PLAYER_INDEX].rewards)));
            q("#pending-rewards-total").innerHTML = "+" + (CURRENT_ELIGIBLE_AMOUNT).toFixed(NEAR_DECIMALS) + " N";

            setTimeout(function () {
              q("#update-description").innerHTML = "Update description for " + utils.format.formatNearAmount(ACTION_FEE) + " N";
              IS_UPDATING_DESCRIPTION = false;
              buildMural();
              generateCurrentAvatar(function () {
                q("#all-account-avatars .selected-avatar .descriptions").click();
              });
              //watchAvatarSelection();
            }, 100);
          }).catch(error => {
            ERROR_MESSAGE(error);
          });
      } else {
        q("#update-description").classList.add("red");
        q("#update-description").classList.remove("green");
        q("#update-description").innerHTML = "Requires minimum fee of " + utils.format.formatNearAmount(ACTION_FEE) + " N";
        setTimeout(function () {
          q("#update-description").classList.remove("red");
          q("#update-description").classList.add("green");
          q("#update-description").innerHTML = "Update description for " + utils.format.formatNearAmount(ACTION_FEE) + " N";
          IS_UPDATING_DESCRIPTION = false;
        }, TIMEOUT_PROCESSING_WORDS_DELAY);
      }
    }
  });
}
