// Settings.tsx
import { React, url } from "@vendetta/metro/common";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms, General } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";

import { fetchData } from "./index";

const { ScrollView, TextInput } = General;
const { FormSection, FormRow, FormInput } = Forms;

// Initialize storage defaults
if (!storage.customBannerUrl) storage.customBannerUrl = "";
if (!storage.customAvatarUrl) storage.customAvatarUrl = "";

export default () => (
    <ScrollView>
        <FormSection title="USRBG">
            <FormRow
                label="Discord Server"
                leading={<FormRow.Icon source={getAssetIDByName("Discord")} />}
                trailing={FormRow.Arrow}
                onPress={() => url.openDeeplink("https://discord.gg/TeRQEPb")}
            />
            <FormRow
                label="Reload DB"
                leading={<FormRow.Icon source={getAssetIDByName("ic_message_retry")} />}
                onPress={async () => {
                    const result = await fetchData();
                    if (!result) return showToast("Failed to reload DB", getAssetIDByName("small"));
                    return showToast("Reloaded DB", getAssetIDByName("check"));
                }}
            />
        </FormSection>
        
        <FormSection title="Custom Images (Client-side only)">
            <FormInput
                title="Custom Banner URL"
                value={storage.customBannerUrl}
                onChange={(v: string) => { storage.customBannerUrl = v; }}
                placeholder="https://files.catbox.moe/XXXXXX.gif"
            />
            <FormInput
                title="Custom Avatar URL"
                value={storage.customAvatarUrl}
                onChange={(v: string) => { storage.customAvatarUrl = v; }}
                placeholder="https://files.catbox.moe/XXXXXX.gif"
            />
        </FormSection>
    </ScrollView>
);
