import 'server-only';

import {
  formatCtr,
  formatInteger,
  formatLongDate,
  formatMonth,
  formatPosition,
  formatUptime,
  plural,
} from '@/lib/reports/format';
import type { ReportSnapshot } from '@/lib/reports/generate';

export function buildReportSummary(snapshot: ReportSnapshot): string[] {
  const month = formatMonth(snapshot.period.start);
  const sentences: string[] = [];

  const traffic = trafficSentence(snapshot, month);
  if (traffic !== null) {
    sentences.push(traffic);
  }

  const search = searchSentence(snapshot);
  if (search !== null) {
    sentences.push(search);
  }

  const health = healthSentence(snapshot, month);
  if (health !== null) {
    sentences.push(health);
  }

  const speed = speedSentence(snapshot);
  if (speed !== null && sentences.length < 4) {
    sentences.push(speed);
  }

  const inquiries = inquiriesSentence(snapshot, month);
  if (inquiries !== null && sentences.length < 4) {
    sentences.push(inquiries);
  }

  if (sentences.length === 0) {
    sentences.push(
      `This report covers ${month} for ${snapshot.client.name}. Source data was not available to summarize.`
    );
  }

  return sentences.slice(0, 4);
}

function trafficSentence(
  snapshot: ReportSnapshot,
  month: string
): string | null {
  if (!snapshot.ga4.ok) {
    return `Traffic figures for ${month} were not available.`;
  }

  const data = snapshot.ga4.data;
  const sessions = Math.round(data.sessions);
  const users = Math.round(data.totalUsers);
  if (sessions === 0) {
    return `The site recorded no sessions in ${month}.`;
  }

  let sentence = `${snapshot.client.name} recorded ${formatInteger(sessions)} ${plural(sessions, 'session', 'sessions')} from ${formatInteger(users)} ${plural(users, 'person', 'people')} in ${month}`;

  const newUsers = Math.round(data.newUsers);
  const returningUsers = Math.round(data.returningUsers);
  if (newUsers > 0 && returningUsers === 0) {
    sentence += ', all first-time visitors';
  } else if (newUsers > returningUsers * 2 && newUsers > 0) {
    sentence += ', mostly first-time visitors';
  } else if (returningUsers > newUsers * 2 && returningUsers > 0) {
    sentence += ', mostly returning visitors';
  }

  const topChannel = data.channelGroups[0];
  if (
    topChannel !== undefined &&
    sessions > 0 &&
    topChannel.sessions / data.sessions >= 0.5
  ) {
    sentence += `, with ${topChannel.channel} accounting for most of the visits`;
  }

  return `${sentence}.`;
}

function searchSentence(snapshot: ReportSnapshot): string | null {
  if (!snapshot.gsc.ok) {
    return 'Search performance could not be included this month.';
  }
  if (snapshot.gsc.skipped) {
    return null;
  }

  const data = snapshot.gsc.data;
  if (data.emptyRows) {
    return 'Search Console returned no queries for this month.';
  }

  const current = data.current;
  if (data.prior === null) {
    return `Search Console recorded ${formatInteger(current.impressions)} ${plural(Math.round(current.impressions), 'impression', 'impressions')} and ${formatInteger(current.clicks)} ${plural(Math.round(current.clicks), 'click', 'clicks')}. There is no prior month to compare against.`;
  }

  const prior = data.prior;
  const impressionsChange = data.impressionsChange ?? 0;
  const clicksChange = data.clicksChange ?? 0;
  const positionChange = data.positionChange ?? 0;

  const reach = `Search impressions went from ${formatInteger(prior.impressions)} to ${formatInteger(current.impressions)} and clicks from ${formatInteger(prior.clicks)} to ${formatInteger(current.clicks)}`;
  const position = `average position moved from ${formatPosition(prior.position)} to ${formatPosition(current.position)}`;

  if (impressionsChange > 0 && positionChange > 0) {
    return `${reach}, while ${position}. That is more reach across a wider mix of queries, not a drop in performance.`;
  }
  if (impressionsChange > 0 && positionChange < 0) {
    return `${reach}, and ${position} — more visibility, closer to the top of results.`;
  }
  if (impressionsChange < 0 && positionChange > 0) {
    return `${reach}, and ${position}. Fewer appearances, further from the top.`;
  }
  if (impressionsChange < 0 && positionChange < 0) {
    return `${reach}, while ${position}. Reach was down; the remaining queries sat closer to the top.`;
  }
  if (clicksChange !== 0 || impressionsChange !== 0) {
    return `${reach}. ${position[0]?.toUpperCase() ?? ''}${position.slice(1)}.`;
  }
  return `Search activity was essentially unchanged, at ${formatInteger(current.impressions)} impressions, ${formatInteger(current.clicks)} clicks, and a ${formatCtr(current.ctr)} CTR.`;
}

function healthSentence(
  snapshot: ReportSnapshot,
  month: string
): string | null {
  if (!snapshot.uptime.ok) {
    return null;
  }

  const data = snapshot.uptime.data;
  const incidentCount = data.incidents.length;
  const incidentClause =
    incidentCount === 0
      ? 'No downtime was recorded'
      : `${formatInteger(incidentCount)} ${plural(incidentCount, 'interruption was', 'interruptions were')} recorded`;

  if (data.coverage === 'none') {
    return `Uptime monitoring had not started during ${month}.`;
  }

  if (data.uptimePercentage === null) {
    const started = formatLongDate(data.monitorCreatedAt);
    return `The uptime monitor started on ${started}, so a full-month availability figure is not available. ${incidentClause} after that date.`;
  }

  return `The site was available ${formatUptime(data.uptimePercentage)} of the month. ${incidentClause}.`;
}

function speedSentence(snapshot: ReportSnapshot): string | null {
  if (!snapshot.crux.ok || snapshot.crux.kind !== 'metrics') {
    return null;
  }
  const { lcp, inp, cls } = snapshot.crux.data;
  const passed = lcp.passed && inp.passed && cls.passed;
  return passed
    ? 'Phone speed met Google\'s recommended thresholds in Chrome\'s latest 28-day field sample — a rolling window, not this reporting month.'
    : 'Phone speed missed at least one of Google\'s recommended thresholds in Chrome\'s latest 28-day field sample — a rolling window, not this reporting month.';
}

function inquiriesSentence(
  snapshot: ReportSnapshot,
  month: string
): string | null {
  if (!snapshot.ga4.ok) {
    return null;
  }
  const conversions = snapshot.ga4.data.conversions;
  if (conversions.length === 0) {
    return `No inquiries were recorded as conversions in ${month}.`;
  }
  const total = conversions.reduce((sum, row) => sum + row.keyEvents, 0);
  const rounded = Math.round(total);
  return `${formatInteger(rounded)} ${plural(rounded, 'inquiry was', 'inquiries were')} recorded as conversions in ${month}.`;
}
