var H = Object.defineProperty;
var j = (h, e, t) => e in h ? H(h, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : h[e] = t;
var n = (h, e, t) => (j(h, typeof e != "symbol" ? e + "" : e, t), t);
let y;
typeof window > "u" ? y = (...h) => import("./index-21ef303e.js").then(
  ({ default: e }) => e(...h)
) : y = window.fetch.bind(window);
class k {
  constructor() {
    n(this, "baseURL");
    n(this, "cacheSize", 0);
    n(this, "cache");
    n(this, "defaultCacheTime", 0);
    n(this, "requestInterceptors", []);
    n(this, "responseInterceptors", []);
    n(this, "defaultHeaders", {});
    n(this, "responseSanitizers", []);
    n(this, "maxRetry", 0);
    this.baseURL = void 0, this.cache = /* @__PURE__ */ new Map();
  }
  setCacheSize(e) {
    this.cacheSize = e;
  }
  setRetry(e) {
    this.maxRetry = e;
  }
  setCacheTime(e) {
    e <= 0 || (this.defaultCacheTime = e);
  }
  setBaseUrl(e) {
    this.baseURL = e;
  }
  clearRequestInterceptor(e) {
    e || (this.requestInterceptors = []);
  }
  clearResoponseInterceptor(e) {
    e || (this.responseInterceptors = []);
  }
  addRequestInterceptor(e) {
    this.requestInterceptors.push(e);
  }
  addResponseInterceptor(e) {
    this.responseInterceptors.push(e);
  }
  invalidateCache(e) {
    e ? this.cache.delete(new URL(e, this.baseURL).href) : this.cache.clear();
  }
  kindOf(e) {
    const t = Object.prototype.toString;
    return function(a) {
      return e.toLowerCase() === t.call(a).slice(8, -1).toLowerCase();
    };
  }
  getOldestEntry() {
    let e = 1 / 0, t;
    for (const [a, p] of this.cache)
      p.expiresAt < e && (e = p.expiresAt, t = a);
    return t;
  }
  async executeRequest(e, t = 0) {
    for (const s of this.requestInterceptors)
      try {
        e = await s(e);
      } catch (i) {
        throw new Error(`Request interceptor failed: ${i.message}`);
      }
    const {
      method: a = "GET",
      url: p = "",
      params: b = {},
      body: q,
      cache: E,
      credentials: S,
      headers: T,
      integrity: g,
      keepalive: z,
      mode: O,
      redirect: C,
      referrer: I,
      referrerPolicy: L,
      signal: D,
      window: P,
      data: r,
      isFormData: x = !1,
      timeout: R
    } = e, u = new URL(p, this.baseURL);
    Object.keys(b).forEach(
      (s) => u.searchParams.append(s, b[s].toString())
    );
    const o = {
      method: a,
      cache: E,
      credentials: S,
      integrity: g,
      keepalive: z,
      mode: O,
      redirect: C,
      referrer: I,
      referrerPolicy: L,
      window: P,
      headers: T,
      // Apply default headers
      body: q,
      signal: D
    }, w = new AbortController();
    if (D || (o.signal = w.signal), r)
      if (r instanceof FormData)
        o.body = r;
      else {
        if (x) {
          const s = new FormData();
          for (const i in r)
            if (r.hasOwnProperty(i)) {
              const c = r[i];
              if (c instanceof File)
                s.append("file", c);
              else if (c instanceof FileList)
                for (let l = 0; l < c.length; l++) {
                  const d = c[l];
                  s.append("file", d, d.name);
                }
              else
                s.append(i, c);
            }
          o.body = s;
        }
        if (!x && (this.setDefaultHeaders({
          "Content-Type": "application/json; charset=utf-8"
        }), this.kindOf("object")(r) && (o.body = JSON.stringify(r)), this.kindOf("string")(r) && (this.kindOf("object")(JSON.parse(r)) && (o.body = r), !this.kindOf("object")(JSON.parse(r)))))
          throw new Error("invalid data format");
      }
    o.headers = this.applyDefaultHeaders(
      o.headers
    );
    try {
      let s;
      if (R) {
        const f = new Promise((v, U) => {
          setTimeout(() => {
            w.abort(), U(new Error(`Request timed out after ${R}ms`));
          }, R);
        }), m = y(
          u.href,
          o
        );
        s = await Promise.race([f, m]);
      } else
        s = await y(u.href, o);
      if (!s.ok)
        throw new Error(`Request failed with status ${s.status}`);
      let i;
      const c = s.headers.get("content-type");
      c && c.includes("application/json") ? i = await s.json() : i = await s.text();
      const l = this.sanitizeResponseData(i);
      let d = {
        status: s.status,
        statusText: s.statusText,
        headers: s.headers,
        data: l
      };
      console.log(123123123);
      for (const f of this.responseInterceptors)
        d = await f(d);
      if (a === "GET" && this.cacheSize > 0) {
        const f = Date.now() + this.defaultCacheTime;
        if (this.cache.set(u.href, {
          data: d,
          expiresAt: f
        }), this.cache.size > this.cacheSize) {
          const m = this.getOldestEntry();
          m && this.cache.delete(m);
        }
      }
      return d;
    } catch (s) {
      if (t < this.maxRetry) {
        const i = this.calculateRetryDelay(t);
        return await this.delay(i), this.executeRequest(e, t + 1);
      }
      throw w && w.abort(), new Error(
        `Request failed: ${s.message}, and the request was aborted`
      );
    }
  }
  async delay(e) {
    return new Promise((t) => {
      setTimeout(() => {
        t();
      }, e);
    });
  }
  calculateRetryDelay(e) {
    return 500 * Math.pow(2, e);
  }
  // public async request(config: RequestOptions<T>): Promise<ResponseData<T>> {
  //   return this.executeRequest(config);
  // }
  get(e, t = {}) {
    const a = this.cache.get(new URL(e, this.baseURL).href);
    return a && a.expiresAt > Date.now() ? (a.expiresAt = Date.now() + this.defaultCacheTime, Promise.resolve(a.data)) : this.executeRequest({ ...t, url: e, method: "GET" });
  }
  async post(e, t = {}) {
    const a = await this.executeRequest({
      ...t,
      url: e,
      method: "POST"
    });
    return this.invalidateCache(e), a;
  }
  // Add other HTTP methods (e.g., put, patch, delete) as needed
  put(e, t, a = {}) {
    return this.executeRequest({ ...a, url: e, method: "PUT", data: t });
  }
  patch(e, t, a = {}) {
    return this.executeRequest({ ...a, url: e, method: "PATCH", data: t });
  }
  delete(e, t = {}) {
    return this.executeRequest({ ...t, url: e, method: "DELETE" });
  }
  setDefaultHeaders(e) {
    this.defaultHeaders = { ...this.defaultHeaders, ...e };
  }
  applyDefaultHeaders(e) {
    return { ...this.defaultHeaders, ...e };
  }
  addResponseSanitizer(e) {
    this.responseSanitizers.push(e);
  }
  sanitizeResponseData(e) {
    let t = e;
    for (const a of this.responseSanitizers)
      t = a(t);
    return t;
  }
}
const F = new k();
export {
  F as default
};
