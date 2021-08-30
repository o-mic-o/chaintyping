// @nearfile

import { env, context, logging, storage, RNG, u128, ContractPromiseBatch, PersistentUnorderedMap, PersistentMap } from 'near-sdk-as';
import { Player, ChainAvatarsForUser, Game, OrderForUser, RewardsForUser, GameRewardsState } from './model';

const OWN = "mic.testnet";
const DAO = "chaintyping-test2.sputnikv2.testnet";
const PRICE = u128.from("3000000000000000000000000");
const MAX_AVATARS = <u32>100;
const MAX_WPM = 300;
const MAX_ACCURACY = 100;
const MAX_DESC = 120;
const ROYALTY = 0.03; // 3% royalty

const avatars = new PersistentUnorderedMap<string, ChainAvatarsForUser>("a");
const players = new PersistentUnorderedMap<string, Player>("p");
const orders = new PersistentUnorderedMap<string, Array<OrderForUser>>("o");
const userRewards = new PersistentUnorderedMap<string, RewardsForUser>("r");
const gameRewardsState = new PersistentUnorderedMap<string, GameRewardsState>("g");

export function getPlayers(): Array<Player> { return players.values(); };
export function getAvatars(): Array<ChainAvatarsForUser> { return avatars.values(); };
export function getOrders(): Array<Array<OrderForUser>> { return orders.values(); };
export function getGameRewardsState(): Array<GameRewardsState> { return gameRewardsState.values() };

export function initContract(wordsList: string, mintCount: u32): void {
  assert(context.predecessor == OWN, "Must be owner.");
  storage.set<Game>("game", new Game(mintCount, wordsList))
};

export function initPlayerRewards(): void {
  assert(context.predecessor == OWN, "Must be owner.");

  let all_players = players.values();
  for (var i = 0; i < all_players.length; i++) {
    all_players[i].resetRewardsAfterWithdrawal();
    players.set(all_players[i].address, all_players[i]);
  }
};

export function setWordList(wordsIpfsLocation: string): void { // Must Run first to initiatize contract
  assert(context.predecessor == OWN, "Must be owner.");
  let game = storage.get<Game>("game");
  if (game != null) {
    game.updateWordsList(wordsIpfsLocation);
  }
};

export function setWithdrawalFee(_fee: string): void {
  assert(context.predecessor == OWN, "Must be owner.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setWithdrawalFee(u128.from(_fee));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};
export function setRoyalty(_royalty: string): void {
  assert(context.predecessor == OWN, "Must be owner.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setRoyalty(u128.from(_royalty));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};
export function setPayRate(_pay_rate: string): void {
  assert(context.predecessor == OWN, "Must be owner");

  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setPayRate(u128.from(_pay_rate));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
}

export function modifyRewardStates(_minimum_balance: string, _pay_rate: string, _minimum_withdrawal_amount: string, _withdrawal_fee: string): void {
  assert(context.predecessor == OWN, "Must be owner");

  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state == null) {
    let MINIMUM_BALANCE = u128.from("25000000000000000000000000");
    let PAY_RATE = u128.from("20000000000000000000");
    let MININMUM_WITHDRAWAL_AMOUNT = u128.from("1000000000000000000000");
    let WITHDRAWAL_FEE = u128.from("10000000000000000000000");
    gameRewardsState.set("gameRewardsState", new GameRewardsState(MINIMUM_BALANCE, PAY_RATE, MININMUM_WITHDRAWAL_AMOUNT, WITHDRAWAL_FEE));
  } else {
    reward_state.updateRewardsState(u128.from(_minimum_balance), u128.from(_pay_rate), u128.from(_minimum_withdrawal_amount), u128.from(_withdrawal_fee));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
}

export function depositForRewards(): void {
  let value = context.attachedDeposit;
  let reward_state = gameRewardsState.get("gameRewardsState");
  assert(reward_state != null, "Reward state was null.");
  if (reward_state != null) {
    reward_state.increaseEligibleRewards(value);
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function withdrawRewards(): void {
  let thisPlayer = players.get(context.predecessor);
  assert(thisPlayer != null, "Player was null.");
  if (thisPlayer != null) {
    let reward_state = gameRewardsState.get("gameRewardsState");
    assert(reward_state != null, "Reward state was null.");

    if (reward_state != null) {
      let amountToWithdraw = thisPlayer.rewards;
      assert(amountToWithdraw >= reward_state.minimumWithdrawalAmount, "Must be greater than minimum.");
      //assert(u128.sub(reward_state.currentEligibleRewards, amountToWithdraw) >= u128.from("0"), "Remaining would be greater than 0. This shouldn't theoretically happen.");
      //MUST ASSERT BALANCE OF ACTUAL CONTRACT AFTER SUBTRACTION IS >=0 MINIMUM BALANCE.
      thisPlayer.resetRewardsAfterWithdrawal();
      players.set(context.predecessor, thisPlayer);

      ContractPromiseBatch.create(context.predecessor).transfer(amountToWithdraw);
    }
  }
};

export function moderatorRemoveAvatar(_username: string, _avatarIndex: u32): boolean {
  assert(context.predecessor == OWN, "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.removeThisAvatar(_avatarIndex);
    avatars.set(_username, getSpecificAvatarsOfUser);
    let game = storage.get<Game>("game");
    if (game != null) {
      game.decreaseAvatarMintCount();
      storage.set("game", game);
    }
    return true;
  } else {
    return false;
  }
};

export function mintAvatar(incomingAvatarData: string, description: string): void {

  assert(<i32>description.length < MAX_DESC, "Description max size");
  let value = context.attachedDeposit;
  assert(value >= PRICE, "Price mismatch.");

  let game = storage.get<Game>("game");

  if (game != null) {
    assert(game.avatarMintCount + 1 <= MAX_AVATARS, "Max avatar count reached.");
    let tryMyAvatars = avatars.get(context.predecessor);

    if (tryMyAvatars == null) {
      let newChainAvatarsForUser = new ChainAvatarsForUser(game.avatarMintCount + 1, context.predecessor, incomingAvatarData, description, 1, 0);
      avatars.set(context.predecessor, newChainAvatarsForUser);
    } else {
      tryMyAvatars.addNewAvatarForThisPlayer(game.avatarMintCount + 1, incomingAvatarData, description, 1, 0);
      avatars.set(context.predecessor, tryMyAvatars);
    }
    game.increaseAvatarMintCount();
    storage.set("game", game);
  } else {
    logging.log("Game was null");
  }
};

export function getWordsList(): string | null {
  let game = storage.get<Game>("game");
  if (game != null) {
    return game.wordsList;
  } else {
    return "";
  }
};

export function getAvatarMintCount(): u32 {
  let game = storage.get<Game>("game");
  if (game != null) {
    return game.avatarMintCount;
  } else {
    return -1;
  }
};

export function getLevelWords(level: u32): Array<u32> {

  const resultList: Array<u32> = [];
  const rng = new RNG<u32>(1, 300);

  let size = 5;
  if (level == 2) {
    size = 7;
  } else if (level == 3) {
    size = 10;
  } else if (level == 4) {
    size = 15;
  } else if (level == 5) {
    size = 20;
  } else if (level >= 6) {
    size = 25;
  }
  for (let i = 0; i < size; i++) {
    resultList[i] = rng.next();
  }

  return resultList;
}

export function updateLevel(level: u32): void {
  let avatar = avatars.get(context.predecessor);
  assert(avatar != null, "Must own an avatar to play.");
  let thisPlayer = players.get(context.predecessor);

  if (thisPlayer == null) {
    assert(level == 1, "l");
    players.set(context.predecessor, new Player(0, 0, 1, context.predecessor))
  } else {
    if (level != 1) {
      assert(level == thisPlayer.previousLevelCompleted + 1, "Must go in order of levels.");
    }
    thisPlayer.updateLevel(level);
    players.set(context.predecessor, thisPlayer);
  }
};

export function submitLastLevelPlayed(level: u32, wpm: u32, accuracy: u32, correctCount: u32, _avatarIndex: u32): Player | null {
  assert(<i32>wpm < MAX_WPM, "max wpm");
  assert(<i32>accuracy <= MAX_ACCURACY, "max accuracy");

  let thisPlayer = players.get(context.predecessor);

  if (thisPlayer == null) {
    logging.log("Player was null here, when it should never be.");
  } else {

    assert((level == (thisPlayer.previousLevelCompleted)), "Must submit the previous level.");
    thisPlayer.updatePreviousLevelCompleted(wpm, accuracy);
    //assert(checkingValidSubmission == true, "was not a valid pass of the level");
    let game_rewards_state = gameRewardsState.get("gameRewardsState");
    assert(game_rewards_state != null, "Reward state was null.");

    if (game_rewards_state != null) {
      let amountInQuestion = u128.mul(u128.from(correctCount.toString()), game_rewards_state.payRate);
      if (game_rewards_state.currentEligibleRewards == u128.from("0")) {
        logging.log("Eligible rewards are 0. Skipping to allow stats leveling up.")
      } else if (amountInQuestion > game_rewards_state.currentEligibleRewards) {
        logging.log("Subtraction is negative - Give remainder to user.");
        thisPlayer.increaseRewards(game_rewards_state.currentEligibleRewards);
        game_rewards_state.reduceEligibleRewards(game_rewards_state.currentEligibleRewards);
        gameRewardsState.set("gameRewardsState", game_rewards_state);
      } else {
        logging.log("applying increase + reduction for rewards.");
        thisPlayer.increaseRewards(amountInQuestion);
        game_rewards_state.reduceEligibleRewards(amountInQuestion);
        gameRewardsState.set("gameRewardsState", game_rewards_state);
      }
    }

    let myAvatars = avatars.get(context.predecessor);
    thisPlayer.updateLevel(level);

    if (myAvatars != null) {
      myAvatars.setHighestLevel(_avatarIndex, level);
      myAvatars.increaseCorrectWords(_avatarIndex, correctCount);
      avatars.set(context.predecessor, myAvatars);
    }

    players.set(context.predecessor, thisPlayer);
  }

  return thisPlayer;
};

export function getLastLevelPlayed(): u32 {
  let thisPlayer = players.get(context.predecessor);
  if (thisPlayer != null) {
    return thisPlayer.previousLevelCompleted
  } else {
    return 0;
  }
};

export function sendDonations(_amountInNear: u128): void {
  assert(context.predecessor == OWN, "o");
  ContractPromiseBatch.create(DAO).transfer(_amountInNear);
};

export function updateAvatarDescription(_avatarIndex: u32, _description: string): void {
  assert(<i32>_description.length < MAX_DESC, "d")
  let myAvatars = avatars.get(context.predecessor);
  if (myAvatars != null) {
    myAvatars.updateDescription(_avatarIndex, _description);
    avatars.set(context.predecessor, myAvatars);
  }
};

export function importAvatar(addressForOwner: string, incomingAvatarData: string, description: string, level: u32, correctWords: u32): void {
  assert(context.predecessor >= OWN, "o");
  assert(description.length < MAX_DESC, "d");

  let thisAvatar = avatars.get(addressForOwner);
  if (thisAvatar == null) {
    let game = storage.get<Game>("game");
    if (game != null) {
      assert(game.avatarMintCount + 1 <= MAX_AVATARS, "Max avatar count reached.");
      let newChainAvatarsForUser = new ChainAvatarsForUser(game.avatarMintCount + 1, addressForOwner, incomingAvatarData, description, level, correctWords);
      avatars.set(addressForOwner, newChainAvatarsForUser);

      game.increaseAvatarMintCount();
      storage.set("game", game);
    }
  }
}

export function setForSale(_avatarId: u32, price: string): void {
  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars to sell.");

  if (myAvatars != null) {
    assert(myAvatars.isOwnedByMe(_avatarId), "This is not owned by you.");
  }

  let theseOrders = orders.get(context.predecessor);

  if (theseOrders == null) {
    let newOrder = new OrderForUser(_avatarId);
    newOrder.setItemForSale(u128.from(price));
    orders.set(context.predecessor, [newOrder]);
  } else {
    let isFound = false;
    for (var i = 0; i < theseOrders.length; i++) {
      if (theseOrders[i].avatarId == _avatarId) {
        isFound = true;
        assert(theseOrders[i].avatarId != _avatarId, "This item is already for sale.");
      }
    }

    if (!isFound) {
      let newOrderMultiples = new OrderForUser(_avatarId);
      newOrderMultiples.setItemForSale(u128.from(price));
      theseOrders.push(newOrderMultiples);
      orders.set(context.predecessor, theseOrders);
    }
  }
};

export function updateForSale(_avatarId: u32, isForSale: boolean, price: string): void {
  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars to sell.");

  if (myAvatars != null) {
    assert(myAvatars.isOwnedByMe(_avatarId), "This is not owned by you.");
  }

  let theseOrders = orders.get(context.predecessor);
  if (theseOrders == null) {
    assert(theseOrders != null, "There are no orders for this user to update.");
  } else {
    for (var i = 0; i < theseOrders.length; i++) {
      if (theseOrders[i].avatarId == _avatarId) {
        theseOrders[i].updateItemForSale(isForSale, u128.from(price));
        orders.set(context.predecessor, theseOrders);
        break;
      }
    }
  }
};

export function removeListing(_avatarId: u32): void {
  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars to sell.");

  if (myAvatars != null) {
    assert(myAvatars.isOwnedByMe(_avatarId), "This is not owned by you.");
  }

  let theseOrders = orders.get(context.predecessor);
  if (theseOrders == null) {
    assert(theseOrders != null, "There are no orders for this user to update.");
  } else {
    for (var i = 0; i < theseOrders.length; i++) {
      if (theseOrders[i].avatarId == _avatarId) {
        theseOrders.splice(i, 1);
        orders.set(context.predecessor, theseOrders);
        break;
      }
    }
  }
};

export function buySomeAvatar(addressOfTrueOwner: string, _avatarIdToBuy: u32): void {
  let myAvatars = avatars.get(context.predecessor);

  if (myAvatars != null) {
    assert(!myAvatars.isOwnedByMe(_avatarIdToBuy), "This is already owned by you!");
  }


  let ownersAvatars = avatars.get(addressOfTrueOwner);
  assert(ownersAvatars != null, "Something went wrong, this avatar doesn't exist for the true owner.");
  let thisOwnersAvatarIndex = -1;

  if (ownersAvatars != null) {
    thisOwnersAvatarIndex = ownersAvatars.getPersonalIndex(_avatarIdToBuy);
    assert(thisOwnersAvatarIndex != -1, "Avatar was not found for the true owner.");
  }

  let valueDeposited = context.attachedDeposit;

  let ordersOfOwner = orders.get(addressOfTrueOwner);
  if (ordersOfOwner == null) {
    assert(ordersOfOwner != null, "There are no orders from this user.");
  } else {
    let found = false;
    for (var i = 0; i < ordersOfOwner.length; i++) {
      if (ordersOfOwner[i].avatarId == _avatarIdToBuy) {
        found = true;
        assert(ordersOfOwner[i].forSale, "Not for sale");
        assert(ordersOfOwner[i].priceForSale == valueDeposited, "Must be the correct amount, funds should return.");

        let reward_state = gameRewardsState.get("gameRewardsState");
        if (reward_state != null) {

          let differenceWithRoyalty = u128.sub(valueDeposited, u128.from(reward_state.marketRoyalty));
          logging.log("Difference with royalty: " + differenceWithRoyalty.toString());
          let valueToSendToTrueOwner = u128.sub(valueDeposited, differenceWithRoyalty);

          if (myAvatars == null) { // Add new avatar to the new owner.
            if (ownersAvatars != null) {
              let newChainAvatarsForUser = new ChainAvatarsForUser(_avatarIdToBuy, context.predecessor, ownersAvatars.datas[thisOwnersAvatarIndex], ownersAvatars.descriptions[thisOwnersAvatarIndex], ownersAvatars.highestLevels[thisOwnersAvatarIndex], ownersAvatars.correctWordTotals[thisOwnersAvatarIndex]);
              avatars.set(context.predecessor, newChainAvatarsForUser);
              ownersAvatars.removeThisAvatar(thisOwnersAvatarIndex);
              avatars.set(addressOfTrueOwner, ownersAvatars);
            }
          } else {
            if (ownersAvatars != null) {
              myAvatars.addNewAvatarForThisPlayer(_avatarIdToBuy, ownersAvatars.datas[thisOwnersAvatarIndex], ownersAvatars.descriptions[thisOwnersAvatarIndex], ownersAvatars.highestLevels[thisOwnersAvatarIndex], ownersAvatars.correctWordTotals[thisOwnersAvatarIndex]);
              avatars.set(context.predecessor, myAvatars);
              ownersAvatars.removeThisAvatar(thisOwnersAvatarIndex);
              avatars.set(addressOfTrueOwner, ownersAvatars);
            }
          }

          ordersOfOwner.splice(i, 1); // Remove this sold item from the old owner's array. Will wait until new owner tries to sell it, to update it's array.
          orders.set(addressOfTrueOwner, ordersOfOwner);
          ContractPromiseBatch.create(addressOfTrueOwner).transfer(valueToSendToTrueOwner);
        }
      }
    }

    assert(found == true, "Unable to purchase this avatar. It was not found for the owner. Funds should return.");
  }
};
