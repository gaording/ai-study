import { getDatabase } from './database/memory-db';

export interface UrgencyResult {
  isUrgent: boolean;
  reason?: string;
}

export class RuleEngine {
  async shouldMarkAsUrgent(
    appName: string,
    sender: string,
    body: string,
    timestamp: number
  ): Promise<UrgencyResult> {
    // Rule 1: Check whitelist
    const whitelistResult = await this.checkWhitelist(appName, sender);
    if (whitelistResult.isUrgent) {
      return whitelistResult;
    }

    // Rule 2: Check keywords
    const keywordResult = await this.checkKeywords(body);
    if (keywordResult.isUrgent) {
      return keywordResult;
    }

    // Rule 3: Check repeated messages
    const repeatResult = await this.checkRepeatedMessages(sender, timestamp);
    if (repeatResult.isUrgent) {
      return repeatResult;
    }

    return { isUrgent: false };
  }

  private async checkWhitelist(appName: string, sender: string): Promise<UrgencyResult> {
    const db = getDatabase();

    const result = db.prepare(`
      SELECT * FROM whitelist
      WHERE (type = 'app' AND value = ?) OR (type = 'contact' AND value = ?)
    `).get(appName, sender);

    if (result) {
      return { isUrgent: true, reason: '白名单联系人/应用' };
    }

    return { isUrgent: false };
  }

  private async checkKeywords(body: string): Promise<UrgencyResult> {
    const db = getDatabase();
    const keywords = db.prepare('SELECT keyword FROM urgent_keywords').all() as { keyword: string }[];

    for (const { keyword } of keywords) {
      if (body.toLowerCase().includes(keyword.toLowerCase())) {
        return { isUrgent: true, reason: `包含关键词: ${keyword}` };
      }
    }

    return { isUrgent: false };
  }

  private async checkRepeatedMessages(sender: string, timestamp: number): Promise<UrgencyResult> {
    const db = getDatabase();
    const threeMinutesAgo = timestamp - (3 * 60);

    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM queued_notifications
      WHERE sender = ? AND timestamp BETWEEN ? AND ?
    `).get(sender, threeMinutesAgo, timestamp) as { count: number };

    if (result.count >= 3) {
      return { isUrgent: true, reason: '重复消息（3次/3分钟）' };
    }

    return { isUrgent: false };
  }
}