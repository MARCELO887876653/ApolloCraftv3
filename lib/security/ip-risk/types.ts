export interface IpRiskResult {
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  hosting: boolean;
  datacenter: boolean;
  residentialProxy: boolean;
  riskScore: number;
  asn?: string;
  organization?: string;
  country?: string;
  providerName: string;
  isConfigured: boolean;
  cached?: boolean;
}

export interface IpRiskProvider {
  readonly name: string;
  isConfigured(): boolean;
  checkIp(ip: string): Promise<IpRiskResult>;
}
