import { IpRiskProvider, IpRiskResult } from './types';

/**
 * Fallback provider when no external provider is configured
 * Never invents fake detection results
 */
export class DisabledIpRiskProvider implements IpRiskProvider {
  readonly name = 'disabled';

  isConfigured(): boolean {
    return false;
  }

  async checkIp(_ip: string): Promise<IpRiskResult> {
    return {
      vpn: false,
      proxy: false,
      tor: false,
      hosting: false,
      datacenter: false,
      residentialProxy: false,
      riskScore: 0,
      providerName: this.name,
      isConfigured: false,
    };
  }
}
