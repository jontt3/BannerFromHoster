let patches = [];

const {
    logger,
    metro: { findByProps },
    patcher,
    ui: { toasts, components },
    storage
} = vendetta;

const { 
    ScrollView, 
    TextInput, 
    Button,
    View,
    Text
} = components;

// Default settings
const defaultSettings = {
    banners: {} // { userId: "https://catbox.moe/..." }
};

// Load or init storage
let settings = storage?.get?.("customBanners") || defaultSettings;

function saveSettings() {
    if (storage?.set) storage.set("customBanners", settings);
}

// Patch getUserBannerURL to return custom banners
function patchBanner() {
    try {
        const UserBannerUtils = findByProps("getUserBannerURL");
        if (!UserBannerUtils) {
            logger.error("CustomBanner", "Could not find getUserBannerURL");
            return false;
        }

        const unpatch = patcher.after("getUserBannerURL", UserBannerUtils, (args, ret) => {
            const [user] = args;
            if (!user?.id) return ret;
            
            const customUrl = settings.banners[user.id];
            if (customUrl) return customUrl;
            
            return ret;
        });

        patches.push(unpatch);
        return true;
    } catch (e) {
        logger.error("CustomBanner", "Failed to patch banner:", e);
        return false;
    }
}

// Settings page component
const Settings = () => {
    const [userId, setUserId] = React.useState("");
    const [bannerUrl, setBannerUrl] = React.useState("");
    const [bannerList, setBannerList] = React.useState(Object.entries(settings.banners));

    const refreshList = () => {
        setBannerList(Object.entries(settings.banners));
    };

    const addBanner = () => {
        if (!userId || !bannerUrl) {
            toasts.showToast("Fill in both fields");
            return;
        }
        settings.banners[userId] = bannerUrl;
        saveSettings();
        setUserId("");
        setBannerUrl("");
        refreshList();
        toasts.showToast("Banner added!");
    };

    const removeBanner = (uid) => {
        delete settings.banners[uid];
        saveSettings();
        refreshList();
        toasts.showToast("Banner removed");
    };

    return React.createElement(ScrollView, { style: { padding: 16 } },
        React.createElement(Text, { style: { fontSize: 20, fontWeight: "bold", marginBottom: 12 } }, "Custom Banners"),
        React.createElement(Text, { style: { marginBottom: 16, opacity: 0.7 } }, 
            "Add custom profile banners for any user. Uses any direct image URL (catbox, imgur, etc)."
        ),
        
        // Input section
        React.createElement(Text, { style: { marginTop: 8 } }, "User ID:"),
        React.createElement(TextInput, {
            value: userId,
            onChangeText: setUserId,
            placeholder: "123456789012345678",
            style: { 
                backgroundColor: "#2b2d31", 
                padding: 12, 
                borderRadius: 8, 
                marginVertical: 8,
                color: "#fff"
            }
        }),
        
        React.createElement(Text, { style: { marginTop: 8 } }, "Banner Image URL:"),
        React.createElement(TextInput, {
            value: bannerUrl,
            onChangeText: setBannerUrl,
            placeholder: "https://files.catbox.moe/xxxxx.png",
            style: { 
                backgroundColor: "#2b2d31", 
                padding: 12, 
                borderRadius: 8, 
                marginVertical: 8,
                color: "#fff"
            }
        }),
        
        React.createElement(View, { style: { marginVertical: 12 } },
            React.createElement(Button, {
                onPress: addBanner,
                title: "Add/Update Banner",
                color: "#5865f2"
            })
        ),

        // List existing banners
        React.createElement(Text, { style: { fontSize: 16, fontWeight: "bold", marginTop: 24, marginBottom: 12 } }, 
            `Saved Banners (${bannerList.length})`
        ),
        
        ...bannerList.map(([uid, url]) => 
            React.createElement(View, { 
                key: uid,
                style: { 
                    backgroundColor: "#232428", 
                    padding: 12, 
                    borderRadius: 8, 
                    marginBottom: 8 
                }
            },
                React.createElement(Text, { style: { fontWeight: "bold", color: "#fff" } }, uid),
                React.createElement(Text, { 
                    style: { color: "#b5bac1", fontSize: 12, marginTop: 4 },
                    numberOfLines: 1
                }, url),
                React.createElement(Button, {
                    onPress: () => removeBanner(uid),
                    title: "Remove",
                    color: "#ed4245",
                    style: { marginTop: 8 }
                })
            )
        )
    );
};

export default {
    onLoad: () => {
        logger.log("CustomBanner", "Plugin loading...");
        const success = patchBanner();
        if (success) {
            toasts.showToast("Custom Banners loaded");
        } else {
            toasts.showToast("Failed to load Custom Banners");
        }
    },
    onUnload: () => {
        patches.forEach(p => p?.());
        patches = [];
        logger.log("CustomBanner", "Plugin unloaded");
    },
    settings: Settings
};
