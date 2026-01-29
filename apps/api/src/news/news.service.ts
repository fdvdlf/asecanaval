import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { NEWS_SOURCES, NewsSource } from './news.sources';

type NewsItem = {
  id: string;
  title: string;
  summary: string | null;
  link: string;
  publishedAt: string | null;
  source: string;
  imageUrl: string | null;
  videoUrl: string | null;
  author: string | null;
};

type NewsResponse = {
  data: NewsItem[];
  sources: { id: string; name: string; url: string }[];
  updatedAt: string;
  cached: boolean;
  message?: string;
};

type CacheEntry = {
  expiresAt: number;
  value: NewsResponse;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 9000;
const DEFAULT_LIMIT = 40;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly pending = new Map<string, Promise<NewsResponse>>();
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    trimValues: true,
  });

  async getNews(category = 'internacional', limit = DEFAULT_LIMIT): Promise<NewsResponse> {
    const normalizedCategory = category?.toLowerCase() || 'internacional';
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : DEFAULT_LIMIT;
    const cacheKey = `${normalizedCategory}:${safeLimit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.value, cached: true };
    }

    const pendingJob = this.pending.get(cacheKey);
    if (pendingJob) {
      return pendingJob;
    }

    const job = this.buildNews(normalizedCategory, safeLimit).finally(() => {
      this.pending.delete(cacheKey);
    });
    this.pending.set(cacheKey, job);
    return job;
  }

  private async buildNews(category: string, limit: number): Promise<NewsResponse> {
    const sources = this.selectSources(category);
    if (sources.length === 0) {
      return {
        data: [],
        sources: [],
        updatedAt: new Date().toISOString(),
        cached: false,
        message: 'No hay fuentes configuradas para noticias.',
      };
    }

    const feedResults = await Promise.all(
      sources.map(async (source) => {
        try {
          const items = await this.fetchFeed(source);
          return { source, items };
        } catch (error) {
          this.logger.warn(`News feed error (${source.name}): ${error?.message || error}`);
          return { source, items: [] };
        }
      }),
    );

    const merged = this.mergeItems(feedResults.flatMap((entry) => entry.items));
    const sorted = merged.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    const data = sorted.slice(0, limit);
    const response: NewsResponse = {
      data,
      sources: sources.map((source) => ({ id: source.id, name: source.name, url: source.url })),
      updatedAt: new Date().toISOString(),
      cached: false,
    };

    this.cache.set(`${category}:${limit}`, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: response,
    });

    return response;
  }

  private selectSources(category: string): NewsSource[] {
    const normalized = category?.toLowerCase() || 'internacional';
    return NEWS_SOURCES.filter((source) => source.category === normalized);
  }

  private async fetchFeed(source: NewsSource): Promise<NewsItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ASOMAR-News/1.0',
          Accept: 'application/rss+xml, application/atom+xml, text/xml',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const xml = await response.text();
      return this.parseFeed(xml, source);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseFeed(xml: string, source: NewsSource): NewsItem[] {
    const data = this.parser.parse(xml);
    const rssItems = this.normalizeArray(data?.rss?.channel?.item);
    const atomEntries = this.normalizeArray(data?.feed?.entry);
    const fromRss = rssItems.map((item) => this.mapRssItem(item, source)).filter(Boolean);
    const fromAtom = atomEntries.map((entry) => this.mapAtomEntry(entry, source)).filter(Boolean);
    return [...fromRss, ...fromAtom];
  }

  private mapRssItem(item: Record<string, unknown>, source: NewsSource): NewsItem | null {
    const title = this.readText(item?.title);
    const link = this.readText(item?.link);
    if (!title || !link) {
      return null;
    }
    const summaryHtml = this.readText(item?.['content:encoded']) || this.readText(item?.description);
    const summary = this.normalizeSummary(summaryHtml);
    const imageUrl = this.extractImage(item, summaryHtml);
    const videoUrl = this.extractVideo(item);
    const publishedAt =
      this.readText(item?.pubDate) ||
      this.readText(item?.['dc:date']) ||
      null;

    return {
      id: this.readText(item?.guid) || link,
      title,
      summary,
      link,
      publishedAt: this.normalizeDate(publishedAt),
      source: source.name,
      imageUrl,
      videoUrl,
      author: this.readText(item?.author) || null,
    };
  }

  private mapAtomEntry(entry: Record<string, unknown>, source: NewsSource): NewsItem | null {
    const title = this.readText(entry?.title);
    const link = this.resolveAtomLink(entry);
    if (!title || !link) {
      return null;
    }
    const summaryHtml = this.readText(entry?.summary) || this.readText(entry?.content);
    const summary = this.normalizeSummary(summaryHtml);
    const imageUrl = this.extractImage(entry, summaryHtml);
    const videoUrl = this.extractVideo(entry);
    const publishedAt =
      this.readText(entry?.updated) ||
      this.readText(entry?.published) ||
      null;

    return {
      id: this.readText(entry?.id) || link,
      title,
      summary,
      link,
      publishedAt: this.normalizeDate(publishedAt),
      source: source.name,
      imageUrl,
      videoUrl,
      author: this.readAuthor(entry?.author) || null,
    };
  }

  private resolveAtomLink(entry: Record<string, unknown>): string {
    const linkValue = entry?.link;
    if (!linkValue) {
      return '';
    }
    if (typeof linkValue === 'string') {
      return linkValue;
    }
    const links = this.normalizeArray(linkValue);
    const preferred = links.find((item) => this.readText(item?.['@_rel']) === 'alternate');
    const target = preferred || links[0];
    return this.readText(target?.['@_href']) || '';
  }

  private extractVideo(item: Record<string, unknown>): string | null {
    const mediaContent = item?.['media:content'];
    const enclosure = item?.enclosure;
    const candidates = [...this.normalizeArray(mediaContent), ...this.normalizeArray(enclosure)];
    for (const candidate of candidates) {
      const url = this.readText(candidate?.['@_url']);
      const type = this.readText(candidate?.['@_type']);
      const medium = this.readText(candidate?.['@_medium']);
      if (!url) {
        continue;
      }
      if (type?.startsWith('video') || medium === 'video' || url.match(/\.(mp4|mov|webm)$/i)) {
        return url;
      }
    }
    return null;
  }

  private extractImage(item: Record<string, unknown>, summaryHtml?: string): string | null {
    const mediaThumbnail = item?.['media:thumbnail'];
    const mediaContent = item?.['media:content'];
    const enclosure = item?.enclosure;
    const candidates = [
      ...this.normalizeArray(mediaThumbnail),
      ...this.normalizeArray(mediaContent),
      ...this.normalizeArray(enclosure),
    ];
    for (const candidate of candidates) {
      const url = this.readText(candidate?.['@_url']);
      const type = this.readText(candidate?.['@_type']);
      const medium = this.readText(candidate?.['@_medium']);
      if (!url) {
        continue;
      }
      if (type?.startsWith('image') || medium === 'image' || url.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return url;
      }
    }
    const htmlSource = summaryHtml || this.readText(item?.description);
    const extracted = this.extractImageFromHtml(htmlSource);
    return extracted || null;
  }

  private extractImageFromHtml(html?: string): string | null {
    if (!html) {
      return null;
    }
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] || null;
  }

  private normalizeSummary(value?: string): string | null {
    if (!value) {
      return null;
    }
    const plain = value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) {
      return null;
    }
    return plain.length > 240 ? `${plain.slice(0, 237)}...` : plain;
  }

  private normalizeDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  private readText(value?: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim();
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record['#text'] === 'string') {
        return record['#text'].trim();
      }
      if (typeof record['__cdata'] === 'string') {
        return record['__cdata'].trim();
      }
    }
    return '';
  }

  private readAuthor(value?: unknown): string {
    if (!value || typeof value !== 'object') {
      return this.readText(value);
    }
    const record = value as Record<string, unknown>;
    if (record.name) {
      return this.readText(record.name);
    }
    return this.readText(record);
  }

  private normalizeArray<T>(value?: T | T[]): T[] {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  private mergeItems(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    const result: NewsItem[] = [];
    for (const item of items) {
      const key = item.link || item.id;
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(item);
    }
    return result;
  }
}
