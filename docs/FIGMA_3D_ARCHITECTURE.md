# Keykha — Figma Architecture & 3D UI Specification

## Non-negotiable visual rules
- No flat-card, magazine, cute, or generic mobile-game surfaces.
- Every interactive surface is a materially plausible object: engraved iron, aged bronze, parchment, wax, sealed stone, or dark leather.
- Navigation never sends a player into a deep menu tree. The central Astrolabe is the interaction hub; modules resolve as contextual rails, radial nodes, and scene overlays.
- Gold indicates safe/legitimate state. Blood-crimson indicates illicit, dangerous, black-market, detection, debt, and counter-action state.

## Figma page tree
1. `00 Foundations`: color variables, material tokens, type styles, shadows and blur recipes.
2. `01 Atoms`: relief icon, engraved divider, wax seal, status rune, metallic frame, risk halo.
3. `02 Components`: Astrolabe Ring, Central Core, Route Token, Safteh, Intelligence Marker, Commodity Seal, House Crest.
4. `03 Organisms`: Astrolabe Desk, Context Rail, Holographic Map, Market Shift, Diwan Debt Table, War Sandbox, Inheritance Constellation.
5. `04 Screens`: Command / Map / Market / Diwan / University / Faction profile.
6. `05 Prototype`: interactions and motion wiring.
7. `06 Handoff`: exported WebP/SVG sprite references and semantic component mapping.

## Variables
| Collection | Tokens |
|---|---|
| Core materials | obsidian #090705, iron #171211, bronze #72502D, antique-gold #D7B36B, parchment #F0DFBC |
| Risk | blood #8F151B, crimson #E63842, safe-gold #D6A141 |
| Light | rim-gold 0 0 32 #D7B36B55, danger 0 0 50 #E6384290 |
| Type | Display/Serif Persian 32/40, H2 22/30, Body Sans 14/22, Caption 11/16 |

## Astrolabe component
Frame `O_AstrolabeDesk` uses vertical Auto Layout only for its external copy/telemetry layers; the instrument itself is absolute-positioned so nested rings retain physical alignment.
- Z00: leather/obsidian scene.
- Z10: image or WebGL/Spline render of the complete artifact.
- Z20: Outer Ring hit zones: Global Events, Map, Market, Diwan.
- Z30: Inner Ring hit zones: Intrigue and War.
- Z40: Central Core.
- Z50: Context Rail / alerts.
- Z60: modal confirmation and counter-action alerts.

Variants:
- `Risk=Safe|High`
- `RingState=Idle|Hover|Dragging|Selected`
- `Market=Legitimate|BlackMarket`
- `Debt=Clear|Extortion`
- `Counter=Idle|Incoming`

Prototype: Drag outer/inner rings rotates only the visual + event grouping by 18 degrees per notch. Click a ring triggers `Open overlay → ContextRail`, smart animate 420ms. Central Core triggers `Pressed` for 120ms then opens action confirmation.

## 16 independent noble-house system
| House | Independent role | Palette | Material/VFX |
|---|---|---|---|
| Saffarian | economic autonomy & black market | #C9A66B / #0F715D | fluid coins, illuminated routes |
| Surena | military aggression | #A21E24 / #1C2024 | forged iron, weapon-edge highlights |
| Karen | defense & resilience | #70472D / #A66A32 | shield relief, thick bronze walls |
| Mehran | Diwan influence | #4A255E / #D7B36B | calligraphic gold filigree |
| Ispahbudhan | logistics & supply | #2F6672 / #AEB7AB | chained waystones, convoy lights |
| Mihranid | intelligence interception | #27384A / #A7C5D8 | ghost glass, coded signal lines |
| Dabuyid | taxation & land registry | #4B3B21 / #E0C86D | stamped clay tablets |
| Bavandid | inheritance & lineage | #31503A / #BFA568 | emerald constellation branches |
| Ziyarid | coastal routes & ports | #0D4C63 / #E0B35B | wet brass, tide reflections |
| Qarinvand | mountain passes | #56504A / #D7D0C1 | granite relief, wind dust |
| Rustamid | covert diplomacy | #3A283E / #C39B7A | ink seals, folding parchment |
| Afrasiabi | sabotage | #461D1E / #D44040 | cracked iron, sparks |
| Hazaraspid | cavalry mobility | #4B3329 / #D8B66B | leather stirrups, moving sand |
| Sasanian | legitimacy & imperial edicts | #572126 / #F0D28A | royal stone and firelight |
| Karkh | craft monopolies | #55381F / #CA7F37 | hammered copper, workshop glow |
| Hyrkanian | forest networks & concealment | #1E4637 / #BEA86E | mossed bronze, fog trails |

## Module interaction contracts
- **Espionage:** `O_HolographicMap`, Chapar markers with `Visible|CaravanDisguise|Tracked`. Stealth switch is a physical lever with 180ms mechanical snap; bribery token stack animates down beneath the map; suspicion emits crimson halo.
- **Diwan/Safteh:** `O_SaftehStack` has `0|1|2|3Plus` variants. Extortion state adds low-frequency red breathing glow to the entire Diwan scene.
- **Market:** `O_MarketShift` transitions `Legitimate→BlackMarket` via 220ms two-frame glitch and 380ms lighting crossfade. Price seals are auto-layout numeric stacks with `Cheap|Market|Expensive` variants.
- **War:** `O_WarSandbox` accepts draggable `M_MilitaryToken`; on drop a 3D tug bar interpolates strength. Invalid node = shake 180ms and iron scrape audio cue.
- **University:** `O_LineageConstellation` nodes use `Dormant|Selected|Locked`; Parent→Child transfer uses smart-animate energy line 600ms then locks both trait chips.
- **Counter-action:** incoming counter appears as a crimson rune at Z60. It includes the one legal response action instead of burying the player in a menu.
- **Compensation:** a balance shift appears as a golden ledger plate with `Removed ability → compensated ability`, requiring acknowledgement.

## Motion
- Material hover: 180ms cubic-bezier(.2,.8,.2,1), 1.04 scale + raised shadow.
- Mechanical press: 90–130ms, 2–4px Y displacement, reduced cast shadow, deeper inner shadow.
- Context rail: 420ms cubic-bezier(.16,1,.3,1).
- Glitch: 240ms steps(2), never continuous more than 600ms.
- Danger pulse: 2.4s ease-in-out only when a choice is genuinely high-risk.
- Respect reduced motion: swap rotation/pulse for a static halo.

## 3D pipeline
1. Build the Astrolabe in Blender/C4D with three separately named rings, PBR bronze/iron/gold materials, 2K textures, and a dark leather/obsidian plate.
2. Export a real-time scene to Spline/WebGL for desktop where available; define hit areas outside the canvas in Figma/HTML so touch controls remain reliable.
3. Export a portrait WebP fallback at 1440px long edge plus a 2× sprite sheet of safe/high-risk cores.
4. In Figma, use the WebGL/Spline embed only as the visual layer; component variants and hit zones remain native Figma frames.
5. Every artifact must have a static fallback and labelled layer structure; do not bake Persian text into raster art.
