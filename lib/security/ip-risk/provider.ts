import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hashIp, maskIp } from '../crypto';
import { DisabledIpRiskProvider } from './disabled';
import { IpInfoProvider } from './ipinfo';
import { ProxycheckProvider } from './proxycheck';
import { IpRiskProvider, IpRiskResult } from './types';

export function getIpRiskProvider(): IpRiskProvider {
  const providerType = (process.env.IP_RISK_PROVIDER || 'disabled').toLowerCase();
  const apiKey = process.env.IP_RISK_API_KEY || '';

  if (!apiKey || providerType === 'disabled') {
    return new DisabledIpRiskProvider();
  }

  if (providerType === 'proxycheck') {
    return new ProxycheckProvider(apiKey);
  }

  if (providerType === 'ipinfo') {
    return new IpInfoProvider(apiKey);
  }

  return new DisabledIpRiskProvider();
}

/**
 * Checks an IP address with 24-hour database caching in Supabase
 */
export async function checkIpWithCache(ip: string): Promise<IpRiskResult> {
  const provider = getIpRiskProvider();
  const ipHash = hashIp(ip);
  const supabase = getSupabaseAdmin();

  // If Supabase is available, check cache first
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from('vpn_checks')
        .select('*')
        .eq('ip_hash', ipHash)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        return {
          vpn: cached.is_vpn,
          proxy: cached.is_proxy,
          tor: cached.is_tor,
          hosting: cached.is_hosting,
          datacenter: cached.is_datacenter,
          residentialProxy: cached.is_residential_proxy,
          riskScore: cached.risk_score,
          asn: cached.asn || undefined,
          organization: cached.organization || undefined,
          country: cached.country || undefined,
          providerName: 'cache',
          isConfigured: true,
          cached: true,
        };
      }
    } catch (e) {
      // Non-blocking if table not yet seeded or read error
    }
  }

  // Live lookup from configured provider
  const result = await provider.checkIp(ip);

  // If successfully checked and supabase available, save into cache
  if (supabase && provider.isConfigured()) {
    try {
      const ttlHours = 24;
      const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

      await supabase.from('vpn_checks').insert({
        ip_hash: ipHash,
        ip_masked: maskIp(ip),
        is_vpn: result.vpn,
        is_proxy: result.proxy,
        is_tor: result.tor,
        is_hosting: result.hosting,
        is_datacenter: result.datacenter,
        is_residential_proxy: result.residentialProxy,
        risk_score: result.riskScore,
        asn: result.asn || null,
        organization: result.organization || null,
        country: result.country || null,
        expires_at: expiresAt,
      });
    } catch (e) {
      console.warn('[checkIpWithCache] Error caching IP check result:', e);
    }
  }

  return result;
}
