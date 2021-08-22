import { context, logging, storage, RNG, u128, ContractPromiseBatch } from 'near-sdk-as';
import { CurrentPlayer, ChainAvatars, Players } from './model';

const CONTRACT_OWNER = "mic.testnet";
const AVATAR_PRICE = new u128(1);
const MAX_AVATARS = 100;
const MAX_HUMAN_WPM_POSSIBLE = 300;
const MAX_ACCURACY = 100;
const MAX_DESCRIPTION_CHARS = 120;

export function initializeAvatarMinting(): boolean {
  let chain_avatars = storage.get<ChainAvatars>("avatars-minted");

  if (chain_avatars == null) {
    assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may initialize avatars minted.");
    chain_avatars = new ChainAvatars(0, [], [], [], [], []);
    storage.set("avatars-minted", chain_avatars);
    return true;
  }

  return false;
};

export function mintAvatar(incomingAvatarData: string, description: string): void {
  let value = <u128>context.attachedDeposit;
  assert(value >= AVATAR_PRICE, "Must be the at least the minimum price of the avatar.");
  let chain_avatars = storage.get<ChainAvatars>("avatars-minted");
  if (chain_avatars != null) {
    assert(<i32>chain_avatars.avatarMintCount + 1 <= MAX_AVATARS, "All chain avatars are already minted.");
    assert(description.length < MAX_DESCRIPTION_CHARS, "Description can only be a maximum" + MAX_DESCRIPTION_CHARS.toString());
    chain_avatars.increaseAvatarsMinted(context.predecessor, incomingAvatarData, description);
    storage.set("avatars-minted", chain_avatars);
  }
};

export function setWordList(wordsIpfsLocation: string): void { // Must Run first to initiatize contract
  assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may set words list.");
  storage.set("wordsListIpfs", wordsIpfsLocation);
}

export function initializePlayers(): boolean {
  let players = storage.get<Players>("players");

  if (players == null) {
    assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may initialize players.");
    let new_players = new Players([], [], [], [], []);
    storage.set("players", new_players);
    return true;
  } else {
    return false;
  }
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
    } else {
      this_last_level_played = new CurrentPlayer(level, resultList, 0, save_new_player.addresses.length);

      if (!save_new_player.playerExists(context.predecessor)) {
        save_new_player.saveNewPlayer(context.predecessor, 0, 0, 0, 0)
        storage.set("players", save_new_player);
      } else {
        logging.log("Player already exists! Starting a new game, no need to initialize this player again.");
        //
      }
      storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);
    }
  } else {
    this_last_level_played.updateLevelWithWords(level, resultList);
    storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);
  }

  return resultList;
}

export function submitLastLevelPlayed(level: u32, wpm: i64, accuracy: i64, wordsToSubmit: Array<u32>, correctCount: u32, _avatarIndex: u32): CurrentPlayer | null {
  let this_last_level_played = storage.get<CurrentPlayer>(context.predecessor);
  let players = storage.get<Players>("players");
  if (this_last_level_played == null) {
    assert(level == 1, "Must start at level one.");
  } else {
    /*if (level > 1) {
      assert((level == (this_last_level_played.level+1)), "Must start at first level.");
    }*/
    assert(wpm < MAX_HUMAN_WPM_POSSIBLE, "Are you a robot?");
    assert(accuracy <= MAX_ACCURACY, "Accuracy can't be higher than 100%.");

    let checkingValidSubmission = this_last_level_played.setLastLevelCompleted(level, wpm, accuracy, (this_last_level_played.levelCount), wordsToSubmit);
    assert(checkingValidSubmission == true, "Are you trying to cheat?");

    if (players == null) {
      assert(players != null, "players must not be null.");
    } else {
      let chain_avatars = storage.get<ChainAvatars>("avatars-minted");
      if (chain_avatars != null) {
        players.updateAndReturnHighestLevel(context.predecessor, level);
        players.updateAndReturnWordsTypedCorrectly(context.predecessor, correctCount);

        assert(chain_avatars.isIndexMyAvatar(_avatarIndex, context.predecessor), "Are you trying to set values for someone else's avatar?");

        chain_avatars.setAvatarsLevel(_avatarIndex, level);
        chain_avatars.setAvatarsCorrectWords(_avatarIndex, correctCount);
        storage.set<ChainAvatars>("avatars-minted", chain_avatars);
        storage.set("players", players);

        storage.set<CurrentPlayer>(context.predecessor, this_last_level_played);
      }
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
    return "";
  } else {
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

export function getPlayers(): Players | null {
  let players = storage.get<Players>("players");
  return players;
};

export function getAvatars(): ChainAvatars | null {
  let avatars = storage.get<ChainAvatars>("avatars-minted");
  return avatars;
};

export function sendDonations(_amountInNear: u128): void {
  assert(context.predecessor == CONTRACT_OWNER, "Only contract owner may send donations.");
  ContractPromiseBatch.create(CONTRACT_OWNER).transfer(_amountInNear);
}

export function updateAvatarDescription(_avatarIndex: u32, _description: string): void {
  let chain_avatars = storage.get<ChainAvatars>("avatars-minted");
  if (chain_avatars != null) {
    assert(chain_avatars.isIndexMyAvatar(_avatarIndex, context.predecessor), "Are you trying to set values for someone else's avatar?");
    assert(_description.length < MAX_DESCRIPTION_CHARS, "Description can only be a maximum" + MAX_DESCRIPTION_CHARS.toString())
    chain_avatars.updateDescription(_avatarIndex, _description);
    storage.set<ChainAvatars>("avatars-minted", chain_avatars);
  }
};

export function importAvatar(addressForOwner: string, incomingAvatarData: string, description: string, level: u32, correctWords: u32): void {
  assert(context.predecessor >= CONTRACT_OWNER, "Must be owner to import.");
  let chain_avatars = storage.get<ChainAvatars>("avatars-minted");
  if (chain_avatars != null) {
    assert(<i32>chain_avatars.avatarMintCount + 1 <= MAX_AVATARS, "All chain avatars are already minted.");
    assert(description.length < MAX_DESCRIPTION_CHARS, "Description can only be a maximum" + MAX_DESCRIPTION_CHARS.toString());
    chain_avatars.importAvatar(addressForOwner, incomingAvatarData, description, level, correctWords);
    storage.set("avatars-minted", chain_avatars);
  }
}
