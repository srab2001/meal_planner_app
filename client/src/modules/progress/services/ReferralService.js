/**
 * ReferralService - Referral system with limits and anti-self-referral
 * 
 * Security Rules:
 * 1. Users cannot refer themselves (anti-self-referral)
 * 2. Each referral code can only be used once per referee
 * 3. Maximum referrals per referrer is limited
 * 4. Referral rewards have redemption limits
 */

import { API_BASE } from '../../../shared/utils/api';

// Referral configuration
const REFERRAL_CONFIG = {
  MAX_REFERRALS_PER_USER: 20,        // Max people one user can refer
  REFERRAL_REWARD_REFERRER: 'free_week',  // Reward for referrer
  REFERRAL_REWARD_REFEREE: 'discount_10',  // Reward for new user
  CODE_PREFIX: 'ASR',
  CODE_LENGTH: 8
};

class ReferralServiceClass {
  constructor() {
    this.STORAGE_KEY = 'asr_referral_data';
  }

  /**
   * Get referral data from localStorage
   */
  getReferralData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading referral data:', e);
    }
    
    return {
      myReferralCode: null,
      referredBy: null,
      referrals: [],          // People I've referred
      rewardsEarned: [],
      rewardsRedeemed: []
    };
  }

  /**
   * Save referral data
   */
  saveReferralData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving referral data:', e);
    }
  }

  /**
   * Generate a unique referral code for a user
   */
  generateReferralCode(userId) {
    const data = this.getReferralData();
    
    if (data.myReferralCode) {
      return data.myReferralCode;
    }
    
    // Generate code: ASR + userId hash + random chars
    const userHash = this.hashUserId(userId);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${REFERRAL_CONFIG.CODE_PREFIX}${userHash}${randomPart}`;
    
    data.myReferralCode = code;
    this.saveReferralData(data);
    
    return code;
  }

  /**
   * Hash user ID to create part of referral code
   */
  hashUserId(userId) {
    // Simple hash for demo - in production use proper hashing
    let hash = 0;
    const str = String(userId);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
  }

  /**
   * Extract user identifier from referral code
   * Used for anti-self-referral check
   */
  extractUserHashFromCode(code) {
    if (!code || !code.startsWith(REFERRAL_CONFIG.CODE_PREFIX)) {
      return null;
    }
    // Code format: ASR + 4 char user hash + 4 char random
    return code.substring(3, 7);
  }

  /**
   * Validate and apply a referral code
   * 
   * @param {string} code - Referral code to apply
   * @param {string} currentUserId - ID of user applying the code
   * @returns {object} - { success, error, reward }
   */
  async applyReferralCode(code, currentUserId) {
    const data = this.getReferralData();
    
    // Validation 1: Check if user already used a referral code
    if (data.referredBy) {
      return {
        success: false,
        error: 'You have already used a referral code',
        errorCode: 'ALREADY_REFERRED'
      };
    }
    
    // Validation 2: Anti-self-referral check (local)
    const codeUserHash = this.extractUserHashFromCode(code);
    const currentUserHash = this.hashUserId(currentUserId);
    
    if (codeUserHash === currentUserHash) {
      return {
        success: false,
        error: 'You cannot use your own referral code',
        errorCode: 'SELF_REFERRAL'
      };
    }
    
    // Validation 3: Check if code matches user's own code
    if (data.myReferralCode && data.myReferralCode === code) {
      return {
        success: false,
        error: 'You cannot use your own referral code',
        errorCode: 'SELF_REFERRAL'
      };
    }
    
    // Validation 4: Verify code with backend (checks validity and limits)
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/referrals/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          referralCode: code,
          refereeUserId: currentUserId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Invalid referral code',
          errorCode: result.errorCode || 'INVALID_CODE'
        };
      }
      
      // Success - update local data
      data.referredBy = {
        code: code,
        date: new Date().toISOString(),
        referrerId: result.referrerId
      };
      
      data.rewardsEarned.push({
        type: REFERRAL_CONFIG.REFERRAL_REWARD_REFEREE,
        source: 'referral_bonus',
        earnedAt: new Date().toISOString(),
        redeemed: false
      });
      
      this.saveReferralData(data);
      
      return {
        success: true,
        reward: REFERRAL_CONFIG.REFERRAL_REWARD_REFEREE,
        message: 'Referral code applied! You earned a 10% discount.'
      };
      
    } catch (error) {
      console.error('Error applying referral code:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
        errorCode: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Record a successful referral (called when referee signs up)
   * Called by backend webhook or after referee completes signup
   */
  recordReferral(refereeInfo) {
    const data = this.getReferralData();
    
    // Check referral limit
    if (data.referrals.length >= REFERRAL_CONFIG.MAX_REFERRALS_PER_USER) {
      console.warn('Referral limit reached');
      return { success: false, error: 'Referral limit reached' };
    }
    
    // Check for duplicate (same referee)
    if (data.referrals.some(r => r.refereeId === refereeInfo.refereeId)) {
      console.warn('Duplicate referral attempt');
      return { success: false, error: 'Already referred this user' };
    }
    
    data.referrals.push({
      refereeId: refereeInfo.refereeId,
      refereeName: refereeInfo.refereeName || 'A friend',
      date: new Date().toISOString(),
      rewardClaimed: false
    });
    
    // Award referrer reward
    data.rewardsEarned.push({
      type: REFERRAL_CONFIG.REFERRAL_REWARD_REFERRER,
      source: 'referral',
      refereeId: refereeInfo.refereeId,
      earnedAt: new Date().toISOString(),
      redeemed: false
    });
    
    this.saveReferralData(data);
    
    return {
      success: true,
      totalReferrals: data.referrals.length,
      remainingReferrals: REFERRAL_CONFIG.MAX_REFERRALS_PER_USER - data.referrals.length
    };
  }

  /**
   * Redeem a reward
   * Enforces one-time redemption
   */
  redeemReward(rewardIndex) {
    const data = this.getReferralData();
    
    if (rewardIndex < 0 || rewardIndex >= data.rewardsEarned.length) {
      return { success: false, error: 'Invalid reward' };
    }
    
    const reward = data.rewardsEarned[rewardIndex];
    
    if (reward.redeemed) {
      return { success: false, error: 'Reward already redeemed' };
    }
    
    // Mark as redeemed
    data.rewardsEarned[rewardIndex].redeemed = true;
    data.rewardsEarned[rewardIndex].redeemedAt = new Date().toISOString();
    
    data.rewardsRedeemed.push({
      ...reward,
      redeemedAt: new Date().toISOString()
    });
    
    this.saveReferralData(data);
    
    return {
      success: true,
      reward: reward,
      message: `Reward redeemed: ${reward.type}`
    };
  }

  /**
   * Get referral statistics
   */
  getStats() {
    const data = this.getReferralData();
    
    return {
      myCode: data.myReferralCode,
      wasReferred: !!data.referredBy,
      referredBy: data.referredBy,
      totalReferrals: data.referrals.length,
      maxReferrals: REFERRAL_CONFIG.MAX_REFERRALS_PER_USER,
      remainingReferrals: REFERRAL_CONFIG.MAX_REFERRALS_PER_USER - data.referrals.length,
      referrals: data.referrals,
      unredeemedRewards: data.rewardsEarned.filter(r => !r.redeemed).length,
      totalRewardsEarned: data.rewardsEarned.length
    };
  }

  /**
   * Share referral code
   */
  async shareReferralCode(userId) {
    const code = this.generateReferralCode(userId);
    const shareText = `Join me on ASR Meal Planner! Use my referral code ${code} for 10% off your first plan. https://meal-planner.vercel.app?ref=${code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ASR Meal Planner',
          text: shareText,
          url: `https://meal-planner.vercel.app?ref=${code}`
        });
        return { success: true, method: 'native_share' };
      } catch (e) {
        // User cancelled or error
        console.log('Native share cancelled or failed');
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: 'clipboard', message: 'Referral link copied to clipboard!' };
    } catch (e) {
      return { success: false, error: 'Could not share referral code' };
    }
  }
}

export const ReferralService = new ReferralServiceClass();
