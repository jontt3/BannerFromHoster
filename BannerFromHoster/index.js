(function(e, o, n) {
    "use strict";
    
    const { Forms, General } = n;
    const { FormSection, FormRow, FormInput } = Forms;
    const { ScrollView } = General;
    const { getAssetIDByName } = o.ui.assets;
    const { showToast } = o.ui.toasts;
    const { url } = o.metro.common;
    const { storage } = o.plugin;
    const { safeFetch } = o.utils;
    const { after } = o.patcher;
    const { findByProps, findByStoreName } = o.metro;

    if (!storage.customBannerUrl) storage.customBannerUrl = "";
    if (!storage.customAvatarUrl) storage.customAvatarUrl = "";

    let data = null;
    let unpatches = [];

    const getUserBannerURL = findByProps("default", "getUserBannerURL");
    const getUserAvatarURL = findByProps("getUserAvatarURL");
    const UserStore = findByStoreName("UserStore");

    async function fetchData() {
        try {
            data = await (await safeFetch("https://usrbg.is-hardly.online/users", { cache: "no-store" })).json();
            return data;
        } catch (err) {
            o.logger.error("Failed to fetch USRBG data", err);
        }
    }

    function Settings() {
        return React.createElement(ScrollView, null,
            React.createElement(FormSection, { title: "USRBG" },
                React.createElement(FormRow, {
                    label: "Discord Server",
                    leading: React.createElement(FormRow.Icon, { source: getAssetIDByName("Discord") }),
                    trailing: FormRow.Arrow,
                    onPress: () => url.openDeeplink("https://discord.gg/TeRQEPb")
                }),
                React.createElement(FormRow, {
                    label: "Reload DB",
                    leading: React.createElement(FormRow.Icon, { source: getAssetIDByName("ic_message_retry") }),
                    onPress: async () => {
                        const result = await fetchData();
                        if (!result) return showToast("Failed to reload DB", getAssetIDByName("small"));
                        return showToast("Reloaded DB", getAssetIDByName("check"));
                    }
                })
            ),
            React.createElement(FormSection, { title: "Custom Images (Client-side only)" },
                React.createElement(FormInput, {
                    title: "Custom Banner URL",
                    value: storage.customBannerUrl,
                    onChange: (v) => { storage.customBannerUrl = v; },
                    placeholder: "https://files.catbox.moe/XXXXXX.gif"
                }),
                React.createElement(FormInput, {
                    title: "Custom Avatar URL",
                    value: storage.customAvatarUrl,
                    onChange: (v) => { storage.customAvatarUrl = v; },
                    placeholder: "https://files.catbox.moe/XXXXXX.gif"
                })
            )
        );
    }

    var plugin = {
        onLoad: async function() {
            await fetchData();
            if (!data) return showToast("Failed to load USRBG DB");

            const currentUser = UserStore.getCurrentUser();
            const { endpoint, bucket, prefix, users } = data;

            const unpatchBanner = after("getUserBannerURL", getUserBannerURL, ([user]) => {
                if (user?.id === currentUser?.id && storage.customBannerUrl) {
                    return storage.customBannerUrl;
                }
                if (user?.banner === undefined && users[user?.id]) {
                    return `${endpoint}/${bucket}/${prefix}${user.id}?${users[user.id]}`;
                }
            });
            unpatches.push(unpatchBanner);

            if (storage.customAvatarUrl) {
                const unpatchAvatar = after("getUserAvatarURL", getUserAvatarURL, ([user]) => {
                    if (user?.id === currentUser?.id) {
                        return storage.customAvatarUrl;
                    }
                });
                unpatches.push(unpatchAvatar);
            }
        },
        onUnload: function() {
            unpatches.forEach(unpatch => unpatch?.());
            unpatches = [];
        },
        settings: Settings
    };

    e.default = plugin;
    Object.defineProperty(e, "__esModule", { value: true });
    return e;
})({}, vendetta, vendetta.ui.components);
