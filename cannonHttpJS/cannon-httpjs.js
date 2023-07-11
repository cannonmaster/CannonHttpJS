var H = Object.defineProperty;
var j = (h, e, t) => e in h ? H(h, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : h[e] = t;
var n = (h, e, t) => (j(h, typeof e != "symbol" ? e + "" : e, t), t);
let m;
typeof window > "u" ? m = (...h) => import("./index-21ef303e.js").then(
  ({ default: e }) => e(...h)
) : m = window.fetch.bind(window);
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
  kindOfObject(e) {
    return Array.isArray(e) || e === null ? !1 : typeof e == "object";
  }
  kindOfString(e) {
    return typeof e == "string";
  }
  // private kindOf(type: string) {
  //   const toString = Object.prototype.toString;
  //   return function (value: any) {
  //     return (
  //       type.toLowerCase() === toString.call(value).slice(8, -1).toLowerCase()
  //     );
  //   };
  // }
  getOldestEntry() {
    let e = 1 / 0, t;
    for (const [r, p] of this.cache)
      p.expiresAt < e && (e = p.expiresAt, t = r);
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
      method: r = "GET",
      url: p = "",
      params: b = {},
      body: q,
      cache: O,
      credentials: E,
      headers: S,
      integrity: T,
      keepalive: z,
      mode: g,
      redirect: I,
      referrer: C,
      referrerPolicy: L,
      signal: D,
      window: P,
      data: a,
      isFormData: x = !1,
      timeout: R
    } = e, u = new URL(p, this.baseURL);
    Object.keys(b).forEach(
      (s) => u.searchParams.append(s, b[s].toString())
    );
    const o = {
      method: r,
      cache: O,
      credentials: E,
      integrity: T,
      keepalive: z,
      mode: g,
      redirect: I,
      referrer: C,
      referrerPolicy: L,
      window: P,
      headers: S,
      // Apply default headers
      body: q,
      signal: D
    }, w = new AbortController();
    if (D || (o.signal = w.signal), a)
      if (a instanceof FormData)
        o.body = a;
      else {
        if (x) {
          const s = new FormData();
          for (const i in a)
            if (a.hasOwnProperty(i)) {
              const c = a[i];
              if (c instanceof File)
                s.append("file", c);
              else if (c instanceof FileList)
                for (let f = 0; f < c.length; f++) {
                  const d = c[f];
                  s.append("file", d, d.name);
                }
              else
                s.append(i, c);
            }
          o.body = s;
        }
        if (!x && (this.setDefaultHeaders({
          "Content-Type": "application/json; charset=utf-8"
        }), this.kindOfObject(a) && (o.body = JSON.stringify(a)), this.kindOfString(a) && (this.kindOfObject(JSON.parse(a)) && (o.body = a), !this.kindOfObject(JSON.parse(a)))))
          throw new Error("invalid data format");
      }
    o.headers = this.applyDefaultHeaders(
      o.headers
    );
    try {
      let s;
      if (R) {
        const l = new Promise((A, U) => {
          setTimeout(() => {
            w.abort(), U(new Error(`Request timed out after ${R}ms`));
          }, R);
        }), y = m(
          u.href,
          o
        );
        s = await Promise.race([l, y]);
      } else
        s = await m(u.href, o);
      if (!s.ok)
        throw new Error(`Request failed with status ${s.status}`);
      let i;
      const c = s.headers.get("content-type");
      c && c.includes("application/json") ? i = await s.json() : i = await s.text();
      const f = this.sanitizeResponseData(i);
      let d = {
        status: s.status,
        statusText: s.statusText,
        headers: s.headers,
        data: f
      };
      for (const l of this.responseInterceptors)
        d = await l(d);
      if (r === "GET" && this.cacheSize > 0) {
        const l = Date.now() + this.defaultCacheTime;
        if (this.cache.set(u.href, {
          data: d,
          expiresAt: l
        }), this.cache.size > this.cacheSize) {
          const y = this.getOldestEntry();
          y && this.cache.delete(y);
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
    const r = this.cache.get(new URL(e, this.baseURL).href);
    return r && r.expiresAt > Date.now() ? (r.expiresAt = Date.now() + this.defaultCacheTime, Promise.resolve(r.data)) : this.executeRequest({ ...t, url: e, method: "GET" });
  }
  async post(e, t = {}) {
    const r = await this.executeRequest({
      ...t,
      url: e,
      method: "POST"
    });
    return this.invalidateCache(e), r;
  }
  // Add other HTTP methods (e.g., put, patch, delete) as needed
  put(e, t, r = {}) {
    return this.executeRequest({ ...r, url: e, method: "PUT", data: t });
  }
  patch(e, t, r = {}) {
    return this.executeRequest({ ...r, url: e, method: "PATCH", data: t });
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
    for (const r of this.responseSanitizers)
      t = r(t);
    return t;
  }
}
const v = new k();
export {
  v as default
};
