# FAMILY CHOICE SUPERMARKET contact mailbox

Recommended address: **info@familychoiceminimarket.co.tz**.

The owner confirmed on 9 October 2026 that this mailbox was created in cPanel and successfully tested for sending and receiving. The address is now configured for the Contact and About pages.

1. In cPanel, open **Email Accounts → Create**.
2. Select **familychoiceminimarket.co.tz**, enter username **info**, and set a private strong password and suitable mailbox quota.
3. Create the account and open **Check Email** to access webmail.
4. Send a test to an external email account, then reply from that account and confirm the reply arrives in webmail. Check spam folders too.
5. After both directions work, set `contactEmail` in `src/storeConfig.ts` to the new address, rebuild, and upload the frontend update.

Mailbox creation is separate from Laravel SMTP configuration. It does not automatically enable order-confirmation email. Keep passwords and SMTP credentials private and out of Git.

The current map link searches for the owner-provided landmark, Mafiga Shell, Morogoro. Replace it with the store's exact Google Maps share link once confirmed. Opening hours are owner-provided; days and holiday exceptions have not been supplied.
