import { context, logging, storage, RNG, u128 } from 'near-sdk-as';
import { CurrentPlayer, AvatarsMinted, Players } from './model';

const CONTRACT_OWNER = "mic.testnet";
const AVATAR_NFT_THRESHOLDS = [250, 500, 750, 1000];
const STAKING_VAULT_THRESHOLDS = [25000, 50000, 75000, 100000];
const ELIGIBLE_WORDS_PER_DAY = [250000, 500000, 750000, 1000000];
const AVATAR_PRICE_128 = new u128(100);
const AVATAR_PRICE = 100;
const MAX_AVATARS = 1000;
const DEVELOPMENT_FUNDING_PERCENT = 0.01; // of withdrawal amount
const COMPOUNDING_INCOME_PERCENT = 0.03; // of withdrawal amount
const NFTS_BUYBACK_AND_BURN_PERCENT = 0.03 / AVATAR_PRICE; //increased price percent to buy back NFTs, per year 0.03 percent AGE_OF_AVATAR;
const MAX_HUMAN_WPM_POSSIBLE = 300;
const MAX_ACCURACY = 100;
let CURRENT_RATE = 34;
let WITHDRAWAL_THRESHOLD = 1;

export function mintAvatar(): boolean {
  let value = context.attachedDeposit;
  if (value != AVATAR_PRICE_128) {
    receiveFundsAndSaveIntoStakingVault();
  } else {
    // create NFT and send the value into staking vault.
    let avatars_minted = storage.get<AvatarsMinted>("avatars-minted");
    if (avatars_minted != null) {
      //MINT NFT!
      avatars_minted.increaseAvatarsMinted();
    }
  }
  //take funds received, and save into staking vault.
  return true;
};

export function ensureUserHasAvatar() : boolean {
  //return true if this user has one or more applicable chain avatar NFTs.
  return true;
};

export function buyBackAndBurnAvatar() : boolean {
  // buys back at a rate of
  // (NFTS_BUYBACK_AND_BURN_PERCENT * AVATAR_PRICE * COMPOUNDED_INCOME_TOTAL) + AVATAR_PRICE
  // must withdrawal this amount from staking vault, wait 3 epochs, then send a transaction to the owner.
  return true
};

export function getAvatarWorth() : u32 {
  //AVATAR_AGE * 0.03 per year * AVATAR_PRICE = AVATAR_WORTH;
  return 1;
};

export function receiveFundsAndSaveIntoStakingVault() : void {
  //receives arbitrary funds to save into staking vault
  //can be used for bootstraping purposes, or donations
  let value = context.attachedDeposit;
};

export function checkAvailableFunds() : void {
  //returns the available balance currently, to calculate current rate per word
  //not needed as this can be done with javascript library.
};

export function initializeAvatarMinting() : boolean {
  let avatars_minted = storage.get<AvatarsMinted>("avatars-minted");

  if (avatars_minted == null) {

    assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may initialize avatars minted.");
    avatars_minted = new AvatarsMinted(0);
    storage.set("avatars-minted", avatars_minted);
    return true;
  }

  return false;
}

export function setRewardRate(_rate: i32) : void {
  assert(context.predecessor == CONTRACT_OWNER, "Only contract owner set reward rate.");
  CURRENT_RATE = _rate;
};

export function setWordList(wordsIpfsLocation: string): void { // Must Run first to initiatize contract
  assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may set words list.");
  storage.set("wordsListIpfs", wordsIpfsLocation);
}

//Must be run at initialization
export function initializePlayers(): boolean {
  let players = storage.get<Players>("players");

  if (players == null) {
    assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may initialize players.");
    let new_players = new Players([],[],[]);
    storage.set("players", new_players);
    return true;
  } else {
    logging.log( 'players is already intialized!')
    return false;
  }
}

export function checkPayEligibleWordsForToday() : u32 { // Must Run first to initiatize contract
    //should return the number of eligible words for today
  let avatars_minted = storage.get<AvatarsMinted>("avatars-minted");
  if (avatars_minted == null) {
    return ELIGIBLE_WORDS_PER_DAY[0];
  } else {
    if (avatars_minted.avatarMintCount <= AVATAR_NFT_THRESHOLDS[0]) {
      return ELIGIBLE_WORDS_PER_DAY[0];
    } else if (avatars_minted.avatarMintCount <= AVATAR_NFT_THRESHOLDS[1]) {
      return ELIGIBLE_WORDS_PER_DAY[1];
    } else if (avatars_minted.avatarMintCount <= AVATAR_NFT_THRESHOLDS[2]) {
      return ELIGIBLE_WORDS_PER_DAY[2];
    } else if (avatars_minted.avatarMintCount <= AVATAR_NFT_THRESHOLDS[3]) {
      return ELIGIBLE_WORDS_PER_DAY[3];
    }
  }
  return ELIGIBLE_WORDS_PER_DAY[0];
};

export function withdrawThisUsersRewards() : void {
 //take this user's rewards and withdraws it
};

export function setWithdrawalThreshold(_withdrawalThreshold: i32): void {
  assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may set withdrawal threshold.");
  //should be set by owner to start at 0.5 N - DEVELOPMENT_FUNDING_PERCENT;
  WITHDRAWAL_THRESHOLD = _withdrawalThreshold;
}
export function getWordsList(): string | null {
  return storage.get<string>("wordsListIpfs");
}

export function getLevelWords(level: u32): Array<u32> {
  const resultList: Array<u32> = [];
  const rng = new RNG<u32>(1, 300);
  let size = 5;
  if (level == 2) {
    size = 10;
  } else if (level == 3) {
    size = 15;
  } else if (level == 4) {
    size = 20;
  } else if (level >= 5) {
    size = 25;
  }
  for (let i = 0; i < size; i++) {
    resultList[i] = rng.next();
  }

  let this_last_level_played = storage.get<CurrentPlayer>(context.predecessor);

  if (this_last_level_played == null) {

    assert(level == 1, "Must begin at first level.");
    let save_new_player = storage.get<Players>("players");
    if (save_new_player == null) {
      logging.log(
        'Must initialize Players first. Failed to save into Players, and last_level_played.'
      )
    } else {
      this_last_level_played = new CurrentPlayer(level, resultList, 0, save_new_player.addresses.length);

      if (!save_new_player.playerExists(context.predecessor)) {
        logging.log("should save new player now!!!");
        save_new_player.saveNewPlayer(context.predecessor, 0, 0)
        storage.set("players", save_new_player);
        //this_last_level_played.updateLevelWithWords(level, resultList);
      } else {
        logging.log("Player already exists! Starting a new game, no need to initialize this player again.");
        //
      }
      //this_last_level_played.updateLevelWithWords(level, resultList);
      storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);
    }
  } else {
    if (level != 1) {
      assert((level == (this_last_level_played.level + 1)), "Must proceed by appropriate levels.");
    }
    this_last_level_played.updateLevelWithWords(level, resultList);
    storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);
  }

  return resultList;
}

export function submitLastLevelPlayed(level: u32, wpm: i64, accuracy: i64, wordsToSubmit: Array<u32>, correctCount: u32): CurrentPlayer | null {
  let this_last_level_played = storage.get<CurrentPlayer>(context.predecessor);
  let players = storage.get<Players>("players");
  if (this_last_level_played == null) {
    //should neve be null here
    assert(level == 1, "Must start at level one.");
  } else {

    /*if (level > 1) {
      assert((level == (this_last_level_played.level+1)), "Must start at first level.");
    }*/

    assert(wpm < MAX_HUMAN_WPM_POSSIBLE, "Are you a robot?");
    assert(accuracy <= MAX_ACCURACY, "Accuracy can't be higher than 100%.");

    let checkingValidSubmission = this_last_level_played.setLastLevelCompleted(level, wpm, accuracy, (this_last_level_played.levelCount + 1), wordsToSubmit);
    assert(checkingValidSubmission == true, "Are you trying to cheat?");

    if (players == null) {
      assert(players != null, "players must not be null.");
    } else {
      logging.log("trying to UPDATE player reward");
      players.updatePlayerReward(context.sender, (CURRENT_RATE * correctCount), correctCount);
      storage.set("players", players);
      storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);

    }

    return this_last_level_played;
  }

  return this_last_level_played;
};

export function getLastLevelPlayed(): CurrentPlayer | null {
  let last_level_played = storage.get<CurrentPlayer>(context.predecessor);
  return last_level_played;
}

export function getThisPlayerAddress(): string {
  let players = storage.get<Players>("players");
  if (players == null) {
    logging.log("Returning null for players");
    return "";
  } else {
    logging.log("Returning the address of this player for : " + context.predecessor);
    return players.getThisPlayerAddress(context.predecessor)
  }
};

export function getThisPlayerRewardsToClaim(): f64 {
  let players = storage.get<Players>("players");
  if (players == null) { return 0; }
  else {
    return players.getThisPlayerRewardsToClaim(context.predecessor)
  }
};

export function getThisPlayerWordCountEligibleForRewards(): u64 {
  let players = storage.get<Players>("players");
  if (players == null) { return 0; }
  else {
    return players.getThisPlayerWordCountEligibleForRewards(context.predecessor)
  }
};

