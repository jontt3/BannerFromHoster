(function(l, p, w, b, E, g, n, f, D) {
    "use strict";
    
    function m(e, a, d, s, c, i, t) {
        try {
            var o = e[i](t), r = o.value;
        } catch (B) {
            d(B);
            return;
        }
        o.done ? a(r) : Promise.resolve(r).then(s, c);
    }
    
    function h(e) {
        return function() {
            var a = this, d = arguments;
            return new Promise(function(s, c) {
                var i = e.apply(a, d);
                function t(r) {
                    m(i, s, c, t, o, "next", r);
                }
                function o(r) {
                    m(i, s, c, t, o, "throw", r);
                }
                t(void 0);
            });
        };
    }
    
    var { ScrollView: F } = D.General,
        { FormSection: U, FormRow: u, FormInput: FI } = D.Forms,
        _ = () => n.React.createElement(F, null,
            n.React.createElement(U, { title: "USRBG" },
                n.React.createElement(u, {
                    label: "Discord Server",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("Discord") }),
                    trailing: u.Arrow,
                    onPress: () => n.url.openDeeplink("https://discord.gg/TeRQEPb")
                }),
                n.React.createElement(u, {
                    label: "Reload DB",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("ic_message_retry") }),
                    onPress: h(function* () {
                        var e = yield B();
                        return e ? g.showToast("Reloaded DB", f.getAssetIDByName("check")) : g.showToast("Failed to reload DB", f.getAssetIDByName("small"));
                    })
                })
            ),
            n.React.createElement(U, { title: "Custom Images (Client-side only)" },
                n.React.createElement(FI, {
                    title: "Custom Banner URL",
                    value: n.storage.customBannerUrl,
                    onChange: (v) => { n.storage.customBannerUrl = v; },
                    placeholder: "https://files.catbox.moe/XXXXXX.gif"
                }),
                n.React.createElement(FI, {
                    title: "Custom Avatar URL",
                    value: n.storage.customAvatarUrl,
                    onChange: (v) => { n.storage.customAvatarUrl = v; },
                    placeholder: "https://files.catbox.moe/XXXXXX.gif"
                })
            )
        ),
        I = w.findByProps("default", "getUserBannerURL"),
        v, R, y = function () {
            var e = h(function* () {
                try {
                    return v = yield (yield E.safeFetch("https://usrbg.is-hardly.online/users", { cache: "no-store" })).json(), v;
                } catch (a) {
                    p.logger.error("Failed to fetch USRBG data", a);
                }
            });
            return function () {
                return e.apply(this, arguments);
            };
        }(),
        P = function () {
            var e = h(function* () {
                if (yield y(), !v) return g.showToast("Failed to load DB");
                var { endpoint: a, bucket: d, prefix: s, users: c } = v;
                var currentUser = w.findByStoreName("UserStore").getCurrentUser();
                R = b.after("getUserBannerURL", I, ([i]) => {
                    if (i?.id === currentUser?.id && n.storage.customBannerUrl) {
                        return n.storage.customBannerUrl;
                    }
                    var t = Object.entries(c).find(([B, L]) => B === i?.id);
                    if (i?.banner === void 0 && t) {
                        var [o, r] = t;
                        return `${a}/${d}/${s}${o}?${r}`;
                    }
                });
                if (n.storage.customAvatarUrl) {
                    var getUserAvatarURL = w.findByProps("getUserAvatarURL");
                    R = b.after("getUserAvatarURL", getUserAvatarURL, ([i]) => {
                        if (i?.id === currentUser?.id) {
                            return n.storage.customAvatarUrl;
                        }
                    });
                }
            });
            return function () {
                return e.apply(this, arguments);
            };
        }(),
        A = () => R?.(),
        $ = _;
    
    n.storage.customBannerUrl || (n.storage.customBannerUrl = "");
    n.storage.customAvatarUrl || (n.storage.customAvatarUrl = "");
    
    l.fetchData = y;
    l.onLoad = P;
    l.onUnload = A;
    l.settings = $;
    
    return l;
})({}, vendetta, vendetta.metro, vendetta.patcher, vendetta.utils, vendetta.ui.toasts, vendetta.metro.common, vendetta.ui.assets, vendetta.ui.components);
