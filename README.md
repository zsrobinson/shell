# shell

A small React shell for internal tools. Real shadcn/ui components, Geist Variable,
and the exact Flexoki neutral palette, with a single service accent token.
Includes a service switcher, signed-in email, theme toggle and logout link.
Dialogs are centered with a transparent backdrop.

Install from a pinned Git commit. Import `AppShell` and `styles.css` from the
package. Tailwind v4 must scan the package's `src` directory. Supply a runtime
array of `{name, url, icon?, colour?}` entries to `services`; the package contains
no deployment manifest. The app owns loading that manifest and verifying identity.
Only pass trusted HTTP(S) service URLs. Targets preconnect and prefetch on hover
or keyboard focus. Cross-origin navigation uses normal links and browser caching.
Theme follows the system until explicitly selected; preference is local per origin.
No cross-origin view transition dependency.

The components were installed with the shadcn CLI (new-york, neutral), then their
imports and overlay were adapted for package consumption. Palette source:
https://stephango.com/flexoki (MIT). The bundled font retains its upstream license.
