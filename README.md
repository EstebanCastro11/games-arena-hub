# The Games Hub

Build a modern web app for an event called “THE GAMES” for DÍAS EAFIT.

Context:
THE GAMES is a competition event with 30 teams. Teams compete across multiple challenges/stations during one event day. The app must help organizers manage teams, challenges, scores, rankings, and real-time progress in a simple, visual, mobile-friendly way.

Goal:
Create an admin + judge + public leaderboard app that allows event staff to run the competition smoothly in real time.

Core users:
1. Super Admin / Organizer
2. Judges / Station Leaders
3. Public audience / participants viewing leaderboard

Main features:

1. Authentication and roles
- Secure login
- Roles: Super Admin, Judge, Viewer
- Super Admin can manage everything
- Judges can only see assigned stations/challenges and submit scores
- Viewers can only see public leaderboard and event status

2. Team management
- Create, edit, and delete teams
- Each team has:
  - team name
  - team number
  - captain name
  - members count
  - color
  - faculty/program (optional)
  - status: active / disqualified / finished
- Show teams in cards and table view
- Allow search and filters

3. Challenge / station management
- Create multiple stations/challenges
- Each challenge has:
  - name
  - description
  - location
  - max score
  - scoring type: points / time / penalty-adjusted
  - judge assigned
  - active/inactive status
- Admin can define challenge weight if some challenges count more than others

4. Score submission
- Judges can submit scores from mobile easily
- Score form must include:
  - team
  - challenge
  - raw score
  - penalties
  - bonus points
  - final score auto-calculated
  - comments
  - optional evidence upload (photo)
  - timestamp
- Prevent duplicate submissions unless admin approves override
- Show confirmation after saving

5. Real-time leaderboard
- Public leaderboard updates live
- Ranking based on total accumulated points
- Show:
  - rank
  - team name
  - color
  - completed challenges
  - total score
  - tie-breaker indicator
- Add animated top 3 podium section
- Show recent movements: up/down positions

6. Event progress dashboard
- Admin dashboard with:
  - total teams
  - total challenges
  - completed score submissions
  - pending submissions
  - teams currently competing
  - station status
- Visual progress bars for overall event completion

7. Tie-breaker rules
- Support configurable tie-breakers:
  - highest score in selected challenge
  - lowest total time
  - fewest penalties
  - manual admin decision
- Admin can set default tie-breaker rules before event starts

8. Schedule and rotation control
- Build a rotation/schedule module so each team can be assigned to stations in rounds
- Show:
  - current round
  - next station per team
  - station occupancy
- Prevent conflicts where two teams are assigned incorrectly to same slot if capacity is 1

9. Announcements
- Admin can publish announcements visible to judges and public screens
- Examples:
  - “Round 2 starts in 5 minutes”
  - “Team 14 move to Station B”
  - “Station 5 paused”

10. Public display mode
- Big-screen

ELLOS ESTARAN DOS DIAS HACIENDO competencia,15 bases cada dia, tengo que hacer una pliacion que haga lo siguiente 1. tengo un admin que pueda controlar los equipos 2. se puedan registran los capitanes de los equipos 3. los admin puedan registran los puntajes de los equipos en las 30 competencias mas posibles adicionales 3.1 gana equipo 1000 puntos, pierde 0, empata 500, macro base 2000 puntos, pierde 0, empata 1000 4 hacer llaves de los 30 equipos y hacer las rotaciones entre ellos tipo equipo 1 vs 30, 2 vs 29 etc 5. hacerun sistema de apuestas para que los equipos puedan apostar entre ellos para definri un ganador 6. un hub bonito y llamativo con referencia del intagram

Thought for 15s

Sí. Con lo que me acabas de definir, ya no es solo un leaderboard: es una app tipo torneo + scoring + apuestas + panel administrativo, para un evento de 2 días, con 30 equipos, 15 bases por día y una estética inspirada en DÍAS EAFIT. La cuenta pública de DÍAS EAFIT se presenta como “el evento cultural más grande de la Universidad EAFIT”, organizado por la Organización Estudiantil EAFIT, y hay publicaciones públicas que mencionan The Games dentro de esa edición.

Te dejo un prompt mucho más completo para Lovable, ya estructurado para que te arme una primera versión funcional:

Build a modern, mobile-first web app for an event called “THE GAMES” inspired by the visual energy of DÍAS EAFIT.

Context:
THE GAMES is a 2-day competitive event.
- 30 teams total
- 15 competition bases on Day 1
- 15 competition bases on Day 2
- Teams compete in matchups and rotations
- Admins must control teams, captains, scores, brackets, and betting
- The app must feel youthful, vibrant, exciting, university-event style, with a polished and energetic interface inspired by DÍAS EAFIT social media aesthetics: bold, colorful, playful, dynamic, high-contrast, modern, attractive dashboards, cards, badges, gradients, and event-style motion

Main objective:
Create a competition management platform with:
1. Admin control panel
2. Captain registration
3. Score registration for 30 competitions + optional extra competitions
4. Matchups/brackets for 30 teams
5. Team-vs-team rotations
6. Betting system between teams
7. Public-facing hub / leaderboard / tournament center

User roles:
- Super Admin
- Admin / Score Operator
- Team Captain
- Public Viewer

Core modules:

1) ADMIN PANEL
Create a full admin dashboard with:
- total teams
- registered captains
- total matches completed
- pending matches
- total bets placed
- current standings
- day 1 progress
- day 2 progress

Admins can:
- create, edit, delete teams
- create, edit, delete competitions/bases
- register results
- manage extra competitions
- configure point rules
- generate brackets
- generate matchups
- configure rotations
- validate or reject bets
- disqualify teams
- manually adjust scores
- break ties manually if needed

2) TEAM MANAGEMENT
Create a Teams module with:
- team number
- team name
- team color
- captain
- members count
- faculty/program (optional)
- team status: active / inactive / disqualified / eliminated
- total points
- betting balance
- matches played
- wins
- losses
- draws

Include both:
- card view
- table view
with search, sorting, and filters.

3) CAPTAIN REGISTRATION
Create a registration flow for team captains.

Fields:
- full name
- email
- phone number
- student ID (optional)
- team selection
- password creation
- acceptance checkbox for rules

Captain account permissions:
- see own team profile
- see upcoming matches
- see team scores
- see leaderboard
- place bets if betting is enabled
- cannot edit official scores

4) COMPETITIONS / BASES
The event has:
- 15 bases on Day 1
- 15 bases on Day 2
- plus optional additional competitions

Each competition must have:
- title
- day (Day 1 / Day 2 / Extra)
- type: normal base / macro base / extra challenge
- location
- description
- point system
- active/inactive
- matchup-based or free-score-based
- order / schedule slot

Allow admins to add as many extra competitions as needed.

5) SCORING SYSTEM
Create a flexible scoring engine with these default rules:

Normal base:
- win = 1000 points
- draw = 500 points
- loss = 0 points

Macro base:
- win = 2000 points
- draw = 1000 points
- loss = 0 points

Extra competitions:
- admin can define custom point values manually

Scoring input form for admins:
- select day
- select competition
- select Team A
- select Team B (if matchup format)
- result: Team A wins / Team B wins / draw
- auto-calculate points
- optional notes
- optional penalties
- optional bonus points
- final score preview before saving
- timestamp
- admin name who entered result

Also allow another scoring mode for special competitions:
- manual points per team
- rank-based points
- custom rule competition

6) BRACKETS / MATCHUPS
Generate pairings automatically for 30 teams using seeding logic.

Default pairing example:
- Team 1 vs Team 30
- Team 2 vs Team 29
- Team 3 vs Team 28
...and so on

Requirements:
- bracket generator
- manual override by admin
- random pairing option
- seeded pairing option
- rematch prevention when possible
- visualization of current round
- winners advancing if needed
- support for round-based competition structures

7) ROTATION SYSTEM
Create a rotation engine for the 30 teams across 15 bases each day.

The app should:
- assign teams to matches and bases
- show each team where they go next
- show each base which teams are arriving
- avoid scheduling conflicts
- support rounds by time slot
- support “current round / next round”
- support real-time status:
  - pending
  - in progress
  - completed

Views needed:
- team rotation view
- base/station rotation view
- master schedule view for admins

8) BETTING SYSTEM
Create a team betting system where teams can bet on match outcomes between teams.

Betting logic:
- each team has a virtual betting balance
- admins define starting betting credits
- captains can place bets before a match closes
- they choose predicted winner or draw
- betting closes automatically before result entry
- after admin enters official result, payouts are processed automatically

Admin settings for betting:
- enable/disable betting
- fixed odds or custom odds
- minimum bet
- maximum bet
- whether teams can bet only on other teams or also on themselves
- fraud control rules

Bet data:
- who placed the bet
- match
- amount
- predicted outcome
- status: pending / won / lost / cancelled
- payout

Also create a betting leaderboard:
- richest teams
- best prediction accuracy
- most active bettors

9) PUBLIC HUB / EVENT CENTER
Create a beautiful home hub for the event with:
- hero section
- animated event branding
- live leaderboard
- today’s schedule
- current matches
- next matches
- top teams
- top bettors
- latest results
- announcements banner
- bracket preview

Visual style:
- bold gradients
- modern cards
- playful motion
- exciting sports/games atmosphere
- university festival feel
- colorful but polished
- responsive on mobile and desktop

10) LEADERBOARD
Create a live leaderboard with:
- rank
- team
- color
- points
- wins
- losses
- draws
- betting balance
- matches completed
- trend indicator up/down
- filters by Day 1 / Day 2 / overall

11) ANNOUNCEMENTS
Admins can post announcements shown in the hub:
- next round starts in 5 minutes
- base changes
- official results published
- betting closes soon
- top team updates

12) DATA MODEL
Use a clean relational structure with these entities:
- users
- roles
- captains
- teams
- competitions
- matches
- match_results
- score_rules
- rotations
- schedule_slots
- bets
- announcements
- penalties
- bonus_points
- audit_logs

13) AUDIT AND SAFETY
Include:
- action logs for admins
- confirmation modal before overwriting results
- duplicate score prevention
- permissions by role
- validation for invalid pairings
- validation for betting deadline

14) UI REQUIREMENTS
Design should look like a real event product, not a plain admin panel.

Include:
- dark/light energetic event theme
- colorful gradients
- rounded cards
- trophy icons
- podium section
- animated counters
- tabs for Day 1 / Day 2 / Overall
- beautiful tables and stats
- strong mobile experience for admins entering results on the go

15) KEY SCREENS TO GENERATE
Please create:
- Login page
- Captain registration page
- Admin dashboard
- Teams management
- Competitions management
- Matchups / brackets page
- Rotations / schedule page
- Score entry page
- Betting page
- Public leaderboard
- Public event hub
- Announcements module
- Team profile page
- Captain profile page

16) DEMO DATA
Preload demo data for:
- 30 teams
- 2 admins
- 30 competitions total (15 day 1 + 15 day 2)
- some extra competitions
- sample brackets
- sample scores
- sample bets
- sample leaderboard movement

17) TECH / PRODUCT DIRECTION
Build this as a polished MVP first.
Prioritize:
- usability
- speed
- real-time feel
- strong visual identity
- scalable structure for future phases

Future-ready considerations:
- QR team check-in
- notifications
- live screens for campus TVs
- sponsor spaces
- photo uploads from each base
- API-ready architecture


in spanish

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://games-arena-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b822c0b2-ddc3-4759-915f-e5dfe5171335).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
