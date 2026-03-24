# FT Atlas
**A network visualisation of legislative proposals in the Danish Parliament (Folketing), 2005–2025.**

## Overview
FT Atlas is an interactive force-directed graph, revealing patterns of cross-party collaboration, political clustering, and legislative activity over two decades of Danish parliamentary history based on more than 20,000 legislative proposal document submitted to the Danish Folketing between 2005 and 2025.

 
## Overview
 
Each node in the atlast represents a politician with edges connecting politicians who have co-signed proposals together. The node size reflects the total number of proposals each politician has been involved with, and node positions reflects their party's position on the left–right political spectrum.
- **Party filter bar** — isolate any party cluster with a single click
- **Side panel** — click any node to see the full list of proposals associated with that politician, with links to source documents on ft.dk
- **Search** — filter proposals within the side panel by title, year, or URL
- **Tooltip** on hover showing politician name, party, and proposal count
- **Zoom controls** and drag-to-pan navigation
- **Responsive layout** — recalculates party positions on window resize

 
## Parties Covered
 
| Code | Party |
|------|-------|
| EL | Enhedslisten |
| ALT | Alternativet |
| SF | Socialistisk Folkeparti |
| S | Socialdemokratiet |
| IA | Inuit Ataqatigiit |
| T | Tjóðveldi |
| B | Radikale Venstre |
| M | Moderaterne |
| UFG | Uden for grupperne |
| V | Venstre |
| C | Det Konservative Folkeparti |
| LA | Liberal Alliance |
| DD | Danmarksdemokraterne |
| DF | Dansk Folkeparti |
| NB | Nye Borgerlige |

 
## Dependencies
 
- [D3.js v7](https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js) — loaded via CDN
- [Space Grotesk & Space Mono](https://fonts.google.com/) — loaded via Google Fonts
 
No other dependencies or build tools are required.

 
## Licence
 
Data sourced from the Danish Parliament's open data at [ft.dk](https://www.ft.dk). Please refer to Folketing's terms of use for data reuse conditions.
 
Code released under the MIT Licence. See `LICENSE` for details.
