import { IpRiskProvider, IpRiskResult } from './types';

/**
 * Proxycheck.io implementation
 */
export class ProxycheckProvider implements IpRiskProvider {
  readonly name = 'proxycheck';
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
      const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?key=${this.apiKey}&vpn=1&asn=1&risk=1&port=1&seen=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ApolloCraft-Security/1.0' },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`Proxycheck HTTP ${response.status}`);
      }

      const data = await response.json();
      const ipData = data[ip];

      if (!ipData) {
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

      const isProxy = ipData.proxy === 'yes';
      const type = (ipData.type || '').toLowerCase();
      const isVpn = isProxy && (type.includes('vpn') || type === '');
      const isTor = type.includes('tor');
      const isHosting = type.includes('hosting') || type.includes('data');
      const isResidential = type.includes('residential');

      return {
        vpn: isVpn,
        proxy: isProxy,
        tor: isTor,
        hosting: isHosting,
        datacenter: isHosting,
        residentialProxy: isResidential,
        riskScore: typeof ipData.risk === 'number' ? ipData.risk : isProxy ? 65 : 0,
        asn: ipData.asn,
        organization: ipData.organisation || ipData.provider,
        country: ipData.isocode,
        providerName: this.name,
        isConfigured: true,
      };
    } catch (error) {
      console.error('[ProxycheckProvider] Error querying proxycheck.io:', error);
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
