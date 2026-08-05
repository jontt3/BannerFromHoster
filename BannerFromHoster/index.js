(function(l, p, w, b, E, g, n, f, D) {
    "use strict";

    function m(e, a, d, s, c, i, t) {
        try {
            var o = e[i](t),
                r = o.value
        } catch (B) {
            d(B);
            return
        }
        o.done ? a(r) : Promise.resolve(r).then(s, c)
    }

    function h(e) {
        return function() {
            var a = this,
                d = arguments;
            return new Promise(function(s, c) {
                var i = e.apply(a, d);

                function t(r) {
                    m(i, s, c, t, o, "next", r)
                }

                function o(r) {
                    m(i, s, c, t, o, "throw", r)
                }
                t(void 0)
            })
        }
    }

    var {
        ScrollView: F
    } = D.General, {
        FormSection: U,
        FormRow: u,
        FormInput: J,
        FormSwitchRow: K
    } = D.Forms;

    // Default configuration
    const DEFAULT_CONFIG = {
        enabled: true,
        endpoint: "https://usrbg.is-hardly.online",
        usersUrl: "https://usrbg.is-hardly.online/users",
        bannerUrlTemplate: "{endpoint}/users/{userId}/banner?{hash}",
        useCustomTemplate: false,
        customTemplate: ""
    };

    // Storage key for settings
    const STORAGE_KEY = "usrbg_config";

    // Load saved config or use defaults
    function loadConfig() {
        try {
            const saved = n.storage.getSync(STORAGE_KEY);
            return saved ? { ...DEFAULT_CONFIG, ...saved } : { ...DEFAULT_CONFIG };
        } catch (e) {
            return { ...DEFAULT_CONFIG };
        }
    }

    // Save config
    function saveConfig(config) {
        n.storage.set(STORAGE_KEY, config);
    }

    let config = loadConfig();
    let v, R;

    // Fetch user database
    let y = function() {
        var e = h(function*() {
            try {
                if (!config.enabled) return null;
                
                // Support both legacy DB format and direct per-user endpoints
                if (config.usersUrl) {
                    v = yield(yield E.safeFetch(config.usersUrl, {
                        cache: "no-store"
                    })).json();
                }
                return v;
            } catch (a) {
                p.logger.error("Failed to fetch userBG data", a);
                return null;
            }
        });
        return function() {
            return e.apply(this, arguments)
        }
    }();

    // Build banner URL from template
    function buildBannerUrl(userId, hash) {
        let template = config.useCustomTemplate && config.customTemplate 
            ? config.customTemplate 
            : config.bannerUrlTemplate;
        
        return template
            .replace(/{endpoint}/g, config.endpoint)
            .replace(/{userId}/g, userId)
            .replace(/{hash}/g, hash || Date.now());
    }

    // Apply the patch
    let P = function() {
        var e = h(function*() {
            // Unload existing patch first
            A();
            
            if (!config.enabled) return;

            yield y();
            
            var I = w.findByProps("default", "getUserBannerURL");
            
            R = b.after("getUserBannerURL", I, ([i]) => {
                // If user has a native banner, don't override
                if (i?.banner !== undefined) return;

                // Try legacy DB lookup first
                if (v && typeof v === 'object') {
                    // Handle old format: {endpoint, bucket, prefix, users}
                    var users = v.users || v;
                    var t = Object.entries(users).find(([B, L]) => B === i?.id);
                    if (t) {
                        var [o, r] = t;
                        // Support old format with endpoint/bucket/prefix
                        if (v.endpoint && v.bucket !== undefined) {
                            return `${v.endpoint}/${v.bucket}/${v.prefix || ''}${o}?${r}`;
                        }
                        // New template-based
                        return buildBannerUrl(o, r);
                    }
                }

                // Direct endpoint fallback: try fetching user banner directly
                if (config.endpoint && !config.usersUrl) {
                    return buildBannerUrl(i?.id, Date.now());
                }
            });
        });
        return function() {
            return e.apply(this, arguments)
        }
    }();

    let A = () => R?.();

    // Settings panel with configuration options
    let _ = () => {
        const [cfg, setCfg] = n.React.useState({ ...config });
        
        const updateConfig = (key, value) => {
            const newCfg = { ...cfg, [key]: value };
            setCfg(newCfg);
            config = newCfg;
            saveConfig(newCfg);
            // Reload patch with new config
            P();
        };

        return n.React.createElement(F, null,
            n.React.createElement(U, { title: "General" },
                n.React.createElement(K, {
                    label: "Enable Custom Banners",
                    subLabel: "Toggle the banner replacement on/off",
                    value: cfg.enabled,
                    onValueChange: (v) => updateConfig("enabled", v)
                })
            ),
            n.React.createElement(U, { title: "File Hoster Configuration" },
                n.React.createElement(u, {
                    label: "Preset Hosters",
                    subLabel: "Quick-select a known hoster",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("ic_server") }),
                    trailing: u.Arrow,
                    onPress: () => {
                        // Could open a picker here with presets
                        g.showToast("Presets: usrbg.is-hardly.online, custom", f.getAssetIDByName("ic_info"));
                    }
                }),
                n.React.createElement(J, {
                    title: "Users Database URL",
                    value: cfg.usersUrl || "",
                    placeholder: "https://example.com/users.json",
                    onChange: (v) => updateConfig("usersUrl", v)
                }),
                n.React.createElement(J, {
                    title: "Endpoint/Base URL",
                    value: cfg.endpoint || "",
                    placeholder: "https://cdn.example.com",
                    onChange: (v) => updateConfig("endpoint", v)
                }),
                n.React.createElement(u, {
                    label: "Use Custom URL Template",
                    subLabel: "Enable advanced URL formatting",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("ic_edit") }),
                    trailing: n.React.createElement(K, {
                        value: cfg.useCustomTemplate,
                        onValueChange: (v) => updateConfig("useCustomTemplate", v)
                    })
                }),
                cfg.useCustomTemplate && n.React.createElement(J, {
                    title: "Custom URL Template",
                    value: cfg.customTemplate || "",
                    placeholder: "{endpoint}/users/{userId}/banner?{hash}",
                    subLabel: "Available: {endpoint}, {userId}, {hash}",
                    onChange: (v) => updateConfig("customTemplate", v)
                })
            ),
            n.React.createElement(U, { title: "Actions" },
                n.React.createElement(u, {
                    label: "Reload Database",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("ic_message_retry") }),
                    onPress: h(function*() {
                        var e = yield y();
                        yield P();
                        return e ? g.showToast("Reloaded DB", f.getAssetIDByName("check")) 
                                 : g.showToast("Failed to reload DB", f.getAssetIDByName("small"));
                    })
                }),
                n.React.createElement(u, {
                    label: "Reset to Defaults",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("ic_trash") }),
                    onPress: () => {
                        config = { ...DEFAULT_CONFIG };
                        saveConfig(config);
                        setCfg({ ...DEFAULT_CONFIG });
                        P();
                        g.showToast("Settings reset", f.getAssetIDByName("check"));
                    }
                })
            ),
            n.React.createElement(U, { title: "Support" },
                n.React.createElement(u, {
                    label: "Discord Server",
                    leading: n.React.createElement(u.Icon, { source: f.getAssetIDByName("Discord") }),
                    trailing: u.Arrow,
                    onPress: () => n.url.openDeeplink("https://discord.gg/TeRQEPb")
                })
            )
        );
    };

    l.fetchData = y;
    l.onLoad = P;
    l.onUnload = A;
    l.settings = _;
    l.getConfig = () => ({ ...config });
    l.setConfig = (newCfg) => {
        config = { ...config, ...newCfg };
        saveConfig(config);
        return P();
    };

    return l;
})({}, vendetta, vendetta.metro, vendetta.patcher, vendetta.utils, vendetta.ui.toasts, vendetta.metro.common, vendetta.ui.assets, vendetta.ui.components);
          
