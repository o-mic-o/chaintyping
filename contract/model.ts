// @nearfile

import { u128 } from "near-sdk-as";

export class ChainAvatarsForUser {
  ids: Array<u32>;
  address: string;
  highestLevels: Array<u32>;
  datas: Array<string>;
  correctWordTotals: Array<u64>;
  descriptions: Array<string>;

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

  addNewAvatarForThisPlayer(_id: u32, _data: string, _description: string, _highestLevel: u32, _correctWordTotal: u64): void {
    this.ids.push(_id);
    this.datas.push(_data);
    this.descriptions.push(_description);
    this.highestLevels.push(_highestLevel);
    this.correctWordTotals.push(_correctWordTotal);
  }
  removeThisAvatar(_avatarIndex: u32): void {
    this.ids.splice(_avatarIndex, 1);
    this.datas.splice(_avatarIndex, 1);
    this.descriptions.splice(_avatarIndex, 1);
    this.highestLevels.splice(_avatarIndex, 1);
    this.correctWordTotals.splice(_avatarIndex, 1);
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
  previousWordsList: Array<u32>;
  previousLevelCompleted: u32;

  address: string;
  wordCountEligibleForRewards: u64;
  rewards: u128;

  constructor(_wpm: u32, _accuracy: u32, _previousLevelCompleted: u32, _address: string) {
    this.previousWpm = _wpm;
    this.previousAccuracy = _accuracy;
    //this.previousWordsList = _wordsList;
    this.previousLevelCompleted = _previousLevelCompleted;
    this.address = _address;
    this.rewards = u128.from("0");
  }

  updatePreviousLevelCompleted(_wpm: u32, _accuracy: u32): void {
    this.previousWpm = _wpm;
    this.previousAccuracy = _accuracy;
  };

  resetRewardsAfterWithdrawal(): void {
    this.rewards = u128.from("0");
  };

  increaseRewards(_new_rewards: u128): void {
    this.rewards = u128.add(this.rewards, _new_rewards);
  };

  updateLevel(_level: u32): void {
    this.previousLevelCompleted = _level;
  };

  updateLevelAndWords(_level: u32): void {
    this.previousLevelCompleted = _level;
    //this.previousWordsList = _words;
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

export class RewardsForUser {

}

export class GameRewardsState {
  minimumBalance: u128;
  payRate: u128;
  minimumWithdrawalAmount: u128;
  withdrawalFee: u128;
  currentEligibleRewards: u128;
  marketRoyalty: u128;

  constructor(_minimum_balance: u128, _pay_rate: u128, _minimum_withdrawal_amount: u128, _withdrawal_fee: u128) {
    this.minimumBalance = _minimum_balance;
    this.payRate = _pay_rate;
    this.minimumWithdrawalAmount = _minimum_withdrawal_amount;
    this.withdrawalFee = _withdrawal_fee;
    this.currentEligibleRewards = u128.from("0");
    this.marketRoyalty = u128.from("50000000000000000000000");
  }

  updateRewardsState(_minimum_balance: u128, _pay_rate: u128, _minimum_withdrawal_amount: u128, _withdrawal_fee: u128): void {
    this.minimumBalance = _minimum_balance;
    this.payRate = _pay_rate;
    this.minimumWithdrawalAmount = _minimum_withdrawal_amount;
    this.withdrawalFee = _withdrawal_fee;
  }

  increaseEligibleRewards(_new_addition_of_eligible_words: u128): void {
    this.currentEligibleRewards = u128.add(this.currentEligibleRewards, _new_addition_of_eligible_words);
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
}
