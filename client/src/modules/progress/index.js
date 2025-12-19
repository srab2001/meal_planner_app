/**
 * Progress Module - Streak tracking, badges, and referrals
 * 
 * Features:
 * - Weekly plan generation streaks
 * - Achievement badges
 * - Referral system with limits and anti-self-referral
 */

export { default as ProgressApp } from './ProgressApp';
export { StreakService } from './services/StreakService';
export { BadgeService } from './services/BadgeService';
export { ReferralService } from './services/ReferralService';
