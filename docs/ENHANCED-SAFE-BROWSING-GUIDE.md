# Chrome Web Store — Resolving "Not Trusted by Enhanced Safe Browsing"

Google Chrome's **Enhanced Safe Browsing** displays the warning *"This extension is not trusted by Enhanced Safe Browsing"* for items published by developer accounts that have not yet built up a multi-month compliance history or are missing specific account disclosures.

Follow these 4 steps to resolve the warning and establish full trust with Chrome Safe Browsing.

---

## Step 1: Enable 2-Step Verification (2SV) & Developer Identity
> Google requires 2SV for publisher accounts to grant trusted status.

1. Go to [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification (2SV)** is turned **ON** for the Google account that owns your Chrome Web Store Developer Console.
3. Open [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/) $\rightarrow$ **Account Details**.
4. Verify your publisher name and contact email address.

---

## Step 2: Complete the Privacy Disclosures Tab in Developer Console
1. Open [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/).
2. Select your extension **Prompt+ Architect AI - Prompt Optimizer & Assistant**.
3. Click on the **Privacy** tab on the left menu.

### 1. Single Purpose Description
Copy & paste this into the **Single Purpose** field:
```
Prompt+ Architect AI has a single purpose: to help users craft, structure, and optimize AI prompts directly within web chat interfaces.
```

### 2. Permission Justifications

| Permission | Justification Text to Paste |
| :--- | :--- |
| **`storage`** | `Used strictly to store user prompt history, saved templates, and user model preferences locally on the client device.` |
| **`activeTab`** | `Used only when the user clicks the Prompt+ floating action button to insert the optimized prompt into the active chat input field.` |
| **`contextMenus`** | `Used to allow users to right-click selected text to open the prompt optimization popover.` |

### 3. Data Usage & Certification Checkboxes
Check the following mandatory certifications:
- `[x]` **User Activity / User Input**
- `[x]` **I certify that this item does not sell user data to third parties.**
- `[x]` **I certify that this item does not use or transfer user data for purposes unrelated to the item's core functionality.**
- `[x]` **I certify that this item does not use or transfer user data to determine creditworthiness or for lending purposes.**

---

## Step 3: Ensure Public Privacy Policy URL is Set
In the **Store Listing** tab:
- **Privacy Policy URL:** `https://prompt-plus-three.vercel.app/privacy`

---

## Step 4: Submit Package Update (v1.2.0)
1. In the **Package** tab, click **Upload new package**.
2. Select your latest zip file: `dist/prompt-plus-extension-v1.2.0.zip`.
3. Click **Submit for Review**.

---

### ⏳ Expected Timeline
- **Immediate:** Complete 2SV and Privacy tab disclosures.
- **Review:** Automated + manual Chrome Web Store compliance check (usually 24–48 hours).
- **Safe Browsing Trust:** Chrome's Safe Browsing system evaluates accounts over time. Once 2SV is active and your item passes review cleanly, the warning automatically disappears for all users.
