import { IpRiskProvider, IpRiskResult } from './types';

/**
 * IPInfo.io Privacy Detection implementation
 */
export class IpInfoProvider implements IpRiskProvider {
  readonly name = 'ipinfo';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.IP_RISK_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async checkIp(ip: string): Promise<IpRiskResult> {
    if (!this.isConfigured()) {
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

    try {
      const url = `https://ipinfo.io/${encodeURIComponent(ip)}?token=${this.apiKey}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`IPInfo HTTP ${response.status}`);
      }

      const data = await response.json();
      const privacy = data.privacy || {};

      const isVpn = Boolean(privacy.vpn);
      const isProxy = Boolean(privacy.proxy);
      const isTor = Boolean(privacy.tor);
      const isHosting = Boolean(privacy.hosting);
      const isResidential = Boolean(privacy.residential);

      let calculatedRisk = 0;
      if (isTor) calculatedRisk = 95;
      else if (isVpn || isProxy) calculatedRisk = 75;
      else if (isHosting) calculatedRisk = 45;

      return {
        vpn: isVpn,
        proxy: isProxy,
        tor: isTor,
        hosting: isHosting,
        datacenter: isHosting,
        residentialProxy: isResidential,
        riskScore: calculatedRisk,
        asn: data.org ? data.org.split(' ')[0] : undefined,
        organization: data.org,
        country: data.country,
        providerName: this.name,
        isConfigured: true,
      };
    } catch (error) {
      console.error('[IpInfoProvider] Error querying ipinfo.io:', error);
      return {
        vpn: false,
        proxy: false,
        tor: false,
        hosting: false,
        datacenter: false,
        residentialProxy: false,
        riskScore: 0,
        providerName: this.name,
        isConfigured: true,
      };
    }
  }
}
