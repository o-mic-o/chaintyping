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

  setLastLevelCompleted(_level: u32, _wpm: i64, _accuracy: i64, _levelCount: u32, _incomingWords: Array<u32>): boolean {
    this.level = _level;
    this.wpm = _wpm;
    this.accuracy = _accuracy;
    this.levelCount = _levelCount;

    let check = true;

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

export class ChainAvatars {
  avatarMintCount: u32;
  addresses: Array<string>;
  avatarData: Array<string>;
  avatarsLevels: Array<u32>;
  avatarsCorrectWords: Array<u32>;
  descriptions: Array<string>;

  constructor(_avatarMintCount: u32, _addresses: Array<string>, _avatarData: Array<string>, _avatarsLevels: Array<u32>, _avatarsCorrectWords: Array<u32>, _descriptions: Array<string>) {
    this.avatarMintCount = _avatarMintCount;
    this.addresses = _addresses;
    this.avatarData = _avatarData;
    this.avatarsLevels = _avatarsLevels;
    this.avatarsCorrectWords = _avatarsCorrectWords;
    this.descriptions = _descriptions;
  }

  increaseAvatarsMinted(_address: string, _avatarData: string, _description: string): void {
    this.avatarMintCount++;
    this.addresses.push(_address);
    this.avatarData.push(_avatarData);
    this.avatarsLevels.push(0);
    this.avatarsCorrectWords.push(0);
    this.descriptions.push(_description);
  };

  setAvatarsLevel(_avatarIndex: u32, _level: u32): void {
    if (_level > this.avatarsLevels[_avatarIndex]) {
      this.avatarsLevels[_avatarIndex] = _level;
    }
  }
  setAvatarsCorrectWords(_avatarIndex: u32, correctWords: u32): void {
    this.avatarsCorrectWords[_avatarIndex] = this.avatarsLevels[_avatarIndex] + correctWords;
  }

  isIndexMyAvatar(_avatarIndex: u32, _address: string): boolean {
    if (this.addresses[_avatarIndex] == _address) {
      return true;
    } else {
      return false;
    }
  }

  updateDescription(_avatarIndex: u32, _description: string): void {
    this.descriptions[_avatarIndex] = _description;
  };

  importAvatar(_address: string, _avatarData: string, _description: string, _level: u32, _correctWords: u32): void {
    this.avatarMintCount++;
    this.addresses.push(_address);
    this.avatarData.push(_avatarData);
    this.avatarsLevels.push(_level);
    this.avatarsCorrectWords.push(_correctWords);
    this.descriptions.push(_description);
  }
}

export class Players {
  addresses: Array<string>;
  rewardsToClaim: Array<f64>;
  wordCountEligibleForRewards: Array<u64>;
  highestLevelsAchieved: Array<u32>;
  wordsTypedCorrectly: Array<u32>;

  constructor(_addresses: Array<string>, _rewardsToClaim: Array<f64>, _wordCountEligibleForRewards: Array<u64>, _highestLevelsAchieved: Array<u32>, _wordsTypedCorrectly: Array<u32>) {
    this.addresses = _addresses;
    this.rewardsToClaim = _rewardsToClaim;
    this.wordCountEligibleForRewards = _wordCountEligibleForRewards;
    this.highestLevelsAchieved = _highestLevelsAchieved;
    this.wordsTypedCorrectly = _wordsTypedCorrectly;
  }

  saveNewPlayer(_address: string, _rewardsToClaim: f64, _wordCountEligibleForReward: u64, _highestLevelsAchieved: u32, _wordsTypedCorrectly: u32): boolean {
    if (this.addresses.indexOf(_address) > -1) {
      return false;
    } else {
      this.addresses.push(_address);
      this.rewardsToClaim.push(_rewardsToClaim);
      this.wordCountEligibleForRewards.push(_wordCountEligibleForReward);
      this.highestLevelsAchieved.push(_highestLevelsAchieved);
      this.wordsTypedCorrectly.push(_wordsTypedCorrectly);
      return true;
    }
  }

  playerExists(_address: string): boolean {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      return true;
    } else {
      return false;
    }
  }

  updatePlayerReward(_address: string, _rewardsToClaim: f64, _wordCountEligibleForReward: u64): boolean {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      this.rewardsToClaim[indexOfThisPlayer] += _rewardsToClaim;
      this.wordCountEligibleForRewards[indexOfThisPlayer] += _wordCountEligibleForReward;
      return true;
    } else {
      return false;
    }
  }

  getThisPlayerAddress(_address: string): string {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      return this.addresses[indexOfThisPlayer];
    } else {
      return "";
    }
  };

  getThisPlayerRewardsToClaim(_address: string): f64 {
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
  updateAndReturnHighestLevel(_address: string, _currentLevel: u32): u32 {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      if (_currentLevel > this.highestLevelsAchieved[indexOfThisPlayer]) {
        this.highestLevelsAchieved[indexOfThisPlayer] = _currentLevel;
        return _currentLevel;
      } else {
        return this.highestLevelsAchieved[indexOfThisPlayer];
      }
    } else {
      return -1;
    }
  }
  updateAndReturnWordsTypedCorrectly(_address: string, _wordsTypedCorrectly: u32): u32 {
    let indexOfThisPlayer = this.addresses.indexOf(_address);
    if (indexOfThisPlayer > -1) {
      this.wordsTypedCorrectly[indexOfThisPlayer] = this.wordsTypedCorrectly[indexOfThisPlayer] + _wordsTypedCorrectly;
      return this.wordsTypedCorrectly[indexOfThisPlayer];
    } else {
      return -1;
    }
  }
}
