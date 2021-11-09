// @nearfile

import { u128 } from "near-sdk-as";

export class ChainAvatarsForUser {
  ids: Array<u32>;
  address: string;
  highestLevels: Array<u32>;
  datas: Array<string>;
  correctWordTotals: Array<u64>;
  descriptions: Array<string>;
  isBlockList: Array<boolean>;

  constructor(_id: u32, _address: string, _data: string, _description: string, _highestLevel: u32, _correctWordTotal: u64) {
    this.ids = new Array<u32>();
    this.ids.push(_id);
    this.address = _address;
    this.datas = new Array<string>();
    this.datas.push(_data);
    this.highestLevels = new Array<u32>();
    this.highestLevels.push(_highestLevel);
    this.correctWordTotals = new Array<u64>();
    this.correctWordTotals.push(_correctWordTotal);
    this.descriptions = new Array<string>();
    this.descriptions.push(_description);
    this.isBlockList = new Array<boolean>();
    this.isBlockList.push(false);
  }
  setIsBlockList(_avatarIndex: u32): void {
    this.isBlockList[_avatarIndex] = true;
  }
  removeIsBlockList(_avatarIndex: u32): void {
    this.isBlockList[_avatarIndex] = false;
  }
  isOnBlockList(_avatarIndex: u32): boolean {
    return this.isBlockList[_avatarIndex];
  }
  setHighestLevel(_avatarIndex: u32, _level: u32): void {
    if (_level > this.highestLevels[_avatarIndex]) { this.highestLevels[_avatarIndex] = _level; }
  }

  increaseCorrectWords(_avatarIndex: u32, _correctWords: u64): void {
    this.correctWordTotals[_avatarIndex] += _correctWords;
  }

  updateDescription(_avatarIndex: u32, _description: string): void {
    this.descriptions[_avatarIndex] = _description;
  }
  updateCharacter(_avatarIndex: u32, _data: string): void {
    this.datas[_avatarIndex] = _data;
  }

  addNewAvatarForThisPlayer(_id: u32, _data: string, _description: string, _highestLevel: u32, _correctWordTotal: u64): void {
    this.ids.push(_id);
    this.datas.push(_data);
    this.descriptions.push(_description);
    this.highestLevels.push(_highestLevel);
    this.correctWordTotals.push(_correctWordTotal);
    this.isBlockList.push(false);
  }
  removeThisAvatar(_avatarIndex: u32): void {
    this.ids.splice(_avatarIndex, 1);
    this.datas.splice(_avatarIndex, 1);
    this.descriptions.splice(_avatarIndex, 1);
    this.highestLevels.splice(_avatarIndex, 1);
    this.correctWordTotals.splice(_avatarIndex, 1);
    this.isBlockList.splice(_avatarIndex, 1);
  }

  resetBlockList(): void {
    this.isBlockList = new Array<boolean>();
    for (var i = 0; i < this.ids.length; i++) {
      this.isBlockList.push(false);
    }
  }

  isOwnedByMe(_avatarId: u32): boolean {
    if (this.ids.indexOf(_avatarId) > -1) {
      return true;
    } else {
      return false;
    }
  }

  getPersonalIndex(_avatarId: u32): u32 {
    return this.ids.indexOf(_avatarId);
  }
}


export class Player {
  previousWpm: u32;
  previousAccuracy: u32;
  previousLevelCompleted: u32;

  address: string;
  wordCountEligibleForRewards: u64;
  rewards: u128;
  lastBlockIndex: u64;

  constructor(_wpm: u32, _accuracy: u32, _previousLevelCompleted: u32, _address: string, _lastBlockIndex: u64) {
    this.previousWpm = _wpm;
    this.previousAccuracy = _accuracy;
    this.previousLevelCompleted = _previousLevelCompleted;
    this.address = _address;
    this.rewards = u128.from("0");
    this.lastBlockIndex = _lastBlockIndex;
  }

  updateBlockIndex(_newIndex: u64): void {
    this.lastBlockIndex = _newIndex;
  };

  updatePreviousLevelCompleted(_wpm: u32, _accuracy: u32): void {
    this.previousWpm = _wpm;
    this.previousAccuracy = _accuracy;
  };

  resetRewardsAfterWithdrawal(): void {
    this.rewards = u128.from("0");
  };

  reduceRewards(_new_subtraction: u128): void {
    this.rewards = u128.sub(this.rewards, _new_subtraction)
  }

  increaseRewards(_new_rewards: u128): void {
    this.rewards = u128.add(this.rewards, _new_rewards);
  };

  updateLevel(_level: u32): void {
    this.previousLevelCompleted = _level;
  };

}

export class Game {
  avatarMintCount: u32;
  wordsList: string;

  constructor(_avatarMintCount: u32, _wordsList: string) {
    this.avatarMintCount = _avatarMintCount
    this.wordsList = _wordsList;
  }

  increaseAvatarMintCount(): void {
    this.avatarMintCount++;
  }
  decreaseAvatarMintCount(): void {
    this.avatarMintCount--;
  }
  updateWordsList(_wordsList: string): void {
    this.wordsList = _wordsList;
  }

}


export class OrderForUser {
  avatarId: u32;
  forSale: boolean;
  priceForSale: u128;

  constructor(_avatarId: u32) {
    this.avatarId = _avatarId
    this.forSale = false;
    this.priceForSale = u128.from("0");
  }

  setItemForSale(_price: u128): void {
    this.forSale = true;
    this.priceForSale = _price;
  }

  updateItemForSale(_isForSale: boolean, _price: u128): void {
    this.forSale = _isForSale;
    this.priceForSale = _price;
  }
}


export class GameRewardsState {
  payRate: u128;
  minimumWithdrawalAmount: u128;
  withdrawalFee: u128;
  currentEligibleRewards: u128;
  marketRoyalty: u128;
  avatarPrice: u128;
  maxAvatars: u32;
  totalPaidOut: u128;
  totalFeesEarned: u128;
  actionFee: u128;
  updateCharacterFee: u128;
  marketVolume: u128;

  constructor() {
    this.payRate = u128.from("200000000000000000000");
    this.minimumWithdrawalAmount = u128.from("20000000000000000000000");
    this.withdrawalFee = u128.from("10000000000000000000000");
    this.currentEligibleRewards = u128.from("0");
    this.marketRoyalty = u128.from("250000000000000000000000");
    this.avatarPrice = u128.from("2000000000000000000000000");
    this.actionFee = u128.from("10000000000000000000000");
    this.updateCharacterFee = u128.from("20000000000000000000000");
    this.maxAvatars = 50;
    this.totalPaidOut = u128.from("0");
    this.totalFeesEarned = u128.from("0");
    this.marketVolume = u128.from("0");
  }
  increaseTotalPaidOut(_newAdditionalPaidOut: u128): void {
    this.totalPaidOut = u128.add(this.totalPaidOut, _newAdditionalPaidOut);
  }
  increaseTotalFeesEarned(_newAdditionalFeesEarned: u128): void {
    this.totalFeesEarned = u128.add(this.totalFeesEarned, _newAdditionalFeesEarned);
  }
  increaseMarketVolume(_newAdditionalIncrease: u128): void {
    this.marketVolume = u128.add(this.marketVolume, _newAdditionalIncrease);
  }
  updateRewardsState(_pay_rate: u128, _minimum_withdrawal_amount: u128, _withdrawal_fee: u128): void {
    this.payRate = _pay_rate;
    this.minimumWithdrawalAmount = _minimum_withdrawal_amount;
    this.withdrawalFee = _withdrawal_fee;
  }

  increaseEligibleRewards(_new_addition_of_eligible_rewards: u128): void {
    this.currentEligibleRewards = u128.add(this.currentEligibleRewards, _new_addition_of_eligible_rewards);
  }

  reduceEligibleRewards(_amount_to_reduce: u128): void {
    this.currentEligibleRewards = u128.sub(this.currentEligibleRewards, _amount_to_reduce);
  }

  setPayRate(_pay_rate: u128): void {
    this.payRate = _pay_rate;
  }

  setRoyalty(_royalty: u128): void {
    this.marketRoyalty = _royalty;
  }

  setWithdrawalFee(_withdrawal_fee: u128): void {
    this.withdrawalFee = _withdrawal_fee;
  }

  setAvatarPrice(_price: u128): void {
    this.avatarPrice = _price;
  }
  setMinimumWithdrawalAmount(_amount: u128): void {
    this.minimumWithdrawalAmount = _amount;
  }
  setMaxAvatars(_amount: u32): void {
    this.maxAvatars = _amount;
  }
}