const SPECIAL_SCHEME_RE = /^(https?|ftp|file|wss?):$/;

export class WriteableURL extends URL {
  _proto: string;

  constructor(url: string, base?: string) {
    super(url, base);
    this._proto = this.protocol;
  }

  set protocol(proto: string) {
    this._proto = proto;
  }

  get protocol() {
    return this._proto;
  }

  private replaceProtocol(url: string) {
    const re = new RegExp(`^${super.protocol}`);
    return url.replace(re, this._proto);
  }

  get origin() {
    return this.replaceProtocol(super.origin);
  }

  get href() {
    return this.replaceProtocol(super.href);
  }

  toString() {
    return this.replaceProtocol(super.toString());
  }
}

export function parseUrl(url: string, base?: string) {
  let parsed = new URL(url, base);
  if (SPECIAL_SCHEME_RE.test(parsed.protocol)) {
    return parsed;
  }

  const proto = parsed.protocol;
  const re = new RegExp(`^${proto}`);
  parsed = new WriteableURL(url.replace(re, 'ws:'), base?.replace(re, 'ws:'));
  parsed.protocol = proto;
  return parsed;
}
