// index.tsx
import { logger } from "@vendetta";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { safeFetch } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";

import Settings from "./Settings";

interface UsrbgData {
    endpoint: string;
    bucket: string;
    prefix: string;
    users: Record<string, string>;
}

const getUserBannerURL = findByProps("default", "getUserBannerURL");
const getUserAvatarURL = findByProps("getUserAvatarURL");
const UserStore = findByStoreName("UserStore");

let data: UsrbgData | null = null;
let unpatches: (() => void)[] = [];

export const fetchData = async () => {
    try {
        data = await (await safeFetch("https://usrbg.is-hardly.online/users", { cache: "no-store" })).json();
        return data;
    } catch (e) {
        logger.error("Failed to fetch USRBG data", e);
    }
};

export const onLoad = async () => {
    await fetchData();
    if (!data) return showToast("Failed to load USRBG DB");

    const currentUser = UserStore.getCurrentUser();
    const { endpoint, bucket, prefix, users } = data;

    // Banner patch
    const unpatchBanner = after("getUserBannerURL", getUserBannerURL, ([user]) => {
        // Custom banner override for current user
        if (user?.id === currentUser?.id && storage.customBannerUrl) {
            return storage.customBannerUrl;
        }
        
        // USRBG fallback
        if (user?.banner === undefined && users[user?.id]) {
            return `${endpoint}/${bucket}/${prefix}${user.id}?${users[user.id]}`;
        }
    });
    unpatches.push(unpatchBanner);

    // Avatar patch
    if (storage.customAvatarUrl) {
        const unpatchAvatar = after("getUserAvatarURL", getUserAvatarURL, ([user, animated, size]) => {
            if (user?.id === currentUser?.id) {
                return storage.customAvatarUrl;
            }
        });
        unpatches.push(unpatchAvatar);
    }
};

export const onUnload = () => {
    unpatches.forEach(unpatch => unpatch?.());
    unpatches = [];
};

export const settings = Settings;
      
