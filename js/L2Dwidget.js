/*! https://github.com/xiazeyu/live2d-widget.js built@2019-4-2 16:24:00 */
var L2Dwidget = function(t) {
    var n = window.webpackJsonpL2Dwidget;
    window.webpackJsonpL2Dwidget = function(e, r, i) {
        for (var c, a, u = 0, s = []; u < e.length; u++)
            a = e[u],
            o[a] && s.push(o[a][0]),
            o[a] = 0;
        for (c in r)
            Object.prototype.hasOwnProperty.call(r, c) && (t[c] = r[c]);
        for (n && n(e, r, i); s.length; )
            s.shift()()
    }
    ;
    var e = {}
      , o = {
        1: 0
    };
    function r(n) {
        if (e[n])
            return e[n].exports;
        var o = e[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return t[n].call(o.exports, o, o.exports, r),
        o.l = !0,
        o.exports
    }
    return r.e = function(t) {
        var n = o[t];
        if (0 === n)
            return new Promise(function(t) {
                t()
            }
            );
        if (n)
            return n[2];
        var e = new Promise(function(e, r) {
            n = o[t] = [e, r]
        }
        );
        n[2] = e;
        var i = document.getElementsByTagName("head")[0]
          , c = document.createElement("script");
        c.type = "text/javascript",
        c.charset = "utf-8",
        c.async = !0,
        c.timeout = 12e4,
        r.nc && c.setAttribute("nonce", r.nc),
        c.src = r.p + "L2Dwidget." + t + ".min.js";
        var a = setTimeout(u, 12e4);
        function u() {
            c.onerror = c.onload = null,
            clearTimeout(a);
            var n = o[t];
            0 !== n && (n && n[1](new Error("Loading chunk " + t + " failed.")),
            o[t] = void 0)
        }
        return c.onerror = c.onload = u,
        i.appendChild(c),
        e
    }
    ,
    r.m = t,
    r.c = e,
    r.d = function(t, n, e) {
        r.o(t, n) || Object.defineProperty(t, n, {
            configurable: !1,
            enumerable: !0,
            get: e
        })
    }
    ,
    r.n = function(t) {
        var n = t && t.__esModule ? function() {
            return t.default
        }
        : function() {
            return t
        }
        ;
        return r.d(n, "a", n),
        n
    }
    ,
    r.o = function(t, n) {
        return Object.prototype.hasOwnProperty.call(t, n)
    }
    ,
    r.p = "",
    r.oe = function(t) {
        throw console.error(t),
        t
    }
    ,
    r(r.s = 41)
}([function(t, n, e) {
    var o = e(16)("wks")
      , r = e(18)
      , i = e(1).Symbol
      , c = "function" == typeof i;
    (t.exports = function(t) {
        return o[t] || (o[t] = c && i[t] || (c ? i : r)("Symbol." + t))
    }
    ).store = o
}
, function(t, n) {
    var e = t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
    "number" == typeof __g && (__g = e)
}
, function(t, n) {
    var e = t.exports = {
        version: "2.6.5"
    };
    "number" == typeof __e && (__e = e)
}
, function(t, n, e) {
    var o = e(6);
    t.exports = function(t) {
        if (!o(t))
            throw TypeError(t + " is not an object!");
        return t
    }
}
, function(t, n, e) {
    var o = e(10)
      , r = e(29);
    t.exports = e(7) ? function(t, n, e) {
        return o.f(t, n, r(1, e))
    }
    : function(t, n, e) {
        return t[n] = e,
        t
    }
}
, function(t, n, e) {
    var o = e(1)
      , r = e(4)
      , i = e(11)
      , c = e(18)("src")
      , a = e(46)
      , u = ("" + a).split("toString");
    e(2).inspectSource = function(t) {
        return a.call(t)
    }
    ,
    (t.exports = function(t, n, e, a) {
        var s = "function" == typeof e;
        s && (i(e, "name") || r(e, "name", n)),
        t[n] !== e && (s && (i(e, c) || r(e, c, t[n] ? "" + t[n] : u.join(String(n)))),
        t === o ? t[n] = e : a ? t[n] ? t[n] = e : r(t, n, e) : (delete t[n],
        r(t, n, e)))
    }
    )(Function.prototype, "toString", function() {
        return "function" == typeof this && this[c] || a.call(this)
    })
}
, function(t, n) {
    t.exports = function(t) {
        return "object" == typeof t ? null !== t : "function" == typeof t
    }
}
, function(t, n, e) {
    t.exports = !e(28)(function() {
        return 7 != Object.defineProperty({}, "a", {
            get: function() {
                return 7
            }
        }).a
    })
}
, function(t, n) {
    t.exports = {}
}
, function(t, n) {
    var e = {}.toString;
    t.exports = function(t) {
        return e.call(t).slice(8, -1)
    }
}
, function(t, n, e) {
    var o = e(3)
      , r = e(44)
      , i = e(45)
      , c = Object.defineProperty;
    n.f = e(7) ? Object.defineProperty : function(t, n, e) {
        if (o(t),
        n = i(n, !0),
        o(e),
        r)
            try {
                return c(t, n, e)
            } catch (t) {}
        if ("get"in e || "set"in e)
            throw TypeError("Accessors not supported!");
        return "value"in e && (t[n] = e.value),
        t
    }
}
, function(t, n) {
    var e = {}.hasOwnProperty;
    t.exports = function(t, n) {
        return e.call(t, n)
    }
}
, function(t, n, e) {
    var o = e(1)
      , r = e(2)
      , i = e(4)
      , c = e(5)
      , a = e(13)
      , u = function(t, n, e) {
        var s, f, l, p, d = t & u.F, v = t & u.G, h = t & u.S, y = t & u.P, m = t & u.B, b = v ? o : h ? o[n] || (o[n] = {}) : (o[n] || {}).prototype, g = v ? r : r[n] || (r[n] = {}), w = g.prototype || (g.prototype = {});
        for (s in v && (e = n),
        e)
            l = ((f = !d && b && void 0 !== b[s]) ? b : e)[s],
            p = m && f ? a(l, o) : y && "function" == typeof l ? a(Function.call, l) : l,
            b && c(b, s, l, t & u.U),
            g[s] != l && i(g, s, p),
            y && w[s] != l && (w[s] = l)
    };
    o.core = r,
    u.F = 1,
    u.G = 2,
    u.S = 4,
    u.P = 8,
    u.B = 16,
    u.W = 32,
    u.U = 64,
    u.R = 128,
    t.exports = u
}
, function(t, n, e) {
    var o = e(14);
    t.exports = function(t, n, e) {
        if (o(t),
        void 0 === n)
            return t;
        switch (e) {
        case 1:
            return function(e) {
                return t.call(n, e)
            }
            ;
        case 2:
            return function(e, o) {
                return t.call(n, e, o)
            }
            ;
        case 3:
            return function(e, o, r) {
                return t.call(n, e, o, r)
            }
        }
        return function() {
            return t.apply(n, arguments)
        }
    }
}
, function(t, n) {
    t.exports = function(t) {
        if ("function" != typeof t)
            throw TypeError(t + " is not a function!");
        return t
    }
}
, function(t, n, e) {
    var o = e(9)
      , r = e(0)("toStringTag")
      , i = "Arguments" == o(function() {
        return arguments
    }());
    t.exports = function(t) {
        var n, e, c;
        return void 0 === t ? "Undefined" : null === t ? "Null" : "string" == typeof (e = function(t, n) {
            try {
                return t[n]
            } catch (t) {}
        }(n = Object(t), r)) ? e : i ? o(n) : "Object" == (c = o(n)) && "function" == typeof n.callee ? "Arguments" : c
    }
}
, function(t, n, e) {
    var o = e(2)
      , r = e(1)
      , i = r["__core-js_shared__"] || (r["__core-js_shared__"] = {});
    (t.exports = function(t, n) {
        return i[t] || (i[t] = void 0 !== n ? n : {})
    }
    )("versions", []).push({
        version: o.version,
        mode: e(17) ? "pure" : "global",
        copyright: "© 2019 Denis Pushkarev (zloirock.ru)"
    })
}
, function(t, n) {
    t.exports = !1
}
, function(t, n) {
    var e = 0
      , o = Math.random();
    t.exports = function(t) {
        return "Symbol(".concat(void 0 === t ? "" : t, ")_", (++e + o).toString(36))
    }
}
, function(t, n, e) {
    var o = e(6)
      , r = e(1).document
      , i = o(r) && o(r.createElement);
    t.exports = function(t) {
        return i ? r.createElement(t) : {}
    }
}
, function(t, n) {
    var e = Math.ceil
      , o = Math.floor;
    t.exports = function(t) {
        return isNaN(t = +t) ? 0 : (t > 0 ? o : e)(t)
    }
}
, function(t, n) {
    t.exports = function(t) {
        if (void 0 == t)
            throw TypeError("Can't call method on  " + t);
        return t
    }
}
, function(t, n, e) {
    var o = e(53)
      , r = e(21);
    t.exports = function(t) {
        return o(r(t))
    }
}
, function(t, n, e) {
    var o = e(16)("keys")
      , r = e(18);
    t.exports = function(t) {
        return o[t] || (o[t] = r(t))
    }
}
, function(t, n, e) {
    var o = e(10).f
      , r = e(11)
      , i = e(0)("toStringTag");
    t.exports = function(t, n, e) {
        t && !r(t = e ? t : t.prototype, i) && o(t, i, {
            configurable: !0,
            value: n
        })
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(14);
    t.exports.f = function(t) {
        return new function(t) {
            var n, e;
            this.promise = new t(function(t, o) {
                if (void 0 !== n || void 0 !== e)
                    throw TypeError("Bad Promise constructor");
                n = t,
                e = o
            }
            ),
            this.resolve = o(n),
            this.reject = o(e)
        }
        (t)
    }
}
, function(t, n, e) {
    "use strict";
    Object.defineProperty(n, "__esModule", {
        value: !0
    }),
    n.config = n.configApplyer = void 0;
    var o = i(e(77))
      , r = i(e(78));
    function i(t) {
        return t && t.__esModule ? t : {
            default: t
        }
    }
    var c = {};
    n.configApplyer = function(t) {
        (0,
        r.default)(c, t, o.default)
    }
    ,
    n.config = c
}
, function(t, n, e) {
    "use strict";
    Object.defineProperty(n, "__esModule", {
        value: !0
    }),
    n.L2Dwidget = void 0;
    var o = function() {
        function t(t, n) {
            for (var e = 0; e < n.length; e++) {
                var o = n[e];
                o.enumerable = o.enumerable || !1,
                o.configurable = !0,
                "value"in o && (o.writable = !0),
                Object.defineProperty(t, o.key, o)
            }
        }
        return function(n, e, o) {
            return e && t(n.prototype, e),
            o && t(n, o),
            n
        }
    }()
      , r = c(e(39))
      , i = e(26);
    c(e(40));
    function c(t) {
        return t && t.__esModule ? t : {
            default: t
        }
    }
    var a = void 0
      , u = new (function() {
        function t() {
            !function(t, n) {
                if (!(t instanceof n))
                    throw new TypeError("Cannot call a class as a function")
            }(this, t),
            this.eventHandlers = {},
            this.config = i.config
        }
        return o(t, [{
            key: "on",
            value: function(t, n) {
                if ("function" != typeof n)
                    throw new TypeError("Event handler is not a function.");
                return this.eventHandlers[t] || (this.eventHandlers[t] = []),
                this.eventHandlers[t].push(n),
                this
            }
        }, {
            key: "emit",
            value: function(t) {
                for (var n = arguments.length, e = Array(n > 1 ? n - 1 : 0), o = 1; o < n; o++)
                    e[o - 1] = arguments[o];
                return this.eventHandlers[t] && this.eventHandlers[t].forEach(function(t) {
                    "function" == typeof t && t.apply(void 0, e)
                }),
                this.eventHandlers["*"] && this.eventHandlers["*"].forEach(function(n) {
                    "function" == typeof n && n.apply(void 0, [t].concat(e))
                }),
                this
            }
        }, {
            key: "init",
            value: function() {
                var t = this
                  , n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                (0,
                i.configApplyer)(n),
                this.emit("config", this.config),
                !i.config.mobile.show && r.default.mobile() || e.e(0).then(e.bind(null, 79)).then(function(n) {
                    (a = n).theRealInit(t)
                }).catch(function(t) {
                    console.error(t)
                })
            }
        }, {
            key: "captureFrame",
            value: function(t) {
                return a.captureFrame(t)
            }
        }, {
            key: "downloadFrame",
            value: function() {
                this.captureFrame(function(t) {
                    var n = document.createElement("a");
                    document.body.appendChild(n),
                    n.setAttribute("type", "hidden"),
                    n.href = t,
                    n.download = "live2d.png",
                    n.click()
                })
            }
        }]),
        t
    }());
    n.L2Dwidget = u
}
, function(t, n) {
    t.exports = function(t) {
        try {
            return !!t()
        } catch (t) {
            return !0
        }
    }
}
, function(t, n) {
    t.exports = function(t, n) {
        return {
            enumerable: !(1 & t),
            configurable: !(2 & t),
            writable: !(4 & t),
            value: n
        }
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(17)
      , r = e(12)
      , i = e(5)
      , c = e(4)
      , a = e(8)
      , u = e(49)
      , s = e(24)
      , f = e(56)
      , l = e(0)("iterator")
      , p = !([].keys && "next"in [].keys())
      , d = function() {
        return this
    };
    t.exports = function(t, n, e, v, h, y, m) {
        u(e, n, v);
        var b, g, w, x = function(t) {
            if (!p && t in S)
                return S[t];
            switch (t) {
            case "keys":
            case "values":
                return function() {
                    return new e(this,t)
                }
            }
            return function() {
                return new e(this,t)
            }
        }, _ = n + " Iterator", P = "values" == h, k = !1, S = t.prototype, O = S[l] || S["@@iterator"] || h && S[h], j = O || x(h), T = h ? P ? x("entries") : j : void 0, L = "Array" == n && S.entries || O;
        if (L && (w = f(L.call(new t))) !== Object.prototype && w.next && (s(w, _, !0),
        o || "function" == typeof w[l] || c(w, l, d)),
        P && O && "values" !== O.name && (k = !0,
        j = function() {
            return O.call(this)
        }
        ),
        o && !m || !p && !k && S[l] || c(S, l, j),
        a[n] = j,
        a[_] = d,
        h)
            if (b = {
                values: P ? j : x("values"),
                keys: y ? j : x("keys"),
                entries: T
            },
            m)
                for (g in b)
                    g in S || i(S, g, b[g]);
            else
                r(r.P + r.F * (p || k), n, b);
        return b
    }
}
, function(t, n, e) {
    var o = e(52)
      , r = e(33);
    t.exports = Object.keys || function(t) {
        return o(t, r)
    }
}
, function(t, n, e) {
    var o = e(20)
      , r = Math.min;
    t.exports = function(t) {
        return t > 0 ? r(o(t), 9007199254740991) : 0
    }
}
, function(t, n) {
    t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")
}
, function(t, n, e) {
    var o = e(1).document;
    t.exports = o && o.documentElement
}
, function(t, n, e) {
    var o = e(3)
      , r = e(14)
      , i = e(0)("species");
    t.exports = function(t, n) {
        var e, c = o(t).constructor;
        return void 0 === c || void 0 == (e = o(c)[i]) ? n : r(e)
    }
}
, function(t, n, e) {
    var o, r, i, c = e(13), a = e(68), u = e(34), s = e(19), f = e(1), l = f.process, p = f.setImmediate, d = f.clearImmediate, v = f.MessageChannel, h = f.Dispatch, y = 0, m = {}, b = function() {
        var t = +this;
        if (m.hasOwnProperty(t)) {
            var n = m[t];
            delete m[t],
            n()
        }
    }, g = function(t) {
        b.call(t.data)
    };
    p && d || (p = function(t) {
        for (var n = [], e = 1; arguments.length > e; )
            n.push(arguments[e++]);
        return m[++y] = function() {
            a("function" == typeof t ? t : Function(t), n)
        }
        ,
        o(y),
        y
    }
    ,
    d = function(t) {
        delete m[t]
    }
    ,
    "process" == e(9)(l) ? o = function(t) {
        l.nextTick(c(b, t, 1))
    }
    : h && h.now ? o = function(t) {
        h.now(c(b, t, 1))
    }
    : v ? (i = (r = new v).port2,
    r.port1.onmessage = g,
    o = c(i.postMessage, i, 1)) : f.addEventListener && "function" == typeof postMessage && !f.importScripts ? (o = function(t) {
        f.postMessage(t + "", "*")
    }
    ,
    f.addEventListener("message", g, !1)) : o = "onreadystatechange"in s("script") ? function(t) {
        u.appendChild(s("script")).onreadystatechange = function() {
            u.removeChild(this),
            b.call(t)
        }
    }
    : function(t) {
        setTimeout(c(b, t, 1), 0)
    }
    ),
    t.exports = {
        set: p,
        clear: d
    }
}
, function(t, n) {
    t.exports = function(t) {
        try {
            return {
                e: !1,
                v: t()
            }
        } catch (t) {
            return {
                e: !0,
                v: t
            }
        }
    }
}
, function(t, n, e) {
    var o = e(3)
      , r = e(6)
      , i = e(25);
    t.exports = function(t, n) {
        if (o(t),
        r(n) && n.constructor === t)
            return n;
        var e = i.f(t);
        return (0,
        e.resolve)(n),
        e.promise
    }
}
, function(t, n, e) {
    "use strict";
    Object.defineProperty(n, "__esModule", {
        value: !0
    });
    var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
        return typeof t
    }
    : function(t) {
        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
    }
      , r = window.device
      , i = {}
      , c = [];
    window.device = i;
    var a = window.document.documentElement
      , u = window.navigator.userAgent.toLowerCase()
      , s = ["googletv", "viera", "smarttv", "internet.tv", "netcast", "nettv", "appletv", "boxee", "kylo", "roku", "dlnadoc", "pov_tv", "hbbtv", "ce-html"];
    function f(t) {
        return -1 !== u.indexOf(t)
    }
    function l(t) {
        return a.className.match(new RegExp(t,"i"))
    }
    function p(t) {
        var n = null;
        l(t) || (n = a.className.replace(/^\s+|\s+$/g, ""),
        a.className = n + " " + t)
    }
    function d(t) {
        l(t) && (a.className = a.className.replace(" " + t, ""))
    }
    function v() {
        i.landscape() ? (d("portrait"),
        p("landscape"),
        h("landscape")) : (d("landscape"),
        p("portrait"),
        h("portrait")),
        b()
    }
    function h(t) {
        for (var n in c)
            c[n](t)
    }
    i.macos = function() {
        return f("mac")
    }
    ,
    i.ios = function() {
        return i.iphone() || i.ipod() || i.ipad()
    }
    ,
    i.iphone = function() {
        return !i.windows() && f("iphone")
    }
    ,
    i.ipod = function() {
        return f("ipod")
    }
    ,
    i.ipad = function() {
        return f("ipad")
    }
    ,
    i.android = function() {
        return !i.windows() && f("android")
    }
    ,
    i.androidPhone = function() {
        return i.android() && f("mobile")
    }
    ,
    i.androidTablet = function() {
        return i.android() && !f("mobile")
    }
    ,
    i.blackberry = function() {
        return f("blackberry") || f("bb10") || f("rim")
    }
    ,
    i.blackberryPhone = function() {
        return i.blackberry() && !f("tablet")
    }
    ,
    i.blackberryTablet = function() {
        return i.blackberry() && f("tablet")
    }
    ,
    i.windows = function() {
        return f("windows")
    }
    ,
    i.windowsPhone = function() {
        return i.windows() && f("phone")
    }
    ,
    i.windowsTablet = function() {
        return i.windows() && f("touch") && !i.windowsPhone()
    }
    ,
    i.fxos = function() {
        return (f("(mobile") || f("(tablet")) && f(" rv:")
    }
    ,
    i.fxosPhone = function() {
        return i.fxos() && f("mobile")
    }
    ,
    i.fxosTablet = function() {
        return i.fxos() && f("tablet")
    }
    ,
    i.meego = function() {
        return f("meego")
    }
    ,
    i.cordova = function() {
        return window.cordova && "file:" === location.protocol
    }
    ,
    i.nodeWebkit = function() {
        return "object" === o(window.process)
    }
    ,
    i.mobile = function() {
        return i.androidPhone() || i.iphone() || i.ipod() || i.windowsPhone() || i.blackberryPhone() || i.fxosPhone() || i.meego()
    }
    ,
    i.tablet = function() {
        return i.ipad() || i.androidTablet() || i.blackberryTablet() || i.windowsTablet() || i.fxosTablet()
    }
    ,
    i.desktop = function() {
        return !i.tablet() && !i.mobile()
    }
    ,
    i.television = function() {
        for (var t = 0; t < s.length; ) {
            if (f(s[t]))
                return !0;
            t++
        }
        return !1
    }
    ,
    i.portrait = function() {
        return screen.orientation && Object.prototype.hasOwnProperty.call(window, "onorientationchange") ? screen.orientation.type.includes("portrait") : window.innerHeight / window.innerWidth > 1
    }
    ,
    i.landscape = function() {
        return screen.orientation && Object.prototype.hasOwnProperty.call(window, "onorientationchange") ? screen.orientation.type.includes("landscape") : window.innerHeight / window.innerWidth < 1
    }
    ,
    i.noConflict = function() {
        return window.device = r,
        this
    }
    ,
    i.ios() ? i.ipad() ? p("ios ipad tablet") : i.iphone() ? p("ios iphone mobile") : i.ipod() && p("ios ipod mobile") : i.macos() ? p("macos desktop") : i.android() ? i.androidTablet() ? p("android tablet") : p("android mobile") : i.blackberry() ? i.blackberryTablet() ? p("blackberry tablet") : p("blackberry mobile") : i.windows() ? i.windowsTablet() ? p("windows tablet") : i.windowsPhone() ? p("windows mobile") : p("windows desktop") : i.fxos() ? i.fxosTablet() ? p("fxos tablet") : p("fxos mobile") : i.meego() ? p("meego mobile") : i.nodeWebkit() ? p("node-webkit") : i.television() ? p("television") : i.desktop() && p("desktop"),
    i.cordova() && p("cordova"),
    i.onChangeOrientation = function(t) {
        "function" == typeof t && c.push(t)
    }
    ;
    var y = "resize";
    function m(t) {
        for (var n = 0; n < t.length; n++)
            if (i[t[n]]())
                return t[n];
        return "unknown"
    }
    function b() {
        i.orientation = m(["portrait", "landscape"])
    }
    Object.prototype.hasOwnProperty.call(window, "onorientationchange") && (y = "orientationchange"),
    window.addEventListener ? window.addEventListener(y, v, !1) : window.attachEvent ? window.attachEvent(y, v) : window[y] = v,
    v(),
    i.type = m(["mobile", "tablet", "desktop"]),
    i.os = m(["ios", "iphone", "ipad", "ipod", "android", "blackberry", "windows", "fxos", "meego", "television"]),
    b(),
    n.default = i
}
, function(t, n, e) {
    "use strict";
    var o = e(26)
      , r = e(27);
    document.head.innerHTML += "\n<style>\n  .live2d-widget-dialog-container {\n    width: 300px;\n    height: 120px;\n    position: absolute;\n    bottom: 65%;\n    right: 0px;\n    transform-origin: right;\n    padding: 12px;\n    box-sizing: border-box;\n    -webkit-font-smoothing: antialiased;\n  }\n  .live2d-widget-dialog {\n    width: 100%;\n    height: 100%;\n    color: #917159;\n    font-size: 16px;\n    padding: 12px;\n    border: 2px solid rgb(236, 203, 180);\n    background: rgba(236, 203, 180, 0.14);\n    box-sizing: border-box;\n    border-radius: 10px;\n    transform: rotate(-2deg);\n    opacity: 0;\n    transition: 200ms opacity;\n    box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px;\n    animation: live2d-widget-dialog-tingle 4s ease-in-out 0s infinite alternate;\n  }\n  @keyframes live2d-widget-dialog-tingle {\n    0% { transform: translate(-1px, 1.5px) rotate(-2deg); }\n    100% { transform: translate(1px, -1.5px) rotate(2deg); }\n  }\n</style>\n";
    var i = void 0
      , c = void 0
      , a = void 0;
    function u() {
        c.style.opacity = 1
    }
    function s() {
        c.style.opacity = 0
    }
    function f(t) {
        u(),
        c.innerText = t,
        clearTimeout(a),
        a = setTimeout(function() {
            s()
        }, 5e3)
    }
    function l() {
        var t = new XMLHttpRequest;
        t.open("get", "https://v1.hitokoto.cn"),
        t.setRequestHeader("Cache-Control", "no-cache"),
        t.onreadystatechange = function() {
            4 === t.readyState && (f(JSON.parse(t.responseText).hitokoto),
            setTimeout(l, 1e4))
        }
        ,
        t.send()
    }
    t.exports = {
        createDialogElement: function(t) {
            (i = document.createElement("div")).className = "live2d-widget-dialog-container",
            i.style.transform = "scale(" + o.config.display.width / 250 + ")",
            (c = document.createElement("div")).className = "live2d-widget-dialog",
            i.appendChild(c),
            t.appendChild(i),
            r.L2Dwidget.emit("create-dialog", i),
            o.config.dialog.hitokoto && l()
        },
        displayDialog: u,
        hiddenDialog: s,
        alertText: f,
        showHitokotoLoop: l
    }
}
, function(t, n, e) {
    e(42),
    e(76),
    t.exports = e(27)
}
, function(t, n, e) {
    e(43),
    e(47),
    e(58),
    e(62),
    e(74),
    e(75),
    t.exports = e(2).Promise
}
, function(t, n, e) {
    "use strict";
    var o = e(15)
      , r = {};
    r[e(0)("toStringTag")] = "z",
    r + "" != "[object z]" && e(5)(Object.prototype, "toString", function() {
        return "[object " + o(this) + "]"
    }, !0)
}
, function(t, n, e) {
    t.exports = !e(7) && !e(28)(function() {
        return 7 != Object.defineProperty(e(19)("div"), "a", {
            get: function() {
                return 7
            }
        }).a
    })
}
, function(t, n, e) {
    var o = e(6);
    t.exports = function(t, n) {
        if (!o(t))
            return t;
        var e, r;
        if (n && "function" == typeof (e = t.toString) && !o(r = e.call(t)))
            return r;
        if ("function" == typeof (e = t.valueOf) && !o(r = e.call(t)))
            return r;
        if (!n && "function" == typeof (e = t.toString) && !o(r = e.call(t)))
            return r;
        throw TypeError("Can't convert object to primitive value")
    }
}
, function(t, n, e) {
    t.exports = e(16)("native-function-to-string", Function.toString)
}
, function(t, n, e) {
    "use strict";
    var o = e(48)(!0);
    e(30)(String, "String", function(t) {
        this._t = String(t),
        this._i = 0
    }, function() {
        var t, n = this._t, e = this._i;
        return e >= n.length ? {
            value: void 0,
            done: !0
        } : (t = o(n, e),
        this._i += t.length,
        {
            value: t,
            done: !1
        })
    })
}
, function(t, n, e) {
    var o = e(20)
      , r = e(21);
    t.exports = function(t) {
        return function(n, e) {
            var i, c, a = String(r(n)), u = o(e), s = a.length;
            return u < 0 || u >= s ? t ? "" : void 0 : (i = a.charCodeAt(u)) < 55296 || i > 56319 || u + 1 === s || (c = a.charCodeAt(u + 1)) < 56320 || c > 57343 ? t ? a.charAt(u) : i : t ? a.slice(u, u + 2) : c - 56320 + (i - 55296 << 10) + 65536
        }
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(50)
      , r = e(29)
      , i = e(24)
      , c = {};
    e(4)(c, e(0)("iterator"), function() {
        return this
    }),
    t.exports = function(t, n, e) {
        t.prototype = o(c, {
            next: r(1, e)
        }),
        i(t, n + " Iterator")
    }
}
, function(t, n, e) {
    var o = e(3)
      , r = e(51)
      , i = e(33)
      , c = e(23)("IE_PROTO")
      , a = function() {}
      , u = function() {
        var t, n = e(19)("iframe"), o = i.length;
        for (n.style.display = "none",
        e(34).appendChild(n),
        n.src = "javascript:",
        (t = n.contentWindow.document).open(),
        t.write("<script>document.F=Object<\/script>"),
        t.close(),
        u = t.F; o--; )
            delete u.prototype[i[o]];
        return u()
    };
    t.exports = Object.create || function(t, n) {
        var e;
        return null !== t ? (a.prototype = o(t),
        e = new a,
        a.prototype = null,
        e[c] = t) : e = u(),
        void 0 === n ? e : r(e, n)
    }
}
, function(t, n, e) {
    var o = e(10)
      , r = e(3)
      , i = e(31);
    t.exports = e(7) ? Object.defineProperties : function(t, n) {
        r(t);
        for (var e, c = i(n), a = c.length, u = 0; a > u; )
            o.f(t, e = c[u++], n[e]);
        return t
    }
}
, function(t, n, e) {
    var o = e(11)
      , r = e(22)
      , i = e(54)(!1)
      , c = e(23)("IE_PROTO");
    t.exports = function(t, n) {
        var e, a = r(t), u = 0, s = [];
        for (e in a)
            e != c && o(a, e) && s.push(e);
        for (; n.length > u; )
            o(a, e = n[u++]) && (~i(s, e) || s.push(e));
        return s
    }
}
, function(t, n, e) {
    var o = e(9);
    t.exports = Object("z").propertyIsEnumerable(0) ? Object : function(t) {
        return "String" == o(t) ? t.split("") : Object(t)
    }
}
, function(t, n, e) {
    var o = e(22)
      , r = e(32)
      , i = e(55);
    t.exports = function(t) {
        return function(n, e, c) {
            var a, u = o(n), s = r(u.length), f = i(c, s);
            if (t && e != e) {
                for (; s > f; )
                    if ((a = u[f++]) != a)
                        return !0
            } else
                for (; s > f; f++)
                    if ((t || f in u) && u[f] === e)
                        return t || f || 0;
            return !t && -1
        }
    }
}
, function(t, n, e) {
    var o = e(20)
      , r = Math.max
      , i = Math.min;
    t.exports = function(t, n) {
        return (t = o(t)) < 0 ? r(t + n, 0) : i(t, n)
    }
}
, function(t, n, e) {
    var o = e(11)
      , r = e(57)
      , i = e(23)("IE_PROTO")
      , c = Object.prototype;
    t.exports = Object.getPrototypeOf || function(t) {
        return t = r(t),
        o(t, i) ? t[i] : "function" == typeof t.constructor && t instanceof t.constructor ? t.constructor.prototype : t instanceof Object ? c : null
    }
}
, function(t, n, e) {
    var o = e(21);
    t.exports = function(t) {
        return Object(o(t))
    }
}
, function(t, n, e) {
    for (var o = e(59), r = e(31), i = e(5), c = e(1), a = e(4), u = e(8), s = e(0), f = s("iterator"), l = s("toStringTag"), p = u.Array, d = {
        CSSRuleList: !0,
        CSSStyleDeclaration: !1,
        CSSValueList: !1,
        ClientRectList: !1,
        DOMRectList: !1,
        DOMStringList: !1,
        DOMTokenList: !0,
        DataTransferItemList: !1,
        FileList: !1,
        HTMLAllCollection: !1,
        HTMLCollection: !1,
        HTMLFormElement: !1,
        HTMLSelectElement: !1,
        MediaList: !0,
        MimeTypeArray: !1,
        NamedNodeMap: !1,
        NodeList: !0,
        PaintRequestList: !1,
        Plugin: !1,
        PluginArray: !1,
        SVGLengthList: !1,
        SVGNumberList: !1,
        SVGPathSegList: !1,
        SVGPointList: !1,
        SVGStringList: !1,
        SVGTransformList: !1,
        SourceBufferList: !1,
        StyleSheetList: !0,
        TextTrackCueList: !1,
        TextTrackList: !1,
        TouchList: !1
    }, v = r(d), h = 0; h < v.length; h++) {
        var y, m = v[h], b = d[m], g = c[m], w = g && g.prototype;
        if (w && (w[f] || a(w, f, p),
        w[l] || a(w, l, m),
        u[m] = p,
        b))
            for (y in o)
                w[y] || i(w, y, o[y], !0)
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(60)
      , r = e(61)
      , i = e(8)
      , c = e(22);
    t.exports = e(30)(Array, "Array", function(t, n) {
        this._t = c(t),
        this._i = 0,
        this._k = n
    }, function() {
        var t = this._t
          , n = this._k
          , e = this._i++;
        return !t || e >= t.length ? (this._t = void 0,
        r(1)) : r(0, "keys" == n ? e : "values" == n ? t[e] : [e, t[e]])
    }, "values"),
    i.Arguments = i.Array,
    o("keys"),
    o("values"),
    o("entries")
}
, function(t, n, e) {
    var o = e(0)("unscopables")
      , r = Array.prototype;
    void 0 == r[o] && e(4)(r, o, {}),
    t.exports = function(t) {
        r[o][t] = !0
    }
}
, function(t, n) {
    t.exports = function(t, n) {
        return {
            value: n,
            done: !!t
        }
    }
}
, function(t, n, e) {
    "use strict";
    var o, r, i, c, a = e(17), u = e(1), s = e(13), f = e(15), l = e(12), p = e(6), d = e(14), v = e(63), h = e(64), y = e(35), m = e(36).set, b = e(69)(), g = e(25), w = e(37), x = e(70), _ = e(38), P = u.TypeError, k = u.process, S = k && k.versions, O = S && S.v8 || "", j = u.Promise, T = "process" == f(k), L = function() {}, E = r = g.f, M = !!function() {
        try {
            var t = j.resolve(1)
              , n = (t.constructor = {})[e(0)("species")] = function(t) {
                t(L, L)
            }
            ;
            return (T || "function" == typeof PromiseRejectionEvent) && t.then(L)instanceof n && 0 !== O.indexOf("6.6") && -1 === x.indexOf("Chrome/66")
        } catch (t) {}
    }(), A = function(t) {
        var n;
        return !(!p(t) || "function" != typeof (n = t.then)) && n
    }, C = function(t, n) {
        if (!t._n) {
            t._n = !0;
            var e = t._c;
            b(function() {
                for (var o = t._v, r = 1 == t._s, i = 0, c = function(n) {
                    var e, i, c, a = r ? n.ok : n.fail, u = n.resolve, s = n.reject, f = n.domain;
                    try {
                        a ? (r || (2 == t._h && H(t),
                        t._h = 1),
                        !0 === a ? e = o : (f && f.enter(),
                        e = a(o),
                        f && (f.exit(),
                        c = !0)),
                        e === n.promise ? s(P("Promise-chain cycle")) : (i = A(e)) ? i.call(e, u, s) : u(e)) : s(o)
                    } catch (t) {
                        f && !c && f.exit(),
                        s(t)
                    }
                }; e.length > i; )
                    c(e[i++]);
                t._c = [],
                t._n = !1,
                n && !t._h && F(t)
            })
        }
    }, F = function(t) {
        m.call(u, function() {
            var n, e, o, r = t._v, i = D(t);
            if (i && (n = w(function() {
                T ? k.emit("unhandledRejection", r, t) : (e = u.onunhandledrejection) ? e({
                    promise: t,
                    reason: r
                }) : (o = u.console) && o.error && o.error("Unhandled promise rejection", r)
            }),
            t._h = T || D(t) ? 2 : 1),
            t._a = void 0,
            i && n.e)
                throw n.v
        })
    }, D = function(t) {
        return 1 !== t._h && 0 === (t._a || t._c).length
    }, H = function(t) {
        m.call(u, function() {
            var n;
            T ? k.emit("rejectionHandled", t) : (n = u.onrejectionhandled) && n({
                promise: t,
                reason: t._v
            })
        })
    }, N = function(t) {
        var n = this;
        n._d || (n._d = !0,
        (n = n._w || n)._v = t,
        n._s = 2,
        n._a || (n._a = n._c.slice()),
        C(n, !0))
    }, R = function(t) {
        var n, e = this;
        if (!e._d) {
            e._d = !0,
            e = e._w || e;
            try {
                if (e === t)
                    throw P("Promise can't be resolved itself");
                (n = A(t)) ? b(function() {
                    var o = {
                        _w: e,
                        _d: !1
                    };
                    try {
                        n.call(t, s(R, o, 1), s(N, o, 1))
                    } catch (t) {
                        N.call(o, t)
                    }
                }) : (e._v = t,
                e._s = 1,
                C(e, !1))
            } catch (t) {
                N.call({
                    _w: e,
                    _d: !1
                }, t)
            }
        }
    };
    M || (j = function(t) {
        v(this, j, "Promise", "_h"),
        d(t),
        o.call(this);
        try {
            t(s(R, this, 1), s(N, this, 1))
        } catch (t) {
            N.call(this, t)
        }
    }
    ,
    (o = function(t) {
        this._c = [],
        this._a = void 0,
        this._s = 0,
        this._d = !1,
        this._v = void 0,
        this._h = 0,
        this._n = !1
    }
    ).prototype = e(71)(j.prototype, {
        then: function(t, n) {
            var e = E(y(this, j));
            return e.ok = "function" != typeof t || t,
            e.fail = "function" == typeof n && n,
            e.domain = T ? k.domain : void 0,
            this._c.push(e),
            this._a && this._a.push(e),
            this._s && C(this, !1),
            e.promise
        },
        catch: function(t) {
            return this.then(void 0, t)
        }
    }),
    i = function() {
        var t = new o;
        this.promise = t,
        this.resolve = s(R, t, 1),
        this.reject = s(N, t, 1)
    }
    ,
    g.f = E = function(t) {
        return t === j || t === c ? new i(t) : r(t)
    }
    ),
    l(l.G + l.W + l.F * !M, {
        Promise: j
    }),
    e(24)(j, "Promise"),
    e(72)("Promise"),
    c = e(2).Promise,
    l(l.S + l.F * !M, "Promise", {
        reject: function(t) {
            var n = E(this);
            return (0,
            n.reject)(t),
            n.promise
        }
    }),
    l(l.S + l.F * (a || !M), "Promise", {
        resolve: function(t) {
            return _(a && this === c ? j : this, t)
        }
    }),
    l(l.S + l.F * !(M && e(73)(function(t) {
        j.all(t).catch(L)
    })), "Promise", {
        all: function(t) {
            var n = this
              , e = E(n)
              , o = e.resolve
              , r = e.reject
              , i = w(function() {
                var e = []
                  , i = 0
                  , c = 1;
                h(t, !1, function(t) {
                    var a = i++
                      , u = !1;
                    e.push(void 0),
                    c++,
                    n.resolve(t).then(function(t) {
                        u || (u = !0,
                        e[a] = t,
                        --c || o(e))
                    }, r)
                }),
                --c || o(e)
            });
            return i.e && r(i.v),
            e.promise
        },
        race: function(t) {
            var n = this
              , e = E(n)
              , o = e.reject
              , r = w(function() {
                h(t, !1, function(t) {
                    n.resolve(t).then(e.resolve, o)
                })
            });
            return r.e && o(r.v),
            e.promise
        }
    })
}
, function(t, n) {
    t.exports = function(t, n, e, o) {
        if (!(t instanceof n) || void 0 !== o && o in t)
            throw TypeError(e + ": incorrect invocation!");
        return t
    }
}
, function(t, n, e) {
    var o = e(13)
      , r = e(65)
      , i = e(66)
      , c = e(3)
      , a = e(32)
      , u = e(67)
      , s = {}
      , f = {};
    (n = t.exports = function(t, n, e, l, p) {
        var d, v, h, y, m = p ? function() {
            return t
        }
        : u(t), b = o(e, l, n ? 2 : 1), g = 0;
        if ("function" != typeof m)
            throw TypeError(t + " is not iterable!");
        if (i(m)) {
            for (d = a(t.length); d > g; g++)
                if ((y = n ? b(c(v = t[g])[0], v[1]) : b(t[g])) === s || y === f)
                    return y
        } else
            for (h = m.call(t); !(v = h.next()).done; )
                if ((y = r(h, b, v.value, n)) === s || y === f)
                    return y
    }
    ).BREAK = s,
    n.RETURN = f
}
, function(t, n, e) {
    var o = e(3);
    t.exports = function(t, n, e, r) {
        try {
            return r ? n(o(e)[0], e[1]) : n(e)
        } catch (n) {
            var i = t.return;
            throw void 0 !== i && o(i.call(t)),
            n
        }
    }
}
, function(t, n, e) {
    var o = e(8)
      , r = e(0)("iterator")
      , i = Array.prototype;
    t.exports = function(t) {
        return void 0 !== t && (o.Array === t || i[r] === t)
    }
}
, function(t, n, e) {
    var o = e(15)
      , r = e(0)("iterator")
      , i = e(8);
    t.exports = e(2).getIteratorMethod = function(t) {
        if (void 0 != t)
            return t[r] || t["@@iterator"] || i[o(t)]
    }
}
, function(t, n) {
    t.exports = function(t, n, e) {
        var o = void 0 === e;
        switch (n.length) {
        case 0:
            return o ? t() : t.call(e);
        case 1:
            return o ? t(n[0]) : t.call(e, n[0]);
        case 2:
            return o ? t(n[0], n[1]) : t.call(e, n[0], n[1]);
        case 3:
            return o ? t(n[0], n[1], n[2]) : t.call(e, n[0], n[1], n[2]);
        case 4:
            return o ? t(n[0], n[1], n[2], n[3]) : t.call(e, n[0], n[1], n[2], n[3])
        }
        return t.apply(e, n)
    }
}
, function(t, n, e) {
    var o = e(1)
      , r = e(36).set
      , i = o.MutationObserver || o.WebKitMutationObserver
      , c = o.process
      , a = o.Promise
      , u = "process" == e(9)(c);
    t.exports = function() {
        var t, n, e, s = function() {
            var o, r;
            for (u && (o = c.domain) && o.exit(); t; ) {
                r = t.fn,
                t = t.next;
                try {
                    r()
                } catch (o) {
                    throw t ? e() : n = void 0,
                    o
                }
            }
            n = void 0,
            o && o.enter()
        };
        if (u)
            e = function() {
                c.nextTick(s)
            }
            ;
        else if (!i || o.navigator && o.navigator.standalone)
            if (a && a.resolve) {
                var f = a.resolve(void 0);
                e = function() {
                    f.then(s)
                }
            } else
                e = function() {
                    r.call(o, s)
                }
                ;
        else {
            var l = !0
              , p = document.createTextNode("");
            new i(s).observe(p, {
                characterData: !0
            }),
            e = function() {
                p.data = l = !l
            }
        }
        return function(o) {
            var r = {
                fn: o,
                next: void 0
            };
            n && (n.next = r),
            t || (t = r,
            e()),
            n = r
        }
    }
}
, function(t, n, e) {
    var o = e(1).navigator;
    t.exports = o && o.userAgent || ""
}
, function(t, n, e) {
    var o = e(5);
    t.exports = function(t, n, e) {
        for (var r in n)
            o(t, r, n[r], e);
        return t
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(1)
      , r = e(10)
      , i = e(7)
      , c = e(0)("species");
    t.exports = function(t) {
        var n = o[t];
        i && n && !n[c] && r.f(n, c, {
            configurable: !0,
            get: function() {
                return this
            }
        })
    }
}
, function(t, n, e) {
    var o = e(0)("iterator")
      , r = !1;
    try {
        var i = [7][o]();
        i.return = function() {
            r = !0
        }
        ,
        Array.from(i, function() {
            throw 2
        })
    } catch (t) {}
    t.exports = function(t, n) {
        if (!n && !r)
            return !1;
        var e = !1;
        try {
            var i = [7]
              , c = i[o]();
            c.next = function() {
                return {
                    done: e = !0
                }
            }
            ,
            i[o] = function() {
                return c
            }
            ,
            t(i)
        } catch (t) {}
        return e
    }
}
, function(t, n, e) {
    "use strict";
    var o = e(12)
      , r = e(2)
      , i = e(1)
      , c = e(35)
      , a = e(38);
    o(o.P + o.R, "Promise", {
        finally: function(t) {
            var n = c(this, r.Promise || i.Promise)
              , e = "function" == typeof t;
            return this.then(e ? function(e) {
                return a(n, t()).then(function() {
                    return e
                })
            }
            : t, e ? function(e) {
                return a(n, t()).then(function() {
                    throw e
                })
            }
            : t)
        }
    })
}
, function(t, n, e) {
    "use strict";
    var o = e(12)
      , r = e(25)
      , i = e(37);
    o(o.S, "Promise", {
        try: function(t) {
            var n = r.f(this)
              , e = i(t);
            return (e.e ? n.reject : n.resolve)(e.v),
            n.promise
        }
    })
}
, function(t, n, e) {
    "use strict";
    function o() {
        try {
            return document.currentScript.src
        } catch (n) {
            var t = document.getElementsByTagName("script");
            return t[t.length - 1].src
        }
    }
    Object.defineProperty(n, "__esModule", {
        value: !0
    }),
    e.p = o().replace(/[^/\\\\]+$/, ""),
    n.getCurrentPath = o
}
, function(t, n, e) {
    "use strict";
    t.exports = {
        model: {
            jsonPath: "https://unpkg.com/live2d-widget-model-shizuku@latest/assets/shizuku.model.json",
            scale: 1
        },
        display: {
            superSample: 2,
            width: 200,
            height: 400,
            position: "right",
            hOffset: 0,
            vOffset: -20
        },
        mobile: {
            show: !0,
            scale: .8,
            motion: !0
        },
        name: {
            canvas: "live2dcanvas",
            div: "live2d-widget"
        },
        react: {
            opacity: 1
        },
        dev: {
            border: !1
        },
        dialog: {
            enable: !1,
            hitokoto: !1
        }
    }
}
, function(t, n, e) {
    "use strict";
    var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
        return typeof t
    }
    : function(t) {
        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
    }
    ;
    t.exports = function t(n, e) {
        function r(n, e) {
            for (var r in e)
                if (e.hasOwnProperty(r)) {
                    var i = e[r];
                    if ("__proto__" === r)
                        continue;
                    var c = n[r];
                    null == c ? n[r] = i : "object" === (void 0 === c ? "undefined" : o(c)) && null !== c && "object" === (void 0 === i ? "undefined" : o(i)) && null !== i && t(c, i)
                }
        }
        n = n || {};
        for (var i = arguments.length, c = 0; c < i; ) {
            var a = arguments[c++];
            a && r(n, a)
        }
        return n
    }
}
]).L2Dwidget;
//# sourceMappingURL=L2Dwidget.min.js.map
