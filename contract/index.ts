// @nearfile
// Chain Typing Smart Contract Version 3

import { context, logging, storage, u128, ContractPromiseBatch, PersistentUnorderedMap } from 'near-sdk-as';
import { Player, ChainAvatarsForUser, Game, OrderForUser, GameRewardsState } from './model';

const OWN = "mic.near"; // Owner of the contract
const GAME_OWN = "simplegames.near"; // Game owner of the contract
const GAME_SYSTEM = "chaintyping.near"; // Game system which operates the gameFinalityUpdate functionality to save on gas fees

const MAX_AVATARS_ABSOLUTE_LIMIT = <u32>1000; // Hard maximum limit which may never be reached
const MAX_WPM = 300; // Max WPM for anti-cheating
const MAX_ACCURACY = 100; // Max accuracy for anti-cheating
const MAX_DESC = 120; // Max description length for visual fit

const avatars = new PersistentUnorderedMap<string, ChainAvatarsForUser>("a"); // Avatars Map declared in model.ts
const players = new PersistentUnorderedMap<string, Player>("p"); // Players Map declared in model.ts
const orders = new PersistentUnorderedMap<string, Array<OrderForUser>>("o"); // Market Orders Map declared in model.ts
const gameRewardsState = new PersistentUnorderedMap<string, GameRewardsState>("g"); // Game Rewards State Map declared in model.ts

export function getPlayers(start: u32, end: u32): Array<Player> { return players.values(start, end); }; // Returns view function of Players
export function getAvatars(start: u32, end: u32): Array<ChainAvatarsForUser> { return avatars.values(start, end); }; // Returns view function of Avatars
export function getOrders(start: u32, end: u32): Array<Array<OrderForUser>> { return orders.values(start, end); }; // Returns view function of Market Orders
export function getGameRewardsState(): Array<GameRewardsState> { return gameRewardsState.values(0, 1) }; // Returns view function of Game Rewards State

export function initContract(mintCount: u32): void {
  // Used for initializing the contract, contained by the owner and game owner of the contract

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner.");
  storage.set<Game>("game", new Game(mintCount))
};

export function initPlayerRewards(): void {
  // Used for initializing the contract, contained by the owner and game owner of the contract

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner.");

  let all_players = players.values();
  for (var i = 0; i < all_players.length; i++) {
    all_players[i].resetRewardsAfterWithdrawal();
    players.set(all_players[i].address, all_players[i]);
  }
};


export function setWithdrawalFee(_fee: string): void {
  // Allows modifying the withdrawal fee if needing to update depending on market conditions

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setWithdrawalFee(u128.from(_fee));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function setMinimumWithdrawalAmount(_amount: string): void {
  // Allows modifying the minimum withdrawal amount, to prevent very small withdrawals, initialized in the constructor in model.ts

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setMinimumWithdrawalAmount(u128.from(_amount));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function setRoyalty(_royalty: string): void {
  // Allows modifying the royalty for market orders, which is a fixed rate, initialized in the constructor in model.ts

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setRoyalty(u128.from(_royalty));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function setPayRate(_pay_rate: string): void {
  // Allows modifying the per word pay rate, initialized in the constructor in model.ts

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner");
  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state != null) {
    reward_state.setPayRate(u128.from(_pay_rate));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function modifyRewardStates(_minimum_balance: string, _pay_rate: string, _minimum_withdrawal_amount: string, _withdrawal_fee: string): void {
  // Allows modifying the gameRewardState based on input parameters

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN));

  let reward_state = gameRewardsState.get("gameRewardsState");
  if (reward_state == null) {

    gameRewardsState.set("gameRewardsState", new GameRewardsState());
  } else {
    reward_state.updateRewardsState(u128.from(_pay_rate), u128.from(_minimum_withdrawal_amount), u128.from(_withdrawal_fee));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
}

export function depositForRewards(): void {
  // Allows depositing to be used as gameplay rewards

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Only owner may replenish deposits for game.");
  let value = context.attachedDeposit;

  let reward_state = gameRewardsState.get("gameRewardsState");
  assert(reward_state != null, "Reward state was null.");
  if (reward_state != null) {
    reward_state.increaseEligibleRewards(u128.from(value));
    gameRewardsState.set("gameRewardsState", reward_state);
  }
};

export function reduceEligibleRewards(value: string): void {
  // Allows manually reducing eligible rewards of the game state

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Only owner may reduce availibility for game.");
  let reward_state = gameRewardsState.get("gameRewardsState");
  assert(reward_state != null, "Reward state was null.");
  if (reward_state != null) {
    reward_state.reduceEligibleRewards(u128.from(value));
    gameRewardsState.set("gameRewardsState", reward_state);
  }

}

export function withdrawRewards(): void {
  // Withdrawal capability which checks for satisfactory allowance and takes reduction of the game state for the player, including the withdrawal fee

  let thisPlayer = players.get(context.predecessor);

  assert(thisPlayer != null, "Player was null.");
  if (thisPlayer != null) {
    let reward_state = gameRewardsState.get("gameRewardsState");
    assert(reward_state != null, "Reward state was null.");

    if (reward_state != null) {
      let amountToWithdraw = thisPlayer.rewards;
      let differenceToWithdraw = u128.sub(thisPlayer.rewards, reward_state.withdrawalFee);
      assert(amountToWithdraw >= reward_state.minimumWithdrawalAmount, "Must be greater than minimum.");
      thisPlayer.resetRewardsAfterWithdrawal();
      players.set(context.predecessor, thisPlayer);

      reward_state.increaseTotalPaidOut(differenceToWithdraw)
      reward_state.increaseTotalFeesEarned(reward_state.withdrawalFee);
      gameRewardsState.set("gameRewardsState", reward_state);

      ContractPromiseBatch.create(context.predecessor).transfer(differenceToWithdraw);
    }
  }
};

export function moderatorRemoveAvatar(_username: string, _avatarIndex: u32): boolean {
  // Moderator function in event of needing to remove a character, should never need to be used

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.removeThisAvatar(_avatarIndex);
    avatars.set(_username, getSpecificAvatarsOfUser);
    return true;
  } else {
    return false;
  }
};
export function moderatorResetBlockList(_username: string): void {
  // Moderator function to reset the block list completely

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.resetBlockList();
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
};
export function moderatorResetBanList(_username: string): void {
  // Moderator function to reset the ban list completely

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.resetBanList();
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
};


export function moderatorBlockListAvatar(_username: string, _avatarIndex: u32): void {
  // Moderator function in event of needing to block a character's drawing temporarily, this will prompt on the frontend that it requires updating to the drawing to automatically unblock

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.setIsBlockList(_avatarIndex);
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
};

export function moderatorBanAvatar(_username: string, _avatarIndex: u32): void {
  // Moderator function to temporarily ban a character, this is in the event for anti-cheating, hopefully never needs to be used

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.setIsBanned(_avatarIndex);
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
};

export function moderatorRemoveBan(_username: string, _avatarIndex: u32): void {
  // Moderator function to remove ban on character

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.removeIsBanned(_avatarIndex);
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
};

export function moderatorRemoveListing(_username: string, _avatarId: u32): void {
  // Moderator function to manually remove a listing, in the event of some conflict with a blocked or banned character being on the market

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove listings from user.");

  let theseOrders = orders.get(_username);
  if (theseOrders == null) {
    assert(theseOrders != null, "There are no orders for this user to update.");
  } else {
    for (var i = 0; i < theseOrders.length; i++) {
      logging.log("One order with id: " + theseOrders[i].avatarId.toString());
      if (theseOrders[i].avatarId == _avatarId) {
        logging.log("Splicing this order");
        theseOrders.splice(i, 1);
        orders.set(_username, theseOrders);
        break;
      }
    }
  }
};

export function moderatorChangeDescription(_username: string, _avatarIndex: u32, _newDescription: string): void {
  // Moderator function to change a description of a character

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate descriptions.");
  let getSpecificAvatarsOfUser = avatars.get(_username);
  if (getSpecificAvatarsOfUser != null) {
    getSpecificAvatarsOfUser.updateDescription(_avatarIndex, _newDescription);
    avatars.set(_username, getSpecificAvatarsOfUser);
  }
}

export function setAvatarPrice(_price: string): void {
  // Moderator function to update character creation donation cost

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to set avatar price.");
  let game_rewards_state = gameRewardsState.get("gameRewardsState");
  if (game_rewards_state != null) {
    game_rewards_state.setAvatarPrice(u128.from(_price));
    gameRewardsState.set("gameRewardsState", game_rewards_state);
  }
}

export function setMaxAvatars(_amount: u32): void {
  // Moderator function to increase the amount of characters able to be minted by donation

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "Must be owner to moderate and remove avatar from user.");
  let game_rewards_state = gameRewardsState.get("gameRewardsState");
  if (game_rewards_state != null) {
    game_rewards_state.setMaxAvatars(_amount);
    gameRewardsState.set("gameRewardsState", game_rewards_state);
  }
}

export function mintAvatar(incomingAvatarData: string, description: string): u32 {
  // Open function to create a character, this checks to make sure the amount of characters never exceeds the hard limit, as well as to ensure proper donation price match
  // The game supports a player owning multiple characters, and keeps them in ChainAvatarForUser

  let game_rewards_state = gameRewardsState.get("gameRewardsState");
  assert(game_rewards_state != null, "Game rewards state was null.");

  assert(<i32>description.length < MAX_DESC, "Description max size");

  let game = storage.get<Game>("game");

  if (game != null && game_rewards_state != null) {
    let value = context.attachedDeposit;
    assert(value >= game_rewards_state.avatarPrice, "Price mismatch.");

    assert(((game.avatarMintCount + 1 <= game_rewards_state.maxAvatars) && (game.avatarMintCount <= MAX_AVATARS_ABSOLUTE_LIMIT)), "Max avatar count reached.");
    let tryMyAvatars = avatars.get(context.predecessor);

    if (tryMyAvatars == null) {
      let newChainAvatarsForUser = new ChainAvatarsForUser(game.avatarMintCount + 1, context.predecessor, incomingAvatarData, description, 1, 0);
      avatars.set(context.predecessor, newChainAvatarsForUser);

    } else {
      tryMyAvatars.addNewAvatarForThisPlayer(game.avatarMintCount + 1, incomingAvatarData, description, 1, 0);
      avatars.set(context.predecessor, tryMyAvatars);
    }

    let thisPlayer = players.get(context.predecessor);
    if (thisPlayer == null) {
      players.set(context.predecessor, new Player(0, 0, 1, context.predecessor, context.blockIndex))
    }

    game.increaseAvatarMintCount();
    storage.set("game", game);
    return (game.avatarMintCount + 1);
  } else {
    return -1;
  }

};

export function getAvatarMintCount(): u32 {
  // View function to get the current minting count

  let game = storage.get<Game>("game");
  if (game != null) {
    return game.avatarMintCount;
  } else {
    return -1;
  }
};


export function gameFinalityUpdate(addressToAdjust: string, previousLevelCompleted: u32, previousWpm: u32, previousAccuracy: u32, correctCount: u32, _avatarIndex: u32): void {
  // Special function only able to be used by the game system, which checks various conditions for blocks or bans, as well as some basic anti-cheating
  // It saves all the progress of game play for that character, as well as player details, then performs required earnings increase taken from the available game rewards

  assert((context.predecessor == GAME_SYSTEM), "o");

  assert(<i32>previousWpm < MAX_WPM, "max wpm");
  assert(<i32>previousAccuracy <= MAX_ACCURACY, "max accuracy");

  let myAvatars = avatars.get(addressToAdjust);
  assert(myAvatars != null, "Must own an avatar to play.");

  if (myAvatars != null) {
    assert(!myAvatars.isOnBlockList(_avatarIndex), "Unable to set game finality when on block list.");
    assert(!myAvatars.isOnBanned(_avatarIndex), "Unable to set game finality when banned.");
  }

  let thisPlayer = players.get(addressToAdjust);

  if (thisPlayer == null) {
    logging.log("Player was null here, when it should never be.");
  } else {

    thisPlayer.updatePreviousLevelCompleted(previousWpm, previousAccuracy);
    thisPlayer.updateBlockIndex(context.blockIndex);

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

    thisPlayer.updateLevel(previousLevelCompleted);

    if (myAvatars != null) {
      myAvatars.setHighestLevel(_avatarIndex, previousLevelCompleted);
      myAvatars.increaseCorrectWords(_avatarIndex, correctCount);
      avatars.set(addressToAdjust, myAvatars);
    }

    players.set(addressToAdjust, thisPlayer);
  }

  //return thisPlayer;
}


export function getLastLevelPlayed(): u32 {
  // View function to get the last level played by the player

  let thisPlayer = players.get(context.predecessor);
  if (thisPlayer != null) {
    return thisPlayer.previousLevelCompleted
  } else {
    return 0;
  }
};

export function sendDonations(_amountInNear: u128): void {
  // Method to send specified donation amount back to the game funds

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "o");
  ContractPromiseBatch.create(GAME_OWN).transfer(_amountInNear);
};

export function updateAvatarDescription(_avatarIndex: u32, _description: string): void {
  // Method for a player to update a specific character's description, based on the conditions allowed and reducing a fee to do so

  assert(<i32>_description.length < MAX_DESC, "d")
  let myAvatars = avatars.get(context.predecessor);
  let myPlayer = players.get(context.predecessor);
  let game_rewards_state = gameRewardsState.get("gameRewardsState");

  if (myPlayer != null && game_rewards_state != null) {
    assert(myPlayer.rewards >= game_rewards_state.actionFee, "Must satisfy the fee of 0.01 N.");

    if (myPlayer.rewards >= game_rewards_state.actionFee) {
      myPlayer.reduceRewards(game_rewards_state.actionFee);
      game_rewards_state.increaseTotalFeesEarned(game_rewards_state.actionFee);

      if (myAvatars != null) {
        myAvatars.updateDescription(_avatarIndex, _description);
        avatars.set(context.predecessor, myAvatars);
        players.set(context.predecessor, myPlayer);
        gameRewardsState.set("gameRewardsState", game_rewards_state);
      }
    }
  }
};

export function updateAvatarCharacter(_avatarIndex: u32, incomingAvatarData: string): void {
  // Method for a player to update a character's drawing completely, taking into consideration a fee to do so

  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars.");

  let myPlayer = players.get(context.predecessor);
  let game_rewards_state = gameRewardsState.get("gameRewardsState");

  if (myPlayer != null && game_rewards_state != null) {
    logging.log("Checking satisfy fee");
    assert(myPlayer.rewards >= game_rewards_state.updateCharacterFee, "Must satisfy the fee of 0.02 N.");
    myPlayer.reduceRewards(game_rewards_state.updateCharacterFee);
    game_rewards_state.increaseTotalFeesEarned(game_rewards_state.updateCharacterFee);

    if (myAvatars != null) {
      myAvatars.updateCharacter(_avatarIndex, incomingAvatarData);
      myAvatars.removeIsBlockList(_avatarIndex);
      logging.log("updated character");
      avatars.set(context.predecessor, myAvatars);
      players.set(context.predecessor, myPlayer);
      gameRewardsState.set("gameRewardsState", game_rewards_state);
    }

  }

};

export function importAvatar(addressForOwner: string, incomingAvatarData: string, description: string, level: u32, correctWords: u32): void {
  // Method for owners to import a character manually. This function may only need to be used in the event of a full new deployment and manually importing all characters back to their owners.

  assert((context.predecessor == OWN || context.predecessor == GAME_OWN), "o");
  assert(description.length < MAX_DESC, "d");

  let thisAvatar = avatars.get(addressForOwner);
  if (thisAvatar == null) {
    let game = storage.get<Game>("game");
    let game_rewards_state = gameRewardsState.get("gameRewardsState");
    if (game != null && game_rewards_state != null) {
      assert(((game.avatarMintCount + 1 <= game_rewards_state.maxAvatars) && (game.avatarMintCount <= MAX_AVATARS_ABSOLUTE_LIMIT)), "Max avatar count reached.");
      let newChainAvatarsForUser = new ChainAvatarsForUser(game.avatarMintCount + 1, addressForOwner, incomingAvatarData, description, level, correctWords);
      avatars.set(addressForOwner, newChainAvatarsForUser);

      game.increaseAvatarMintCount();
      storage.set("game", game);


      let thisPlayer = players.get(context.predecessor);
      if (thisPlayer == null) {
        players.set(context.predecessor, new Player(0, 0, 1, context.predecessor, context.blockIndex))
      }

    }
  } else {
    let game = storage.get<Game>("game");
    let game_rewards_state = gameRewardsState.get("gameRewardsState");
    if (game != null && game_rewards_state != null) {
      assert(((game.avatarMintCount + 1 <= game_rewards_state.maxAvatars) && (game.avatarMintCount <= MAX_AVATARS_ABSOLUTE_LIMIT)), "Max avatar count reached.");
      thisAvatar.addNewAvatarForThisPlayer(game.avatarMintCount + 1, incomingAvatarData, description, level, correctWords);
      avatars.set(addressForOwner, thisAvatar);

      game.increaseAvatarMintCount();
      storage.set("game", game);
    }
  }
}

export function setForSale(_avatarId: u32, price: string): void {
  // Method for a player to set a character on the market, this checks to ensure validity of the market order, and puts the character as an OrderForUser
  // This allows other players to buy a character which is an order directly from another user, where the game takes a fixed royalty

  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars to sell.");

  if (myAvatars != null) {
    assert(myAvatars.isOwnedByMe(_avatarId), "This is not owned by you.");
    let thisIndex = myAvatars.getPersonalIndex(_avatarId);
    logging.log("personal index is: " + thisIndex.toString());
    assert(!myAvatars.isOnBlockList(thisIndex), "Unable to create order when on block list.");
    assert(!myAvatars.isOnBanned(thisIndex), "Unable to create order when banned.");
  }

  let myPlayer = players.get(context.predecessor);
  let theseOrders = orders.get(context.predecessor);
  let game_rewards_state = gameRewardsState.get("gameRewardsState");
  if (theseOrders == null) {
    if (myPlayer != null && game_rewards_state != null) {
      assert(myPlayer.rewards >= game_rewards_state.actionFee, "Must satisfy the fee of 0.01 N.");
      if (myPlayer.rewards >= game_rewards_state.actionFee) {
        myPlayer.reduceRewards(game_rewards_state.actionFee);
        game_rewards_state.increaseTotalFeesEarned(game_rewards_state.actionFee);
        players.set(context.predecessor, myPlayer);

        let newOrder = new OrderForUser(_avatarId);
        newOrder.setItemForSale(u128.from(price));
        orders.set(context.predecessor, [newOrder]);
        gameRewardsState.set("gameRewardsState", game_rewards_state);
      }
    }

  } else {
    let isFound = false;
    for (var i = 0; i < theseOrders.length; i++) {
      if (theseOrders[i].avatarId == _avatarId) {
        isFound = true;
        assert(theseOrders[i].avatarId != _avatarId, "This item is already for sale.");
      }
    }

    if (!isFound) {
      if (myPlayer != null && game_rewards_state != null) {
        assert(myPlayer.rewards >= game_rewards_state.actionFee, "Must satisfy the fee of 0.01 N.");
        if (myPlayer.rewards >= game_rewards_state.actionFee) {
          myPlayer.reduceRewards(game_rewards_state.actionFee);
          game_rewards_state.increaseTotalFeesEarned(game_rewards_state.actionFee);
          players.set(context.predecessor, myPlayer);


          let newOrderMultiples = new OrderForUser(_avatarId);
          newOrderMultiples.setItemForSale(u128.from(price));
          theseOrders.push(newOrderMultiples);
          orders.set(context.predecessor, theseOrders);
          gameRewardsState.set("gameRewardsState", game_rewards_state);

        }
      }

    }
  }
};

export function updateForSale(_avatarId: u32, isForSale: boolean, price: string): void {
  // Method for a player to update the cost at which the market order is set at

  let myAvatars = avatars.get(context.predecessor);
  assert(myAvatars != null, "You don't have any avatars to sell.");

  let myPlayer = players.get(context.predecessor);
  let game_rewards_state = gameRewardsState.get("gameRewardsState");
  if (myPlayer != null && game_rewards_state != null) {
    assert(myPlayer.rewards >= game_rewards_state.actionFee, "Must satisfy the fee of 0.01 N.");

    if (myAvatars != null) {
      assert(myAvatars.isOwnedByMe(_avatarId), "This is not owned by you.");
      let thisIndex = myAvatars.getPersonalIndex(_avatarId);
      assert(!myAvatars.isOnBlockList(thisIndex), "Unable to create order when on block list.");
      assert(!myAvatars.isOnBanned(thisIndex), "Unable to create order when banned.");
    }

    let theseOrders = orders.get(context.predecessor);
    if (theseOrders == null) {
      assert(theseOrders != null, "There are no orders for this user to update.");
    } else {
      for (var i = 0; i < theseOrders.length; i++) {
        if (theseOrders[i].avatarId == _avatarId) {
          if (myPlayer.rewards >= game_rewards_state.actionFee) {
            myPlayer.reduceRewards(game_rewards_state.actionFee);
            game_rewards_state.increaseTotalFeesEarned(game_rewards_state.actionFee);
            theseOrders[i].updateItemForSale(isForSale, u128.from(price));
            orders.set(context.predecessor, theseOrders);
            gameRewardsState.set("gameRewardsState", game_rewards_state);
            break;
          }
        }
      }
    }

  }

};

export function removeListing(_avatarId: u32): void {
  // Method for a player to remove an order listing

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
  // Function that allows another player to buy a character which is listed as an Order
  // It checks to ensure validity of the order, as well as ensure price matching and takes a royalty
  // This sends the amount of near to the owner of owner of the character who owns the Order

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
    assert(!ownersAvatars.isOnBlockList(thisOwnersAvatarIndex), "Unable to buy order when item is on block list.");
    assert(!ownersAvatars.isOnBanned(thisOwnersAvatarIndex), "Unable to buy order when item is banned.");
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
          let valueToSendToTrueOwner = differenceWithRoyalty;

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

          let thisPlayer = players.get(context.predecessor);
          if (thisPlayer == null) {
            players.set(context.predecessor, new Player(0, 0, 1, context.predecessor, context.blockIndex))
          }

          ordersOfOwner.splice(i, 1); // Remove this sold item from the old owner's array. Will wait until new owner tries to sell it, to update it's array.
          orders.set(addressOfTrueOwner, ordersOfOwner);
          reward_state.increaseTotalFeesEarned(reward_state.marketRoyalty);
          reward_state.increaseMarketVolume(differenceWithRoyalty);
          gameRewardsState.set("gameRewardsState", reward_state);
          ContractPromiseBatch.create(addressOfTrueOwner).transfer(valueToSendToTrueOwner);
        }
      }
    }

    assert(found == true, "Unable to purchase this avatar. It was not found for the owner. Funds should return.");
  }
};
