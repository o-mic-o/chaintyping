// @nearfile
import { logging } from 'near-sdk-as';

export class CurrentPlayer {
  level: u32;
  wpm: i64;
  accuracy: i64;
  words: Array<u32>;
  levelCount: u32;
  indexAsPlayer: u32;

  constructor(_level: u32, _words: Array<u32>, _levelCount: u32, _indexAsPlayer: u32) {
    this.words = _words;
    this.level = _level;
    this.levelCount = _levelCount;
    this.indexAsPlayer = _indexAsPlayer;
  }


  updateLevelWithWords(_level: u32, _words: Array<u32>): void {
    this.words = _words;
    this.level = _level;
  };

  setLastLevelCompleted(_level: u32, _wpm: i64, _accuracy: i64, _levelCount: u32, _incomingWords: Array<u32>) : boolean {
    this.level = _level;
    this.wpm = _wpm;
    this.accuracy = _accuracy;
    this.levelCount = _levelCount;

    let check = true;

    // how do i log a string? it wants me to make it unknown first.
      for (var i = 0; i < this.words.length; i++) {
        if (this.words[i] != _incomingWords[i]) {

          check = false;
        }
      }

      if (_incomingWords.length != this.words.length) {

        check = false;
      }

      return check;
  };

};

export class AvatarsMinted {
  avatarMintCount: i64;

  constructor(_avatarMintCount: i64) {
    this.avatarMintCount = _avatarMintCount;
  }

  increaseAvatarsMinted(): void {
    this.avatarMintCount++;
  };

}

export class Players {
  addresses: Array<string>;
  rewardsToClaim: Array<f64>;
  wordCountEligibleForRewards: Array<u64>;

  constructor(_addresses: Array<string>, _rewardsToClaim: Array<f64>, _wordCountEligibleForRewards: Array<u64>) {
    this.addresses = _addresses;
    this.rewardsToClaim = _rewardsToClaim;
    this.wordCountEligibleForRewards = _wordCountEligibleForRewards;
  }

  saveNewPlayer(_address: string, _rewardsToClaim: f64, _wordCountEligibleForReward: u64) : boolean {
    if (this.addresses.indexOf(_address) > -1) {
      return false;
    } else {
      this.addresses.push(_address);
      this.rewardsToClaim.push(_rewardsToClaim);
      this.wordCountEligibleForRewards.push(_wordCountEligibleForReward);
      return true;
    }
  }

  playerExists(_address: string) : boolean {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      return true;
    } else {
      return false;
    }
  }

  updatePlayerReward(_address: string, _rewardsToClaim: f64, _wordCountEligibleForReward: u64) : boolean {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      logging.log("Found this player, trying to update");
      this.rewardsToClaim[indexOfThisPlayer] += _rewardsToClaim;
      this.wordCountEligibleForRewards[indexOfThisPlayer] += _wordCountEligibleForReward;
      return true;
    } else {
      return false;
    }
  }

  getThisPlayerAddress(_address: string) : string{
    logging.log("Checking address at index");
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      logging.log("returning found address at > -1");
      return this.addresses[indexOfThisPlayer];
    } else {
      logging.log("returning default empty string");
      return "";
    }
  };

  getThisPlayerRewardsToClaim(_address: string) :f64 {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      return this.rewardsToClaim[indexOfThisPlayer];
    } else {
      return -1;
    }
  }
  getThisPlayerWordCountEligibleForRewards(_address: string): u64 {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      return this.wordCountEligibleForRewards[indexOfThisPlayer];
    } else {
      return -1;
    }
  }
}

export class Funders {
  addresses: Array<string>;
  fundedAmounts: Array<f64>;
}